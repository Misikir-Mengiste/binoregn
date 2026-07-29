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
      "See every product available to promote, each with its fixed ETB commission shown upfront.",
  },
  {
    icon: ClipboardCheck,
    title: "Apply to promote",
    description:
      "Pick the products that fit your audience and apply. Each application is reviewed and approved.",
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
      title: "Fixed ETB commissions",
      description:
        "No confusing percentages. Every product pays a set amount you can see before you apply.",
    },
    {
      icon: ShieldCheck,
      title: "Promote what you believe in",
      description:
        "Apply only to the products that fit your audience, so you choose what to put your name behind.",
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
    { value: "100%", label: "transparent: see your commission before applying", tone: "lime" },
    { value: "540+", label: "products ready to promote across niches", tone: "dark" },
    { value: "2.4M+", label: "ETB paid out to creators so far", tone: "light" },
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

// DEMO DATA — placeholder payout rows for the hero bento card.
const DEMO_PAYOUTS = [
  { name: "Leather Crossbody Bag", date: "Paid today", amount: "+180" },
  { name: "Wireless Earbuds", date: "2 days ago", amount: "+200" },
  { name: "Power Bank 20000mAh", date: "5 days ago", amount: "+100" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ============ HERO ============ */}
      <section className="relative flex min-h-screen flex-col overflow-hidden rounded-b-3xl bg-gradient-to-br from-teal-700 via-teal-600 to-teal-500 pb-40 text-white">
        <Wallet className="pointer-events-none absolute -right-10 top-24 h-72 w-72 text-white/10" />

        {/* Floating frosted pill nav */}
        <header className="relative z-10 mx-auto mt-4 w-full max-w-6xl px-4">
          <div className="flex items-center justify-between gap-4 rounded-full border border-white/15 bg-black/20 py-2 pl-4 pr-2 shadow-lg shadow-black/10 backdrop-blur-md">
            <div className="flex items-center gap-2.5 pl-1">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 text-sm font-bold leading-none text-white">
                B
              </span>
              <span className="text-sm font-bold text-white">
                Binoregn<span className="text-teal-500">.</span>
              </span>
            </div>
            <nav className="hidden items-center gap-7 text-sm font-medium text-white/80 lg:flex">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="transition-colors hover:text-white"
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="flex items-center gap-1.5">
              <Link
                href="/sign-in"
                className="hidden px-3 text-sm font-semibold text-white/85 hover:text-white sm:block"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-teal-700 transition-transform hover:-translate-y-0.5"
              >
                Get started
              </Link>
            </div>
          </div>
        </header>

        {/* Hero content — text only; the right side is intentionally open */}
        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 items-center px-6 py-12">
          <div className="max-w-2xl">
            <h1 className="text-5xl font-bold leading-[1.02] tracking-tight sm:text-6xl">
              Turn your influence
              <br />
              into affiliate income
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-white/85">
              Join a creator-first marketplace: apply to promote the products
              you believe in, share your unique link, and earn a fixed
              commission on every delivered order.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/sign-up"
                className="group inline-flex items-center gap-3 rounded-full bg-white py-2 pl-6 pr-2 text-sm font-semibold text-teal-700"
              >
                Get started
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-600 text-white transition-transform group-hover:rotate-45">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </Link>
            </div>
            {/* DEMO rating — replace with real figures later. */}
            <div className="mt-7 flex items-center gap-3">
              <div className="flex items-center gap-0.5 text-white">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <span className="text-xs font-medium text-white/85">
                Rated 4.9/5 by 4,900+ creators
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ============ BENTO CARDS (overlapping the hero) ============ */}
      {/* relative+z-20 so these float ABOVE the positioned hero section. */}
      <section className="relative z-20 mx-auto -mt-28 max-w-6xl px-6">
        {/* Peeking widget cards (wide screens only). */}
        <div className="pointer-events-none absolute -left-6 top-6 hidden w-44 rounded-2xl bg-card p-3 shadow-card xl:block">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
              <ClipboardCheck className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs font-semibold text-foreground">Application</p>
              <p className="text-xs text-mint-500">Approved</p>
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute -right-6 bottom-8 hidden w-44 rounded-2xl bg-card p-3 shadow-card xl:block">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
              <Link2 className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs font-semibold text-foreground">My links</p>
              <p className="text-xs text-ink-400">3 active</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 items-start gap-4 lg:grid-cols-12">
          {/* Tags card */}
          <div className="relative overflow-hidden rounded-3xl bg-card p-5 shadow-card lg:col-span-3">
            <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-teal-500/20 blur-2xl" />
            <div className="relative flex flex-wrap gap-1.5">
              {["Fashion", "Tech", "Beauty", "Food", "Lifestyle"].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-border px-2.5 py-1 text-xs font-medium text-ink-600"
                >
                  {tag}
                </span>
              ))}
            </div>
            <p className="relative mt-6 text-xs text-ink-400">
              Products for every niche
            </p>
            <p className="relative text-4xl font-bold tracking-tight text-foreground">
              8+
            </p>
          </div>

          {/* Earnings card (lime accent) */}
          <div className="relative overflow-hidden rounded-3xl bg-mint-100 p-5 shadow-card lg:col-span-3">
            <div className="pointer-events-none absolute -bottom-8 -right-8 h-28 w-28 rounded-full bg-white/40 blur-2xl" />
            <div className="relative flex items-center justify-between">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-mint-500 text-white">
                <TrendingUp className="h-5 w-5" />
              </span>
              <span className="rounded-full bg-mint-500/15 px-2 py-0.5 text-xs font-semibold text-mint-500">
                +180
              </span>
            </div>
            <p className="relative mt-6 text-xs font-medium text-ink-600">
              Earned this order
            </p>
            <p className="relative text-4xl font-bold tracking-tight text-foreground">
              180 ETB
            </p>
          </div>

          {/* Dark statement card */}
          <div className="relative col-span-2 flex min-h-[220px] flex-col justify-between overflow-hidden rounded-3xl bg-teal-700 p-6 text-white lg:col-span-3">
            <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-teal-500/20 blur-3xl" />
            <div className="relative flex items-start justify-between">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-teal-600">
                <BadgeDollarSign className="h-5 w-5" />
              </span>
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white">
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </div>
            <p className="relative mt-6 text-lg font-semibold leading-snug">
              Where creators turn an engaged audience into steady, predictable
              income, one approved link at a time.
            </p>
          </div>

          {/* Payouts card */}
          <div className="relative col-span-2 overflow-hidden rounded-3xl bg-card p-5 shadow-card lg:col-span-3">
            <div className="pointer-events-none absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-teal-500/15 blur-2xl" />
            <div className="relative flex items-center justify-between">
              <p className="text-xs text-ink-400">Paid out</p>
              <p className="text-sm font-bold text-foreground">
                680{" "}
                <span className="font-medium text-ink-400">/ 1,000 ETB</span>
              </p>
            </div>
            <div className="relative mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-100">
              <div className="h-full w-2/3 rounded-full bg-teal-600" />
            </div>
            <ul className="relative mt-4 flex flex-col gap-3">
              {DEMO_PAYOUTS.map((payout) => (
                <li
                  key={payout.name}
                  className="flex items-center justify-between gap-2"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="h-6 w-6 shrink-0 rounded-full bg-surface-100" />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-foreground">
                        {payout.name}
                      </p>
                      <p className="text-xs text-ink-400">{payout.date}</p>
                    </div>
                  </div>
                  <span className="shrink-0 text-xs font-semibold text-mint-500">
                    {payout.amount}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ============ POSITIONING STATEMENT ============ */}
      <section
        id="why-us"
        className="relative overflow-hidden py-28 text-center"
      >
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-teal-100 via-surface-100 to-blue-100" />
        <div className="pointer-events-none absolute -left-24 top-4 -z-10 h-72 w-72 rounded-full bg-teal-400/25 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 bottom-4 -z-10 h-80 w-80 rounded-full bg-blue-400/25 blur-3xl" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-200/30 blur-3xl" />
        <div className="mx-auto max-w-5xl px-6">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-400">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-600" />
            Why us
          </p>
          <h2 className="mx-auto mt-6 max-w-3xl text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl">
            A creator-first affiliate marketplace built to turn your audience{" "}
            <span className="inline-flex h-8 w-8 translate-y-1 items-center justify-center rounded-full bg-blue-100 text-blue-700">
              <TrendingUp className="h-4 w-4" />
            </span>{" "}
            into income you can{" "}
            <span className="inline-flex h-8 w-8 translate-y-1 items-center justify-center rounded-full bg-teal-100 text-teal-700">
              <Lightbulb className="h-4 w-4" />
            </span>{" "}
            actually count on.
          </h2>
        </div>
      </section>

      {/* ============ STAT CARDS ============ */}
      <section className="mx-auto max-w-6xl px-6 pb-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map((stat) => (
            <div
              key={stat.value + stat.label}
              className={
                stat.tone === "lime"
                  ? "flex flex-col justify-between gap-6 rounded-2xl bg-mint-100 p-6 text-foreground"
                  : stat.tone === "dark"
                    ? "flex flex-col justify-between gap-6 rounded-2xl bg-teal-700 p-6 text-white"
                    : "flex flex-col justify-between gap-6 rounded-2xl border border-border bg-card p-6"
              }
            >
              <p
                className={
                  stat.tone === "light"
                    ? "text-4xl font-bold tracking-tight text-foreground"
                    : "text-4xl font-bold tracking-tight"
                }
              >
                {stat.value}
              </p>
              <p
                className={
                  stat.tone === "lime"
                    ? "text-sm font-medium text-ink-600"
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
                  <span className="text-sm font-semibold">{brand.name}</span>
                </span>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section id="how-it-works" className="relative overflow-hidden py-28">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-teal-100 via-surface-100 to-blue-100" />
        <div className="pointer-events-none absolute -left-24 top-4 -z-10 h-72 w-72 rounded-full bg-teal-400/25 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 bottom-4 -z-10 h-80 w-80 rounded-full bg-blue-400/25 blur-3xl" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-200/30 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-6">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">
            How it works
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            From your first apply to your first payout.
          </h2>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className="relative flex flex-col gap-4 overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-card transition-transform hover:-translate-y-1"
              >
                <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-teal-500/12 blur-2xl" />
                <div className="relative flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-100 text-teal-700">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-2xl font-bold text-ink-400/40">
                    0{index + 1}
                  </span>
                </div>
                <p className="relative text-base font-bold text-foreground">
                  {step.title}
                </p>
                <p className="relative text-sm leading-relaxed text-ink-600">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
        </div>
      </section>

      {/* ============ FOR CREATORS ============ */}
      <section
        id="for-creators"
        className="relative overflow-hidden border-t border-border"
      >
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-teal-100 via-surface-100 to-blue-100" />
        <div className="pointer-events-none absolute -left-24 top-4 -z-10 h-72 w-72 rounded-full bg-teal-400/25 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 bottom-4 -z-10 h-80 w-80 rounded-full bg-blue-400/25 blur-3xl" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-200/30 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-6 py-28 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">
              For creators
            </p>
            <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl">
              Built for the way creators actually earn.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-600">
              Whether you post to a few hundred followers or a few hundred
              thousand, you promote real products, keep control over what you
              recommend, and always know exactly what you&apos;ll be paid.
            </p>
            <Link
              href="/sign-up"
              className="mt-8 inline-flex items-center gap-3 rounded-full bg-teal-600 py-2 pl-6 pr-2 text-sm font-semibold text-white"
            >
              Create your account
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-teal-600">
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
                  className="relative flex items-start gap-4 overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-card transition-transform hover:-translate-y-1"
                >
                  <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-teal-500/10 blur-2xl" />
                  <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-100 text-teal-700">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="relative">
                    <p className="text-base font-bold text-foreground">
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
      <section className="mx-auto max-w-6xl px-6 py-28">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-700 via-teal-600 to-teal-500 px-8 py-16 text-center text-white sm:px-16">
          <Wallet className="pointer-events-none absolute -left-8 -top-8 h-56 w-56 text-white/10" />
          <h2 className="relative mx-auto max-w-2xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
            Start earning from the content you already make.
          </h2>
          <p className="relative mx-auto mt-4 max-w-lg text-sm text-white/85">
            Continue with Google or a 6-digit email code. No fees, no password.
          </p>
          <div className="relative mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/sign-up"
              className="group inline-flex items-center gap-3 rounded-full bg-white py-2 pl-6 pr-2 text-sm font-semibold text-teal-700"
            >
              Get started free
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-600 text-white transition-transform group-hover:rotate-45">
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
                <span className="text-lg font-bold tracking-tight">
                  Binoregn<span className="text-teal-500">.</span>
                </span>
              </div>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">
                Turn your influence into affiliate income. Promote products
                you believe in and earn a fixed commission on every delivered
                order.
              </p>
              <Link
                href="/sign-up"
                className="mt-6 inline-flex items-center gap-3 rounded-full bg-teal-600 py-2 pl-5 pr-2 text-sm font-semibold text-white"
              >
                Get started
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-teal-600">
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
