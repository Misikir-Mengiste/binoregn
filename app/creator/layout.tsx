import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { CreatorSidebar } from "./creator-sidebar";

// Real folder (not a route group), matching app/admin's decision —
// keeps /creator/* as a genuine URL prefix.
export default async function CreatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/sign-in");
  }

  if (session.user.role !== "CREATOR") {
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
      <CreatorSidebar email={session.user.email ?? ""} />
      <div className="min-w-0 flex-1 overflow-x-hidden">
        <div className="px-6 py-6 lg:px-8 lg:py-7">{children}</div>
      </div>
    </div>
  );
}
