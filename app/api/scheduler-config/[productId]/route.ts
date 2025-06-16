/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";
import { isLoggedIn } from "@/app/lib/hooks";

export async function GET(
  request: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const session = await isLoggedIn();
    if (!session || !session.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { productId } = await params;

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        shop: {
          include: {
            owner: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    let settings = {
      duration_minutes: 60,
      interval_minutes: 60,
      working_hours_start: "09:00",
      working_hours_end: "17:00",
      available_days_in_future: 30,
      min_booking_notice: 24,
    };

    if (product.shop.nylasConfigId) {
      try {
        if (product.shop.nylasConfigId.startsWith("{")) {
          const parsedSettings = JSON.parse(product.shop.nylasConfigId);
          settings = { ...settings, ...parsedSettings };
        }
      } catch (error) {
        // Use default settings if parsing fails
      }
    }

    return NextResponse.json({
      config_id: product.shop.nylasConfigId || `shop-${product.shop.id}`,
      product_id: productId,
      product_name: product.name,
      product_price: product.price,
      shop_id: product.shop.id,
      shop_name: product.shop.name,
      business_owner: product.shop.owner.name,
      settings: settings,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch scheduler config" },
      { status: 500 }
    );
  }
}
