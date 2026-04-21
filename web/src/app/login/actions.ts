"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const redirectTo = String(formData.get("redirect") || "/dashboard");

  try {
    await signIn("credentials", { email, password, redirectTo });
  } catch (err) {
    if (err instanceof AuthError) {
      redirect(`/login?error=invalid&redirect=${encodeURIComponent(redirectTo)}`);
    }
    throw err;
  }
}
