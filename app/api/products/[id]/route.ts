import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id: productId } = await params;

    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },
      include: {
        shop: {
          include: {
            owner: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}
