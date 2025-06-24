import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";
import { createCommentSchema } from "@/app/lib/zodSchemas";
import { isLoggedIn } from "@/app/lib/hooks";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json({ error: "Missing productId" }, { status: 400 });
    }

    const comments = await prisma.comment.findMany({
      where: {
        productId: productId,
        parentId: null,
      },
      include: {
        user: true,
        replies: {
          include: { user: true },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const session = await isLoggedIn();
  if (!session || !session.user?.id)
    return new NextResponse("Unauthorized", { status: 401 });

  const body = await req.json();
  const parsed = createCommentSchema.safeParse(body);

  if (!parsed.success) {
    return new NextResponse(JSON.stringify(parsed.error), { status: 400 });
  }

  // Top-level comment (review)
  if (!parsed.data.parentId) {
    if (
      typeof parsed.data.rating !== "number" ||
      parsed.data.rating < 1 ||
      parsed.data.rating > 5
    ) {
      return NextResponse.json(
        { error: "Rating is required for reviews." },
        { status: 400 }
      );
    }
    // Confirmed booking check for customers
    const hasConfirmedBooking = await prisma.booking.findFirst({
      where: {
        productId: parsed.data.productId,
        customerId: session.user.id,
        status: "CONFIRMED",
      },
    });

    if (!hasConfirmedBooking) {
      return NextResponse.json(
        {
          error: "You must have a confirmed booking to comment on this product",
        },
        { status: 403 }
      );
    }
  }

  // For replies, force rating to null
  const rating = parsed.data.parentId ? null : parsed.data.rating;

  const comment = await prisma.comment.create({
    data: {
      content: parsed.data.content,
      rating: rating,
      productId: parsed.data.productId,
      userId: session.user.id,
      parentId: parsed.data.parentId,
    },
  });

  return NextResponse.json(comment);
}
