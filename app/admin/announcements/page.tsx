import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { formatAddisDate } from "@/lib/commission/payouts";
import { AnnouncementForm } from "./announcement-form";
import { requireAdminPage } from "@/lib/auth-helpers";

export default async function AdminAnnouncementsPage() {
  await requireAdminPage();
  const [announcements, approvedCreators] = await Promise.all([
    prisma.announcement.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        title: true,
        body: true,
        createdAt: true,
        _count: { select: { notifications: true } },
      },
    }),
    prisma.user.count({
      where: { role: "CREATOR", creatorProfileStatus: "APPROVED", isActive: true },
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Announcements"
        description="Send a message to every approved creator — it appears in their dashboard notifications."
        breadcrumbs={[{ label: "Announcements" }]}
      />

      <AnnouncementForm recipients={approvedCreators} />

      <section className="overflow-hidden rounded-[10px] border border-border bg-card shadow-card">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-base font-bold text-foreground">Sent</h2>
        </div>
        {announcements.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">
            No announcements yet.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {announcements.map((announcement) => (
              <li key={announcement.id} className="flex flex-col gap-1 px-5 py-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-semibold text-foreground">
                    {announcement.title}
                  </p>
                  <p className="text-xs text-ink-400">
                    {formatAddisDate(announcement.createdAt)} ·{" "}
                    {announcement._count.notifications.toLocaleString("en-US")} creators
                  </p>
                </div>
                <p className="text-sm whitespace-pre-line text-ink-600">
                  {announcement.body}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
