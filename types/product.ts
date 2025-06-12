import { Shop, Product } from "@prisma/client";

export type ShopWithDetails = Shop & {
  owner: {
    name: string;
  };
  products: Product[];
  _count: {
    products: number;
  };
};
