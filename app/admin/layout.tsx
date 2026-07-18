import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AdminSidebar } from "./admin-sidebar";

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

  return (
    <div className="flex min-h-screen bg-surface-100">
      <AdminSidebar email={session.user.email ?? ""} />
      <div className="min-w-0 flex-1 overflow-x-hidden">
        <div className="px-6 py-6 lg:px-8 lg:py-7">{children}</div>
      </div>
    </div>
  );
}
