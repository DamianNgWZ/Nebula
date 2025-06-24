import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerId = searchParams.get("ownerId");

    const where = ownerId ? { ownerId } : {};

    const shops = await prisma.shop.findMany({
      where,
      include: {
        _count: { select: { products: true } },
        owner: { select: { name: true } },
        products: {
          include: {
            _count: { select: { comments: true } },
          },
        },
        timeslotSetting: true,
      },
    });

    // Add totalReviews to each shop
    const shopsWithReviews = shops.map((shop) => ({
      ...shop,
      totalReviews: shop.products.reduce(
        (sum, product) => sum + product._count.comments,
        0
      ),
    }));

    return NextResponse.json(shopsWithReviews);
  } catch (error) {
    console.error("Error fetching shops:", error);
    return NextResponse.json(
      { error: "Failed to fetch shops" },
      { status: 500 }
    );
  }
}
