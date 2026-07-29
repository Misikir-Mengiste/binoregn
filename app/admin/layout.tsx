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

  if (session.user.role !== "ADMIN") {
    return (
      <main className="flex min-h-screen flex-1 items-center justify-center px-6">
        <p className="text-ink-600">
          You don&apos;t have access to this page.
        </p>
      </main>
    );
  }

  const notifications = await getAdminNotifications();

  return (
    <AdminShell email={session.user.email ?? ""} notifications={notifications}>
      {children}
    </AdminShell>
  );
}
