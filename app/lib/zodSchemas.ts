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
