import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminShell } from "./admin-shell";
import { getAdminNotifications } from "@/lib/admin-notifications";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/sign-in");
  }

  // Pages also check (requireAdminPage) — see lib/auth-helpers.ts.
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const notifications = await getAdminNotifications();

  return (
    <AdminShell email={session.user.email ?? ""} notifications={notifications}>
      {children}
    </AdminShell>
  );
}
