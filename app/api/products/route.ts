import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";
import { productSchema } from "@/app/lib/zodSchemas";
import { isLoggedIn } from "@/app/lib/hooks";

export async function POST(req: Request) {
  const session = await isLoggedIn();
  if (!session || !session.user?.id)
    return new NextResponse("Unauthorized", { status: 401 }); //unauthorized

  const body = await req.json();
  const parsed = productSchema.safeParse(body);

  if (!parsed.success) {
    return new NextResponse(JSON.stringify(parsed.error), { status: 400 }); //bad req error
  }

  const { name, description, price, imageUrl } = parsed.data;

  // one shop per biz owner
  const shop = await prisma.shop.findFirst({
    where: { ownerId: session.user.id },
  });

  if (!shop) {
    return new NextResponse("Shop not found", { status: 404 }); //cannot find page
  }

  const product = await prisma.product.create({
    data: {
      name,
      description,
      price,
      imageUrl,
      shopId: shop.id,
    },
  });

  return NextResponse.json(product);
}

export async function GET() {
  const products = await prisma.product.findMany({
    include: {
      shop: {
        include: {
          owner: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  return NextResponse.json(products);
}
