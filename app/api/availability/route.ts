import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";
import { createTimeSlotTemplateSchema } from "@/app/lib/zodSchemas";
import { isLoggedIn } from "@/app/lib/hooks";

export async function POST(req: Request) {
  const session = await isLoggedIn();
  if (!session || !session.user?.id || session.user.role !== "BUSINESS_OWNER") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const body = await req.json();
  const parsed = createTimeSlotTemplateSchema.safeParse(body);

  if (!parsed.success) {
    return new NextResponse(JSON.stringify(parsed.error), { status: 400 });
  }

  const template = await prisma.timeSlotTemplate.create({
    data: {
      ...parsed.data,
      ownerId: session.user.id,
    },
  });

  return NextResponse.json(template);
}
