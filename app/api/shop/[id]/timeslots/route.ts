/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";
import { isLoggedIn } from "@/app/lib/hooks";
import { z } from "zod";

const timeSlotSchema = z.object({
  start: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  end: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
});

const ruleSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("date"),
    year: z.number(),
    month: z.number(),
    date: z.string(),
    slots: z.array(timeSlotSchema),
  }),
  z.object({
    type: z.literal("range"),
    year: z.number(),
    month: z.number(),
    start: z.string(),
    end: z.string(),
    slots: z.array(timeSlotSchema),
  }),
  z.object({
    type: z.literal("weekly"),
    year: z.number(),
    month: z.number().min(1).max(12),
    weekday: z.string(),
    slots: z.array(timeSlotSchema),
  }),
  z.object({
    type: z.literal("weekday"),
    year: z.number(),
    month: z.number(),
    weekday: z.string(),
    slots: z.array(timeSlotSchema),
  }),
]);

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const setting = await prisma.timeslotSetting.findUnique({
      where: { shopId: id },
    });
    return NextResponse.json(setting || { rules: [] }, {
      headers: { "Cache-Control": "no-store" },
    });
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
    const rules = z.array(ruleSchema).parse(body.rules);

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
      update: { rules },
      create: {
        shopId: id,
        rules,
      },
    });

    return NextResponse.json(setting, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid timeslot configuration" },
      { status: 400 }
    );
  }
}
