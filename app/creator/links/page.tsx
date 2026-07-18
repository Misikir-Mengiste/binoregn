import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CopyButton } from "@/components/copy-button";
import { PageHeader } from "@/components/page-header";

// Link path is /p/[slug] — built at app/(public)/p/[slug]/page.tsx.
export default async function CreatorLinksPage() {
  const session = await auth();
  const creatorId = session!.user.id;

  const links = await prisma.affiliateLink.findMany({
    where: { creatorId },
    orderBy: { createdAt: "desc" },
    select: {
      slug: true,
      product: {
        select: {
          name: true,
          commissionBirr: true,
          imageUrls: true,
        },
      },
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="My Links"
        description="Share these with buyers — you earn a commission on every delivered order."
      />

      <div className="overflow-hidden rounded-[10px] border border-border bg-card shadow-card">
        <div className="flex flex-col divide-y divide-border">
          {links.map((link) => (
            <div
              key={link.slug}
              className="flex items-center justify-between px-5 py-4"
            >
              <div className="flex items-center gap-3">
                {link.product.imageUrls[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={link.product.imageUrls[0]}
                    alt=""
                    className="h-11 w-11 rounded-[8px] border border-border object-cover"
                  />
                ) : (
                  <div className="h-11 w-11 rounded-[8px] bg-teal-100" />
                )}
                <div>
                  <p className="text-[13.5px] font-semibold text-foreground">
                    {link.product.name}
                  </p>
                  <p className="text-xs text-ink-600">
                    Earn {link.product.commissionBirr} Birr per delivered
                    order
                  </p>
                </div>
              </div>
              <CopyButton path={`/p/${link.slug}`} />
            </div>
          ))}
          {links.length === 0 && (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">
              No approved links yet — apply to a product on the{" "}
              <span className="font-medium text-foreground">Products</span>{" "}
              page and wait for admin approval.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
