/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: shopId } = await params;

  try {
    // ...rest of your code (unchanged)
    // Fetch products with ONLY top-level comments (reviews)
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      include: {
        owner: { select: { name: true } },
        products: {
          include: {
            comments: {
              where: { parentId: null }, // ONLY top-level comments
              select: { rating: true },
            },
            _count: {
              select: {
                comments: {
                  where: { parentId: null }, // Count ONLY top-level comments
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

    // Calculate total reviews and average rating (only from top-level comments)
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
      averageRating: Number(averageRating.toFixed(2)),
    });
  } catch (error) {
    console.error("Error fetching shop:", error);
    return NextResponse.json(
      { error: "Failed to fetch shop" },
      { status: 500 }
    );
  }
}
