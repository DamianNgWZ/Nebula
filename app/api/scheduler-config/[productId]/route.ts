/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";
import { isLoggedIn } from "@/app/lib/hooks";

export async function GET(
  request: Request,
  { params }: { params: { productId: string } }
) {
  const { productId } = params;
  try {
    const session = await isLoggedIn();
    if (!session || !session.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        shop: {
          include: {
            owner: true,
            timeslotSetting: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        config_id: product.shop.nylasConfigId || `shop-${product.shop.id}`,
        product_id: productId,
        product_name: product.name,
        product_price: product.price,
        shop_id: product.shop.id,
        shop_name: product.shop.name,
        business_owner: product.shop.owner.name,
        settings: {
          rules: product.shop.timeslotSetting?.rules || [],
        },
      },
      {
        headers: { "Cache-Control": "no-store" },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch scheduler config" },
      { status: 500 }
    );
  }
}
