import Link from "next/link";
import { ClipboardCheck, Link2, Store, Wallet } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    icon: Store,
    title: "Browse products",
    description:
      "See every product available to promote, with its fixed commission shown upfront.",
  },
  {
    icon: ClipboardCheck,
    title: "Apply to promote",
    description:
      "Apply to the products you want to promote — the admin reviews and approves each application.",
  },
  {
    icon: Link2,
    title: "Get your link",
    description:
      "Once approved, you get a unique link for that product to share anywhere.",
  },
  {
    icon: Wallet,
    title: "Earn on delivery",
    description:
      "Earn a fixed Birr commission on every order placed through your link once it's delivered and paid for.",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-600 text-sm font-bold text-white">
              A
            </div>
            <span className="text-[15px] font-bold text-foreground">
              Affiliate Market
            </span>
          </div>
          <Link href="/sign-in" className={cn(buttonVariants())}>
            Sign in
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-4xl px-6 py-20 text-center">
          <h1 className="text-4xl leading-tight font-bold text-foreground sm:text-5xl">
            Earn a fixed commission promoting products you choose.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-ink-600">
            Apply to promote products, get your unique link once approved,
            and earn a set Birr amount on every order that's delivered — no
            confusing percentages, no fees to join.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              href="/sign-up"
              className={cn(buttonVariants({ size: "lg" }))}
            >
              Start earning
            </Link>
            <Link
              href="/sign-in"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
            >
              Sign in
            </Link>
          </div>
        </section>

        <section className="border-t border-border bg-card py-16">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="text-center text-[22px] font-bold text-foreground">
              How it works
            </h2>
            <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.title}
                    className="flex flex-col gap-3 rounded-[10px] border border-border p-5"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-[8px] bg-teal-100 text-teal-700">
                      <Icon className="h-5 w-5" />
                    </div>
                    <p className="text-xs font-semibold text-ink-400">
                      Step {index + 1}
                    </p>
                    <p className="text-[15px] font-bold text-foreground">
                      {step.title}
                    </p>
                    <p className="text-sm text-ink-600">{step.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-[10px] bg-teal-100 p-6">
              <p className="text-[15px] font-bold text-foreground">
                Fixed commission
              </p>
              <p className="mt-1 text-sm text-ink-600">
                A set Birr amount per product — you always know exactly what
                you'll earn.
              </p>
            </div>
            <div className="rounded-[10px] bg-mint-100 p-6">
              <p className="text-[15px] font-bold text-foreground">
                No fees to join
              </p>
              <p className="mt-1 text-sm text-ink-600">
                Sign up and start applying to products at no cost.
              </p>
            </div>
            <div className="rounded-[10px] bg-blue-100 p-6">
              <p className="text-[15px] font-bold text-foreground">
                Track everything
              </p>
              <p className="mt-1 text-sm text-ink-600">
                See your applications, links, and earnings in one dashboard.
              </p>
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-card py-16 text-center">
          <h2 className="text-[22px] font-bold text-foreground">
            Ready to start?
          </h2>
          <p className="mt-2 text-sm text-ink-600">
            Sign up with an email and password, an email code, or Google.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link
              href="/sign-up"
              className={cn(buttonVariants({ size: "lg" }))}
            >
              Sign up
            </Link>
            <Link
              href="/sign-in"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
            >
              Sign in
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-6 py-6 text-center text-xs text-ink-400">
        Affiliate Marketplace
      </footer>
    </div>
  );
}
