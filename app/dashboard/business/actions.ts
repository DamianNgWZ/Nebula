"use server";

import prisma from "../../lib/db";
import { isLoggedIn } from "../../lib/hooks";
import { parseWithZod } from "@conform-to/zod";
import { productSchema } from "../../lib/zodSchemas";

export async function createProductAction(prevState: any, formData: FormData) {
  const session = await isLoggedIn();

  if (!session?.user?.id) {
    throw new Error("Not authenticated");
  }

  const submission = await parseWithZod(formData, {
    schema: productSchema,
    async: true,
  });

  if (submission.status !== "success") {
    return submission.reply();
  }

  const shop = await prisma.shop.findFirst({
    where: {
      ownerId: session.user.id,
    },
  });

  if (!shop) {
    throw new Error("No shop found for this user.");
  }

  await prisma.product.create({
    data: {
      name: submission.value.name,
      description: submission.value.description,
      price: submission.value.price,
      imageUrl: submission.value.imageUrl,
      shop: {
        connect: {
          id: shop.id, // ← Must connect via shop's `id`, not `ownerId`
        },
      },
    },
  });

  return { message: "Product created successfully!" };
}
