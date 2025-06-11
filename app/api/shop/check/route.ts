/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";
import { isLoggedIn } from "@/app/lib/hooks";

export async function GET() {
  try {
    const session = await isLoggedIn();

    const shop = await prisma.shop.findFirst({
      where: { ownerId: session.user?.id },
    });

    return NextResponse.json({ hasShop: !!shop });
  } catch (error) {
    return NextResponse.json({ hasShop: false }, { status: 500 });
  }
}
