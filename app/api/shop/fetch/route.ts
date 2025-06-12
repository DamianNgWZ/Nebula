import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";

export async function GET() {
  try {
    const shops = await prisma.shop.findMany({
      include: {
        owner: {
          select: {
            name: true,
          },
        },
        products: true,
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(shops);
  } catch (error) {
    console.error("Error fetching shops:", error);
    return NextResponse.json(
      { error: "Failed to fetch shops" },
      { status: 500 }
    );
  }
}