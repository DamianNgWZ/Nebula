/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";
import { isLoggedIn } from "@/app/lib/hooks";

export async function GET() {
  try {
    const session = await isLoggedIn();
    if (!session || !session.user?.id) {
      return NextResponse.json({ hasShop: false }, { status: 401 });
    }

    const shop = await prisma.shop.findFirst({
      where: { ownerId: session.user.id },
      include: {
        products: true,
        owner: true,
      },
    });

    if (!shop) {
      return NextResponse.json({ hasShop: false });
    }

    return NextResponse.json({
      hasShop: true,
      shop_id: shop.id,
      shop_name: shop.name,
      product_count: shop.products.length,
      nylas_config_id: shop.owner.grantId,
    });
  } catch (error) {
    return NextResponse.json({ hasShop: false }, { status: 500 });
  }
}
