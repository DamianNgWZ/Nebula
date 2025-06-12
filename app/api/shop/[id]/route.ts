import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const shopId = params.id;

    const shop = await prisma.shop.findUnique({
      where: {
        id: shopId,
      },
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
    });

    if (!shop) {
      return NextResponse.json({ error: "Shop not found" }, { status: 404 });
    }

    return NextResponse.json(shop);
  } catch (error) {
    console.error("Error fetching shop:", error);
    return NextResponse.json(
      { error: "Failed to fetch shop" },
      { status: 500 }
    );
  }
}