/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState, startTransition } from "react";
import { useForm } from "@conform-to/react";
import { useActionState } from "react";
import { parseWithZod } from "@conform-to/zod";
import { CreateProductAction, DeleteProductAction } from "@/app/actions";
import { productSchema } from "@/app/lib/zodSchemas";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/app/components/SubmitButtons";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2, Pencil, MessageCircle } from "lucide-react";
import { Product } from "@prisma/client";
import EditProductForm from "@/app/components/EditProductForm";
import CommentsAdminSection from "@/app/components/CommentsAdminSection";

type ProductFormData = z.infer<typeof productSchema>;

export default function BusinessDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [lastResult, action] = useActionState(CreateProductAction, undefined);
  const [deleteResult, deleteAction] = useActionState(
    DeleteProductAction,
    undefined
  );

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [commentsProduct, setCommentsProduct] = useState<Product | null>(null);

  const [form, fields] = useForm<ProductFormData>({
    id: "product-form",
    lastResult,
    onValidate({ formData }) {
      return parseWithZod(formData, { schema: productSchema });
    },
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
    defaultValue: {
      name: "",
      price: "",
      description: "",
      imageUrl: "",
    },
  });

  const fetchProducts = async () => {
    const res = await fetch("/api/products");
    if (res.ok) {
      const data = await res.json();
      setProducts(data.filter((p: Product) => p !== null));
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (lastResult?.status === "success") {
      fetchProducts();
      form.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastResult]);

  useEffect(() => {
    if (deleteResult?.status === "success") {
      fetchProducts();
    }
  }, [deleteResult]);

  return (
    <div className="p-6 space-y-10">
      <h1 className="text-2xl font-bold">My Products</h1>

      {/* delete errors */}
      {deleteResult?.status === "error" && deleteResult.error && (
        <div className="text-sm text-red-500 p-3 bg-red-50 rounded-md">
          {deleteResult.error._form && (
            <p>{deleteResult.error._form.join(", ")}</p>
          )}
        </div>
      )}

      <ul className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <li
            key={product.id}
            className="border p-4 rounded-xl shadow-sm space-y-2 relative"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{product.name}</h2>
              <div className="flex gap-2">
                {/* Edit icon */}
                <button
                  className="text-blue-500 hover:text-blue-700"
                  onClick={() => setEditingProduct(product)}
                  aria-label="Edit Product"
                >
                  <Pencil className="h-5 w-5" />
                </button>
                {/* Comments icon */}
                <button
                  className="text-green-600 hover:text-green-800"
                  onClick={() => setCommentsProduct(product)}
                  aria-label="View Comments"
                >
                  <MessageCircle className="h-5 w-5" />
                </button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              {product.description || "No description"}
            </p>
            <p className="text-green-600 font-medium">${product.price}</p>
            {product.imageUrl && (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full rounded"
              />
            )}

            {/* delete button with confirmation */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="w-full mt-2">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Product
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="!fixed !top-1/2 !left-1/2 !transform !-translate-x-1/2 !-translate-y-1/2 !z-[9999] !m-0">
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you SURE?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    the product &quot;{product.name}&quot; and remove it from
                    your shop.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      startTransition(() => {
                        const formData = new FormData();
                        formData.append("productId", product.id);
                        deleteAction(formData);
                      });
                    }}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete Product
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </li>
        ))}
      </ul>

      {/* Edit Product Modal */}
      {editingProduct && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30"
          style={{
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            position: "fixed",
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.3)",
            zIndex: 9999,
          }}
        >
          <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
            <h2 className="text-xl mb-3">Edit Product</h2>
            <EditProductForm
              product={editingProduct}
              onSave={async () => {
                setEditingProduct(null);
                await fetchProducts();
              }}
            />
            <button
              onClick={() => setEditingProduct(null)}
              className="mt-4 text-gray-500 underline"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Comments Modal */}
      {commentsProduct && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30"
          style={{
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            position: "fixed",
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.3)",
            zIndex: 9999,
          }}
        >
          <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl mb-3">
              Comments for {commentsProduct.name}
            </h2>
            <CommentsAdminSection
              productId={commentsProduct.id}
              onClose={() => setCommentsProduct(null)}
            />
            <button
              onClick={() => setCommentsProduct(null)}
              className="mt-4 text-gray-500 underline"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* product form */}
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">Create New Product</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            id={form.id}
            onSubmit={form.onSubmit}
            action={action}
            noValidate
            className="space-y-6"
          >
            <div className="flex flex-col gap-y-2">
              <Label htmlFor={fields.name.id}>Name</Label>
              <Input
                id={fields.name.id}
                name={fields.name.name}
                defaultValue={fields.name.initialValue}
                placeholder="Product name"
              />
              {fields.name.errors && (
                <p className="text-sm text-red-500">
                  {fields.name.errors.join(", ")}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-y-2">
              <Label htmlFor={fields.description.id}>
                Description (Optional)
              </Label>
              <Input
                id={fields.description.id}
                name={fields.description.name}
                defaultValue={fields.description.initialValue}
                placeholder="Optional description"
              />
              {fields.description.errors && (
                <p className="text-sm text-red-500">
                  {fields.description.errors.join(", ")}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-y-2">
              <Label htmlFor={fields.price.id}>Price</Label>
              <Input
                id={fields.price.id}
                name={fields.price.name}
                defaultValue={fields.price.initialValue}
                placeholder="10.99"
                type="number"
                step="0.01"
                min="0"
              />
              {fields.price.errors && (
                <p className="text-sm text-red-500">
                  {fields.price.errors.join(", ")}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-y-2">
              <Label htmlFor={fields.imageUrl.id}>Image URL (Optional)</Label>
              <Input
                id={fields.imageUrl.id}
                name={fields.imageUrl.name}
                defaultValue={fields.imageUrl.initialValue}
                placeholder="https://example.com/image.jpg"
              />
              {fields.imageUrl.errors && (
                <p className="text-sm text-red-500">
                  {fields.imageUrl.errors.join(", ")}
                </p>
              )}
            </div>

            {lastResult?.status === "error" && lastResult.error && (
              <div className="text-sm text-red-500">
                {lastResult.error._form && (
                  <p>{lastResult.error._form.join(", ")}</p>
                )}
              </div>
            )}

            <SubmitButton text="Create Product" className="w-full" />
          </form>
        </CardContent>
      </Card>
    </div>
  );
}