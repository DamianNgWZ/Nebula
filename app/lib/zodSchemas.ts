import { conformZodMessage } from "@conform-to/zod";
import { z } from "zod";

export const zodSchema = z.object({
  fullName: z
    .string({
      required_error: "Full name is required.",
    })
    .min(3, { message: "Full name must be at least 3 characters." })
    .max(80, { message: "Full name must be less than 80 characters." }),

  userName: z
    .string({
      required_error: "Username is required.",
    })
    .min(3, { message: "Username must be at least 3 characters." })
    .max(50, { message: "Username must be less than 50 characters." })
    .regex(/^[a-zA-Z0-9_]+$/, {
      message: "Username can only contain letters, numbers, and underscores.",
    }),

  role: z.enum(["CUSTOMER", "BUSINESS_OWNER"], {
    required_error: "Please select a role.",
    invalid_type_error: "Invalid role selected.",
  }),
});

export function onBoardingSchemaValidation(options?: {
  isUsernameUnique: () => Promise<boolean>;
}) {
  return z.object({
    userName: z
      .string()
      .min(3)
      .max(150)
      .regex(/^[a-zA-Z0-9_]+$/, {
        message: "Username can only contain letters, numbers, and underscores.",
      })
      .superRefine((value, ctx) => {
        if (typeof options?.isUsernameUnique !== "function") {
          ctx.addIssue({
            code: "custom",
            message: conformZodMessage.VALIDATION_UNDEFINED,
            fatal: true,
          });
          return;
        }

        return options.isUsernameUnique().then((isUnique) => {
          if (!isUnique) {
            ctx.addIssue({
              code: "custom",
              message: "Username is already taken.",
            });
          }
        });
      }),

    fullName: z
      .string({
        required_error: "Full name is required.",
      })
      .min(3, { message: "Full name must be at least 3 characters." })
      .max(80, { message: "Full name must be less than 80 characters." }),

    role: z.enum(["CUSTOMER", "BUSINESS_OWNER"], {
      required_error: "Please select a role.",
      invalid_type_error: "Invalid role selected.",
    }),
  });
}

export const settingsScheme = z.object({
  fullName: z.string().min(3).max(150),
  profileImage: z.string(),
});

export const shopSchemaValidation = (context: {
  isShopNameUnique: () => Promise<boolean>;
}) =>
  z.object({
    name: z
      .string({
        required_error: "Shop name is required",
      })
      .min(2, { message: "Shop name must be at least 2 characters" })
      .max(100, { message: "Shop name must be less than 100 characters" })
      .superRefine(async (name, ctx) => {
        const isUnique = await context.isShopNameUnique();
        if (!isUnique) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Shop name is already taken",
          });
        }
      }),
  });

export const shopSchema = z.object({
  name: z
    .string({
      required_error: "Shop name is required",
    })
    .min(2, { message: "Shop name must be at least 2 characters" })
    .max(100, { message: "Shop name must be less than 100 characters" }),
});

export const productSchema = z.object({
  name: z
    .string({
      required_error: "Product name is required",
    })
    .min(2, { message: "Product name must be at least 2 characters" }),

  description: z
    .string()
    .max(500, { message: "Description must be under 500 characters" })
    .optional()
    .or(z.literal("")),

  price: z
    .string({
      required_error: "Price is required",
    })
    .min(1, { message: "Price is required" })
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Price must be a valid positive number",
    })
    .transform(Number),

  imageUrl: z
    .string()
    .url({ message: "Must be a valid URL" })
    .optional()
    .or(z.literal("")),
});

export const createTimeSlotTemplateSchema = z.object({
  year: z.number().int().gte(2024),
  month: z.number().int().min(1).max(12),
  slotCount: z.number().int().min(1),
  slotLength: z.number().int().min(15),
  breaks: z.array(z.string().regex(/^\d{2}:\d{2}-\d{2}:\d{2}$/)), // "HH:mm-HH:mm"
});

export const createCommentSchema = z.object({
  productId: z.string(),
  content: z.string().min(1),
  parentId: z.string().optional(),
  rating: z.number().min(1).max(5),
});
