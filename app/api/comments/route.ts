import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";
import { createCommentSchema } from "@/app/lib/zodSchemas";
import { isLoggedIn } from "@/app/lib/hooks";

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
      productId: parsed.data.productId,
      userId: session.user.id,
      parentId: parsed.data.parentId,
    },
  });

  return NextResponse.json(comment);
}
