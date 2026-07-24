import Link from "next/link";
import {
  ArrowUpRight,
  BadgeDollarSign,
  ClipboardCheck,
  LayoutDashboard,
  Lightbulb,
  Link2,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { BrandMark } from "@/components/logo";

const YEAR = new Date().getFullYear();

const FOOTER_COLS: { title: string; links: { label: string; href: string }[] }[] =
  [
    {
      title: "Product",
      links: [
        { label: "How it works", href: "#how-it-works" },
        { label: "For creators", href: "#for-creators" },
        { label: "Why us", href: "#why-us" },
      ],
    },
    {
      title: "Account",
      links: [
        { label: "Create account", href: "/sign-up" },
        { label: "Sign in", href: "/sign-in" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About", href: "#why-us" },
        { label: "Contact", href: "mailto:hello@binoregn.com" },
        { label: "Support", href: "mailto:support@binoregn.com" },
      ],
    },
  ];

const NAV_LINKS = [
  { label: "How it works", href: "#how-it-works" },
  { label: "For creators", href: "#for-creators" },
  { label: "Why us", href: "#why-us" },
];

const STEPS: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: Store,
    title: "Browse products",
    description:
      "See every product available to promote, each with its fixed Birr commission shown upfront.",
  },
  {
    icon: ClipboardCheck,
    title: "Apply to promote",
    description:
      "Pick the products that fit your audience and apply — each application is reviewed and approved.",
  },
  {
    icon: Link2,
    title: "Share your link",
    description:
      "Once approved you get a unique affiliate link for that product to share anywhere you post.",
  },
  {
    icon: Wallet,
    title: "Earn on delivery",
    description:
      "Earn your fixed commission on every order placed through your link once it's delivered and paid.",
  },
];

const CREATOR_POINTS: { icon: LucideIcon; title: string; description: string }[] =
  [
    {
      icon: BadgeDollarSign,
      title: "Fixed Birr commissions",
      description:
        "No confusing percentages. Every product pays a set amount you can see before you apply.",
    },
    {
      icon: ShieldCheck,
      title: "Promote what you believe in",
      description:
        "Apply only to the products that fit your audience — you choose what to put your name behind.",
    },
    {
      icon: LayoutDashboard,
      title: "Everything in one dashboard",
      description:
        "Track applications, active links, views, and pending vs. paid earnings in one place.",
    },
  ];

// DEMO DATA — placeholder marketing figures to swap for real numbers later.
const STATS: { value: string; label: string; tone: "light" | "lime" | "dark" }[] =
  [
    { value: "12k+", label: "creators earning on the platform", tone: "light" },
    { value: "100%", label: "transparent — see your commission before applying", tone: "lime" },
    { value: "540+", label: "products ready to promote across niches", tone: "dark" },
    { value: "2.4M+", label: "Birr paid out to creators so far", tone: "light" },
  ];

// DEMO DATA — placeholder brand names/logos to replace with real partners.
const DEMO_BRANDS: { name: string; icon: LucideIcon }[] = [
  { name: "Northpeak", icon: TrendingUp },
  { name: "Loopwork", icon: Sparkles },
  { name: "Cobalt", icon: ShieldCheck },
  { name: "Marigold", icon: Lightbulb },
  { name: "Vantage", icon: BadgeDollarSign },
  { name: "Everly", icon: Store },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden rounded-b-[36px] bg-gradient-to-br from-[#1f5fd0] via-[#4b8fe0] to-[#cfeafa] pb-44 text-white">
        <Sparkles className="pointer-events-none absolute -right-10 top-24 h-72 w-72 text-white/10" />

        {/* Nav */}
        <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-white/15 text-sm font-bold leading-none text-white backdrop-blur">
              B
            </span>
            <span className="text-[15px] font-bold">
              Binoregn<span className="text-[#c9f24a]">.</span>
            </span>
          </div>
          <nav className="hidden items-center gap-8 text-sm font-medium text-white/85 md:flex">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="hover:text-white">
                {link.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="hidden text-sm font-semibold text-white/90 hover:text-white sm:block"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex items-center rounded-full bg-[#c9f24a] px-4 py-2 text-sm font-semibold text-[#0f1115] transition-transform hover:-translate-y-0.5"
            >
              Get started
            </Link>
          </div>
        </header>

        {/* Hero content */}
        <div className="relative z-10 mx-auto mt-6 grid max-w-6xl items-center gap-10 px-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <h1 className="text-[40px] font-bold leading-[1.05] tracking-tight sm:text-[54px]">
              Turn your influence
              <br />
              into affiliate income
            </h1>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-white/85">
              Join a creator-first marketplace: apply to promote the products
              you believe in, share your unique link, and earn a fixed
              commission on every delivered order.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/sign-up"
                className="group inline-flex items-center gap-3 rounded-full bg-[#0f1115] py-2 pl-6 pr-2 text-sm font-semibold text-white"
              >
                Get started
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#c9f24a] text-[#0f1115] transition-transform group-hover:rotate-45">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </Link>
            </div>
            {/* DEMO rating — replace with real figures later. */}
            <div className="mt-7 flex items-center gap-3">
              <div className="flex items-center gap-0.5 text-[#c9f24a]">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <span className="text-xs font-medium text-white/85">
                Rated 4.9/5 by 4,900+ creators
              </span>
            </div>
          </div>

          {/* Preview panel (no stock photo — a product-earnings mock) */}
          <div className="relative hidden aspect-[4/3] overflow-hidden rounded-[28px] bg-gradient-to-br from-white/25 to-white/5 p-5 backdrop-blur lg:block">
            <div className="flex h-full flex-col justify-between rounded-[20px] bg-white/10 p-5">
              <div className="flex items-center justify-between text-xs text-white/80">
                <span>Your earnings</span>
                <span className="rounded-full bg-[#c9f24a] px-2 py-0.5 font-semibold text-[#0f1115]">
                  Paid
                </span>
              </div>
              <div>
                <p className="text-sm text-white/75">Commission earned</p>
                <p className="text-4xl font-bold tracking-tight">+180 Birr</p>
                <p className="mt-1 text-xs text-white/70">
                  Leather Crossbody Bag · via your link
                </p>
              </div>
              <div className="flex gap-2">
                {["Fashion", "Tech", "Beauty"].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-white/15 px-3 py-1 text-xs text-white"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ BENTO CARDS (overlapping the hero) ============ */}
      {/* relative+z-20 so these float ABOVE the positioned hero section. */}
      <section className="relative z-20 mx-auto -mt-28 max-w-6xl px-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {/* Tags card */}
          <div className="rounded-[20px] bg-card p-5 shadow-card">
            <div className="flex flex-wrap gap-1.5">
              {["Fashion", "Tech", "Beauty", "Food", "Lifestyle"].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-border px-2.5 py-1 text-[11px] font-medium text-ink-600"
                >
                  {tag}
                </span>
              ))}
            </div>
            <p className="mt-4 text-xs text-ink-400">Products for every niche</p>
            <p className="text-[26px] font-bold tracking-tight text-foreground">
              8+
            </p>
          </div>

          {/* Earnings card */}
          <div className="rounded-[20px] bg-card p-5 shadow-card">
            <div className="flex items-center justify-between">
              <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-mint-100 text-mint-500">
                <TrendingUp className="h-[18px] w-[18px]" />
              </span>
              <span className="text-xs font-semibold text-mint-500">+180</span>
            </div>
            <p className="mt-4 text-xs text-ink-400">Earned this order</p>
            <p className="text-[26px] font-bold tracking-tight text-foreground">
              180 Birr
            </p>
          </div>

          {/* Dark statement card */}
          <div className="col-span-2 flex flex-col justify-between rounded-[20px] bg-[#0f1115] p-6 text-white">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#c9f24a] text-[#0f1115]">
              <BadgeDollarSign className="h-[18px] w-[18px]" />
            </span>
            <p className="mt-6 text-[19px] font-semibold leading-snug">
              Where creators turn an engaged audience into steady, predictable
              income — one approved link at a time.
            </p>
          </div>
        </div>
      </section>

      {/* ============ POSITIONING STATEMENT ============ */}
      <section id="why-us" className="mx-auto max-w-5xl px-6 py-24 text-center">
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-400">
          <span className="h-1.5 w-1.5 rounded-full bg-[#0f1115]" />
          Why us
        </p>
        <h2 className="mx-auto mt-6 max-w-3xl text-[30px] font-bold leading-tight tracking-tight text-foreground sm:text-[40px]">
          A creator-first affiliate marketplace built to turn your audience{" "}
          <span className="inline-flex h-8 w-8 translate-y-1 items-center justify-center rounded-full bg-blue-100 text-blue-700">
            <TrendingUp className="h-4 w-4" />
          </span>{" "}
          into income you can{" "}
          <span className="inline-flex h-8 w-8 translate-y-1 items-center justify-center rounded-full bg-[#c9f24a] text-[#0f1115]">
            <Lightbulb className="h-4 w-4" />
          </span>{" "}
          actually count on.
        </h2>
      </section>

      {/* ============ STAT CARDS ============ */}
      <section className="mx-auto max-w-6xl px-6 pb-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((stat) => (
            <div
              key={stat.value + stat.label}
              className={
                stat.tone === "lime"
                  ? "flex flex-col justify-between gap-6 rounded-[20px] bg-[#c9f24a] p-6 text-[#0f1115]"
                  : stat.tone === "dark"
                    ? "flex flex-col justify-between gap-6 rounded-[20px] bg-[#0f1115] p-6 text-white"
                    : "flex flex-col justify-between gap-6 rounded-[20px] border border-border bg-card p-6"
              }
            >
              <p
                className={
                  stat.tone === "light"
                    ? "text-[34px] font-bold tracking-tight text-foreground"
                    : "text-[34px] font-bold tracking-tight"
                }
              >
                {stat.value}
              </p>
              <p
                className={
                  stat.tone === "lime"
                    ? "text-sm font-medium text-[#0f1115]/80"
                    : stat.tone === "dark"
                      ? "text-sm text-white/75"
                      : "text-sm text-ink-600"
                }
              >
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ============ BRAND LOGO STRIP (DEMO) ============ */}
      <section className="border-y border-border bg-surface-100">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <p className="text-center text-xs font-semibold uppercase tracking-wide text-ink-400">
            Promote products from brands creators love
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-5 opacity-70">
            {DEMO_BRANDS.map((brand) => {
              const Icon = brand.icon;
              return (
                <span
                  key={brand.name}
                  className="inline-flex items-center gap-2 text-ink-400"
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-[15px] font-semibold">{brand.name}</span>
                </span>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-24">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">
            How it works
          </p>
          <h2 className="mt-3 text-[30px] font-bold tracking-tight text-foreground sm:text-[38px]">
            From your first apply to your first payout.
          </h2>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className="flex flex-col gap-4 rounded-[20px] border border-border bg-card p-6 shadow-card"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-teal-100 text-teal-700">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-bold text-ink-400">
                    0{index + 1}
                  </span>
                </div>
                <p className="text-[15px] font-bold text-foreground">
                  {step.title}
                </p>
                <p className="text-sm leading-relaxed text-ink-600">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ============ FOR CREATORS ============ */}
      <section id="for-creators" className="border-t border-border bg-surface-100">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-24 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">
              For creators
            </p>
            <h2 className="mt-3 text-[30px] font-bold leading-tight tracking-tight text-foreground sm:text-[38px]">
              Built for the way creators actually earn.
            </h2>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-ink-600">
              Whether you post to a few hundred followers or a few hundred
              thousand, you promote real products, keep control over what you
              recommend, and always know exactly what you&apos;ll be paid.
            </p>
            <Link
              href="/sign-up"
              className="mt-8 inline-flex items-center gap-3 rounded-full bg-[#0f1115] py-2 pl-6 pr-2 text-sm font-semibold text-white"
            >
              Create your account
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#c9f24a] text-[#0f1115]">
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </Link>
          </div>
          <div className="flex flex-col gap-4">
            {CREATOR_POINTS.map((point) => {
              const Icon = point.icon;
              return (
                <div
                  key={point.title}
                  className="flex items-start gap-4 rounded-[20px] border border-border bg-card p-5 shadow-card"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-teal-100 text-teal-700">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-[15px] font-bold text-foreground">
                      {point.title}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-ink-600">
                      {point.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#1f5fd0] via-[#4b8fe0] to-[#7fc0ea] px-8 py-16 text-center text-white sm:px-16">
          <Sparkles className="pointer-events-none absolute -left-8 -top-8 h-56 w-56 text-white/10" />
          <h2 className="relative mx-auto max-w-2xl text-[30px] font-bold leading-tight tracking-tight sm:text-[42px]">
            Start earning from the content you already make.
          </h2>
          <p className="relative mx-auto mt-4 max-w-lg text-[15px] text-white/85">
            Continue with Google or a 6-digit email code. No fees, no password.
          </p>
          <div className="relative mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/sign-up"
              className="group inline-flex items-center gap-3 rounded-full bg-[#0f1115] py-2 pl-6 pr-2 text-sm font-semibold text-white"
            >
              Get started free
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#c9f24a] text-[#0f1115] transition-transform group-hover:rotate-45">
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </Link>
            <Link
              href="/sign-in"
              className="text-sm font-semibold text-white/90 underline-offset-4 hover:underline"
            >
              I already have an account
            </Link>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="relative overflow-hidden bg-[#0f1115] text-white">
        <div className="relative z-10 mx-auto max-w-6xl px-6 pt-16">
          <div className="grid gap-10 pb-14 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
            <div>
              <div className="flex items-center gap-2.5">
                <BrandMark className="h-9 w-9 text-sm" />
                <span className="text-[17px] font-bold tracking-tight">
                  Binoregn<span className="text-[#c9f24a]">.</span>
                </span>
              </div>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">
                Turn your influence into affiliate income — promote products
                you believe in and earn a fixed commission on every delivered
                order.
              </p>
              <Link
                href="/sign-up"
                className="mt-6 inline-flex items-center gap-3 rounded-full bg-[#c9f24a] py-2 pl-5 pr-2 text-sm font-semibold text-[#0f1115]"
              >
                Get started
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0f1115] text-[#c9f24a]">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </Link>
            </div>

            {FOOTER_COLS.map((col) => (
              <div key={col.title}>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-white/50">
                  {col.title}
                </h4>
                <ul className="mt-4 flex flex-col gap-3 text-sm">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-white/70 transition-colors hover:text-white"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 border-t border-white/10 py-6 text-sm text-white/50 sm:flex-row sm:items-center sm:justify-between">
            <p>© {YEAR} Binoregn. All rights reserved.</p>
            <div className="flex gap-6">
              <span>Privacy</span>
              <span>Terms</span>
              <span>Fixed-commission marketplace for creators</span>
            </div>
          </div>
        </div>

        {/* Bold brand wordmark as a background watermark. */}
        <p
          aria-hidden
          className="pointer-events-none select-none translate-y-[22%] text-center text-[20vw] font-black leading-none tracking-tighter text-white/[0.04]"
        >
          Binoregn
        </p>
      </footer>
    </div>
  );
}
