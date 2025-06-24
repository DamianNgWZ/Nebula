/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";

type ProductWithCount = {
  _count: { comments: number };
  comments: { rating: number | null }[];
  [key: string]: any;
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: shopId } = await params;

  try {
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      include: {
        owner: { select: { name: true } },
        timeslotSetting: true,
        products: {
          include: {
            comments: {
              where: { parentId: null },
              select: { rating: true },
            },
            _count: {
              select: {
                comments: {
                  where: { parentId: null },
                },
              },
            },
          },
        },
      },
    });

    if (!shop) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    let totalReviews = 0;
    let totalRating = 0;
    let ratingCount = 0;

    (shop.products as ProductWithCount[]).forEach((product) => {
      totalReviews += product._count.comments;
      product.comments.forEach((comment) => {
        if (typeof comment.rating === "number") {
          totalRating += comment.rating;
          ratingCount += 1;
        }
      });
    });

    const averageRating = ratingCount > 0 ? totalRating / ratingCount : 0;
    const products = (shop.products as ProductWithCount[]).map(
      ({ comments, ...rest }) => rest
    );

    return NextResponse.json({
      ...shop,
      products,
      totalReviews,
      averageRating: Number(averageRating.toFixed(2)),
      timeslotSetting: shop.timeslotSetting,
    });
  } catch (error) {
    console.error("Error fetching shop:", error);
    return NextResponse.json(
      { error: "Failed to fetch shop" },
      { status: 500 }
    );
  }
}
