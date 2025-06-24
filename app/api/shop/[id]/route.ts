/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id: shopId } = params;

    // Fetch products with comment counts and ratings
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      include: {
        owner: { select: { name: true } },
        products: {
          include: {
            comments: {
              select: { rating: true },
            },
            _count: { select: { comments: true } },
          },
        },
      },
    });

    if (!shop) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    // Calculate total reviews and average rating
    let totalReviews = 0;
    let totalRating = 0;
    let ratingCount = 0;

    shop.products.forEach((product) => {
      totalReviews += product._count.comments;
      product.comments.forEach((comment) => {
        if (typeof comment.rating === "number") {
          totalRating += comment.rating;
          ratingCount += 1;
        }
      });
    });

    const averageRating = ratingCount > 0 ? totalRating / ratingCount : 0;

    const products = shop.products.map(({ comments, ...rest }) => rest);

    return NextResponse.json({
      ...shop,
      products,
      totalReviews,
      averageRating: Number(averageRating.toFixed(2)), // rounded to 2 decimals
    });
  } catch (error) {
    console.error("Error fetching shop:", error);
    return NextResponse.json(
      { error: "Failed to fetch shop" },
      { status: 500 }
    );
  }
}
