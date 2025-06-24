import { NextResponse } from "next/server";
import prisma from "@/app/lib/db";
import { isLoggedIn } from "@/app/lib/hooks";

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

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await isLoggedIn();
  if (!session || session.user?.role !== "BUSINESS_OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, description, price } = await req.json();
  const updated = await prisma.product.update({
    where: { id },
    data: { name, description, price },
  });

  return NextResponse.json(updated);
}
