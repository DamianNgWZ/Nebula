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
        parentId: null, // top-level comments
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

  const comment = await prisma.comment.create({
    data: {
      content: parsed.data.content,
      rating: parsed.data.rating,
      productId: parsed.data.productId,
      userId: session.user.id,
      parentId: parsed.data.parentId,
    },
  });

  return NextResponse.json(comment);
}
