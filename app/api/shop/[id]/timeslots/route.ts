/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";
import { isLoggedIn } from "@/app/lib/hooks";
import { z } from "zod";

const timeslotSchema = z.object({
  days: z.record(
    z.string(),
    z.array(
      z.object({
        start: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
        end: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
      })
    )
  ),
  interval: z.number().min(15).max(120),
});

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const setting = await prisma.timeslotSetting.findUnique({
      where: { shopId: id },
    });

    return NextResponse.json(
      setting || {
        days: {},
        interval: 60,
      }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch timeslot settings" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await isLoggedIn();

  if (!session || session.user?.role !== "BUSINESS_OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validated = timeslotSchema.parse(body);

    const shop = await prisma.shop.findFirst({
      where: {
        id,
        ownerId: session.user.id,
      },
    });

    if (!shop) {
      return NextResponse.json(
        { error: "Shop not found or access denied" },
        { status: 403 }
      );
    }

    const setting = await prisma.timeslotSetting.upsert({
      where: { shopId: id },
      update: validated,
      create: {
        shopId: id,
        ...validated,
      },
    });

    return NextResponse.json(setting);
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid timeslot configuration" },
      { status: 400 }
    );
  }
}
