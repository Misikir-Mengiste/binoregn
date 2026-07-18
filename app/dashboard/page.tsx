import { redirect } from "next/navigation";
import { auth } from "@/auth";

// Single role-aware landing spot after any sign-in method (OTP,
// password, Google) — used as the universal post-sign-in
// destination so the redirect logic exists in exactly one place
// instead of being duplicated (and drifting) across three sign-in
// flows.
export default async function DashboardRedirect() {
  const session = await auth();
  if (!session?.user) {
    redirect("/sign-in");
  }
  redirect(session.user.role === "ADMIN" ? "/admin" : "/creator");
}
