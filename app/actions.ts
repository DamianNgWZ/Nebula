"use server";

import prisma from "./lib/db";
import { isLoggedIn } from "./lib/hooks";
import { parseWithZod } from "@conform-to/zod";
import { onBoardingSchemaValidation, settingsScheme } from "./lib/zodSchemas";
import { redirect } from "next/navigation";

export async function OnBoardingAction(prevState: any, formData: FormData) {
  const session = await isLoggedIn();

  const submission = await parseWithZod(formData, {
    schema: onBoardingSchemaValidation({
      async isUsernameUnique() {
        const existingUsername = await prisma.user.findUnique({
          where: {
            userName: formData.get("userName") as string,
          },
        });
        return !existingUsername;
      },
    }),
    async: true,
  });

  if (submission.status !== "success") {
    return submission.reply();
  }

  const data = await prisma.user.update({
    where: {
      id: session.user?.id,
    },
    data: {
      userName: submission.value.userName,
      name: submission.value.fullName,
      Availability: {
        create: [
          {
            day: "Monday",
            fromTime: "08:00",
            tillTime: "18:00",
          },
          {
            day: "Tuesday",
            fromTime: "08:00",
            tillTime: "18:00",
          },
          {
            day: "Wednesday",
            fromTime: "08:00",
            tillTime: "18:00",
          },
          {
            day: "Thursday",
            fromTime: "08:00",
            tillTime: "18:00",
          },
          {
            day: "Friday",
            fromTime: "08:00",
            tillTime: "18:00",
          },
          {
            day: "Saturday",
            fromTime: "08:00",
            tillTime: "18:00",
          },
          {
            day: "Sunday",
            fromTime: "08:00",
            tillTime: "18:00",
          },
        ],
      },
      role: submission.value.role,
    },
  });
  return redirect("/onboarding/grant-id");
}

export async function SettingsAction(prevState: any, formData: FormData) {
  const session = await isLoggedIn();
  const submission = await parseWithZod(formData, {
    schema: settingsScheme,
  });

  if (submission.status !== "success") {
    return submission.reply();
  }

  const user = await prisma.user.update({
    where: {
      id: session.user?.id,
    },
    data: {
      name: submission.value.fullName,
      image: submission.value.profileImage,
    },
  });

  return redirect("/dashboard");
}
