/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import prisma from "./lib/db";
import { isLoggedIn } from "./lib/hooks";
import { parseWithZod } from "@conform-to/zod";
import {
  onBoardingSchemaValidation,
  settingsScheme,
  productSchema,
  shopSchemaValidation,
} from "./lib/zodSchemas";
import { redirect } from "next/navigation";

export async function OnBoardingAction(prevState: any, formData: FormData) {
  const session = await isLoggedIn();

  const submission = await parseWithZod(formData, {
    schema: onBoardingSchemaValidation({
      async isUsernameUnique() {
        const existingUsername = await prisma.user.findUnique({
          where: {
            userName: formData.get("userName") as string,
          },
        });
        return !existingUsername;
      },
    }),
    async: true,
  });

  if (submission.status !== "success") {
    return submission.reply();
  }

  const data = await prisma.user.update({
    where: {
      id: session.user?.id,
    },
    data: {
      userName: submission.value.userName,
      name: submission.value.fullName,
      role: submission.value.role,
      // Remove the Availability creation since Nylas handles this
    },
  });
  return redirect("/onboarding/grant-id");
}

export async function SettingsAction(prevState: any, formData: FormData) {
  const session = await isLoggedIn();
  const submission = parseWithZod(formData, {
    schema: settingsScheme,
  });

  if (submission.status !== "success") {
    return submission.reply();
  }

  const user = await prisma.user.update({
    where: {
      id: session.user?.id,
    },
    data: {
      name: submission.value.fullName,
      image: submission.value.profileImage,
    },
  });

  return redirect("/dashboard");
}

export async function CreateProductAction(prevState: any, formData: FormData) {
  const session = await isLoggedIn();

  const submission = parseWithZod(formData, {
    schema: productSchema,
  });

  if (submission.status !== "success") {
    return submission.reply();
  }

  const shop = await prisma.shop.findFirst({
    where: { ownerId: session.user?.id },
  });

  if (!shop) {
    return submission.reply({
      formErrors: ["Shop not found. Please create a shop first."],
    });
  }

  await prisma.product.create({
    data: {
      ...submission.value,
      shopId: shop.id,
    },
  });

  return redirect("/dashboard/business");
}

export async function CreateShopAction(prevState: any, formData: FormData) {
  const session = await isLoggedIn();

  const submission = await parseWithZod(formData, {
    schema: shopSchemaValidation({
      isShopNameUnique: async () => {
        const existingShop = await prisma.shop.findUnique({
          where: {
            name: formData.get("name") as string,
          },
        });
        return !existingShop;
      },
    }),
    async: true,
  });

  if (submission.status !== "success") {
    return submission.reply();
  }

  const userShop = await prisma.shop.findFirst({
    where: { ownerId: session.user?.id },
  });

  if (userShop) {
    return submission.reply({
      formErrors: ["You already have a shop created."],
    });
  }

  await prisma.shop.create({
    data: {
      name: submission.value.name,
      ownerId: session.user?.id,
    },
  });

  return redirect("/dashboard/business");
}

export async function DeleteProductAction(prevState: any, formData: FormData) {
  const session = await isLoggedIn();
  if (!session || !session.user?.id) {
    return {
      status: "error",
      error: { _form: ["Unauthorized"] },
    };
  }

  const productId = formData.get("productId") as string;

  if (!productId) {
    return {
      status: "error",
      error: { _form: ["Product ID is required"] },
    };
  }

  try {
    // logic check to see if product belongs to owner
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        shop: {
          ownerId: session.user.id,
        },
      },
    });

    if (!product) {
      return {
        status: "error",
        error: { _form: ["Product not found or unauthorized"] },
      };
    }

    // actual deletion
    await prisma.product.delete({
      where: {
        id: productId,
      },
    });

    return { status: "success" };
  } catch (error) {
    return {
      status: "error",
      error: { _form: ["Failed to delete product"] },
    };
  }
}