import Link from "next/link";
import { redirect } from "next/navigation";
import { UnauthHeader } from "@/components/shared/unauth-header";
import { getProfileRole, resolveDashboardPathForRole } from "@/lib/auth/role-routing";
import { createClient } from "@/lib/supabase/server";

const metrics = [
  {
    icon: "cloud_done",
    label: "CO2 Saved Today",
    value: "14,250 kg",
    delta: "+12%",
  },
  {
    icon: "local_shipping",
    label: "Active Carriers",
    value: "1,800+",
    delta: "+5%",
  },
  {
    icon: "route",
    label: "Eco-Miles Driven",
    value: "2.4M",
    delta: "+15%",
  },
];

const shipperBenefits = [
  "AI-powered route optimization",
  "Real-time CO2 impact reports",
  "Priority access to EV fleets",
];

const carrierBenefits = [
  "Backhaul load matching",
  "Fleet management dashboard",
  "Green fleet certification",
];

const pricingPlans = [
  {
    plan: "Free",
    price: "$0 / mo",
    details: "5 load posts/mo, basic CO2 score, email support",
  },
  {
    plan: "Growth",
    price: "$49 / mo",
    details: "Unlimited loads, full modal comparison, basic reports",
  },
  {
    plan: "Pro",
    price: "$149 / mo",
    details: "Everything + PDF reports, API access, carbon offset tracking",
    highlight: true,
  },
  {
    plan: "Enterprise",
    price: "Custom",
    details: "White-label, dedicated support, custom integrations",
  },
];

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const role = await getProfileRole(supabase, user.id);
    redirect(resolveDashboardPathForRole(role, "/dashboard"));
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden text-foreground">
      <UnauthHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="mx-auto grid max-w-7xl gap-12 px-6 py-12 lg:grid-cols-2 lg:px-20 lg:py-24">
          <div className="flex flex-col gap-8">
            <div className="space-y-4">
              <span className="inline-block rounded-full bg-[var(--brand)]/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-[var(--brand)]">
                The Future of Logistics
              </span>
              <h1 className="text-5xl font-bold leading-[1.1] tracking-tight text-white lg:text-7xl">
                Decarbonizing Freight,{" "}
                <span className="text-[var(--brand)]">One Load</span> at a Time
              </h1>
              <p className="max-w-lg text-lg leading-relaxed text-[var(--muted)]">
                The premier logistics platform matching shippers and carriers
                with a focus on CO2 reduction and operational efficiency.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/auth?mode=register"
                className="flex items-center gap-2 rounded-xl bg-[var(--brand)] px-8 py-4 text-lg font-bold text-[#112111] transition hover:scale-[1.02]"
              >
                Post a Load
                <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
              <Link
                href="/auth?mode=register"
                className="rounded-xl border border-white/10 bg-white/5 px-8 py-4 text-lg font-bold text-white transition hover:bg-white/10"
              >
                Find a Route
              </Link>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative group">
            <div className="absolute -inset-1 rounded-2xl bg-[var(--brand)]/20 blur-2xl transition-all group-hover:bg-[var(--brand)]/30" />
            <div className="relative overflow-hidden rounded-2xl border border-white/10 aspect-[4/3]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAPKl2qW5hc-L1UrF1pvOPwZr1nqoLsn76oqlozI1DbKrEliUitBI9URHN5DnrX2PaUG9-z2IHMU0ZXLrGRa0n7N3cd0H0pllzVcBgtbfFQVBTdENzbHRsCHwDhoccuzmE3bjPGy-GcFacrbLogLTj9fsy3lalGlQHoBGGQZY54bMsGmSFU0Q9T1Mdp_VFAR9tlKYOtK5xcxnQG5gXft3SHdYEalewtadeAdGSiRAp9FL2qHbpx_azK3IZ-ME-z_QJksEL02FwodEE"
                alt="Modern electric semi-truck driving on a scenic highway"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </section>

        {/* CO2 Ticker Section */}
        <section className="border-y border-[var(--brand)]/10 bg-[var(--brand)]/5 py-10">
          <div className="mx-auto grid max-w-7xl gap-8 px-6 md:grid-cols-3 lg:px-20">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className="flex items-center gap-5 rounded-2xl border border-[var(--brand)]/10 bg-[#0f1f0f]/70 p-6"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--brand)]/20 text-[var(--brand)]">
                  <span className="material-symbols-outlined">{metric.icon}</span>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
                    {metric.label}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-3xl font-bold text-white">{metric.value}</h3>
                    <span className="text-sm font-bold text-[var(--brand)]">{metric.delta}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works / FreightIQ Advantage Section */}
        <section id="how-it-works" className="mx-auto max-w-7xl px-6 py-24 lg:px-20">
          <div className="mb-16 space-y-4 text-center">
            <h2 className="text-4xl font-bold tracking-tight text-white">
              The FreightIQ Advantage
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-[var(--muted)]">
              Our platform simplifies logistics while prioritizing the planet
              through intelligent routing and asset optimization.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {/* For Shippers */}
            <article className="group rounded-3xl border border-white/5 bg-[var(--surface)] p-8 transition hover:border-[var(--brand)]/50">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--brand)]/10 text-[var(--brand)] transition-transform group-hover:scale-110">
                <span className="material-symbols-outlined text-4xl">inventory_2</span>
              </div>
              <h3 className="mb-4 text-2xl font-bold text-white">For Shippers</h3>
              <p className="mb-6 leading-relaxed text-[var(--muted)]">
                Post your loads and get matched with the most efficient,
                low-carbon routes and electric fleets. Reduce your Scope 3
                emissions automatically with every shipment.
              </p>
              <ul className="mb-8 space-y-3 text-sm text-white">
                {shipperBenefits.map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-sm text-[var(--brand)]">
                      check_circle
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/auth?mode=register"
                className="inline-flex items-center gap-2 font-bold text-[var(--brand)] hover:underline"
              >
                Start shipping sustainably
                <span className="material-symbols-outlined text-sm">open_in_new</span>
              </Link>
            </article>

            {/* For Carriers */}
            <article className="group rounded-3xl border border-white/5 bg-[var(--surface)] p-8 transition hover:border-[var(--brand)]/50">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--brand)]/10 text-[var(--brand)] transition-transform group-hover:scale-110">
                <span className="material-symbols-outlined text-4xl">local_shipping</span>
              </div>
              <h3 className="mb-4 text-2xl font-bold text-white">For Carriers</h3>
              <p className="mb-6 leading-relaxed text-[var(--muted)]">
                Find profitable routes, optimize your backhaul, and track your
                fleet&apos;s carbon footprint reduction. Turn your sustainability
                commitments into a competitive edge.
              </p>
              <ul className="mb-8 space-y-3 text-sm text-white">
                {carrierBenefits.map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-sm text-[var(--brand)]">
                      check_circle
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/auth?mode=register"
                className="inline-flex items-center gap-2 font-bold text-[var(--brand)] hover:underline"
              >
                Optimize your fleet
                <span className="material-symbols-outlined text-sm">open_in_new</span>
              </Link>
            </article>
          </div>
        </section>

        {/* Global Network Section */}
        <section className="bg-white/5 px-6 py-24 lg:px-20">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col items-center gap-12 lg:flex-row">
              <div className="space-y-6 lg:w-1/3">
                <h2 className="text-4xl font-bold tracking-tight text-white">
                  Global Network
                </h2>
                <p className="leading-relaxed text-[var(--muted)]">
                  Join a worldwide community of sustainable logistics partners.
                  We&apos;re currently active in 45 countries, optimizing
                  thousands of routes daily.
                </p>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[var(--brand)]">public</span>
                    <span className="font-medium text-white">45+ Countries Covered</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[var(--brand)]">hub</span>
                    <span className="font-medium text-white">12k+ Hub Connections</span>
                  </div>
                </div>
              </div>

              <div className="w-full lg:w-2/3">
                <div className="relative w-full overflow-hidden rounded-3xl border border-white/10 aspect-video">
                  <div className="absolute inset-0 z-10 bg-[var(--brand)]/5 pointer-events-none" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDeAr2xfp7R4sEjMD4KOwPg277JfCf-yg5uD-iAcTtZPFKR2QJxN4vusnL-fnDS47X_qJzpFohCZe1-WlRt-ssgyzwj-ZMi97mOqc0eY335bwGv0b-1zXQsTPnLhATK21a9Ku7GBdQqvXAw-QSZE-mVj_d_9hiRRDNqjHb2aUYrbYbcqTBNkYnIVb3fAS-mai1GPcHPk5Uao1Enfz3ft54J90sxjoz7F8XxR8cypEwzTTLETUcssvLJXGzTnuZ-vCguV9b4dx6zE3I"
                    alt="Digital representation of global logistics network map"
                    className="h-full w-full object-cover opacity-60 grayscale"
                  />
                  <div className="absolute left-1/3 top-1/2 z-20 h-4 w-4 animate-ping rounded-full bg-[var(--brand)]" />
                  <div className="absolute left-1/3 top-1/2 z-20 h-4 w-4 rounded-full bg-[var(--brand)] shadow-[0_0_20px_rgba(25,230,25,0.8)]" />
                  <div className="absolute left-2/3 top-1/3 z-20 h-3 w-3 animate-ping rounded-full bg-[var(--brand)]" />
                  <div className="absolute left-2/3 top-1/3 z-20 h-3 w-3 rounded-full bg-[var(--brand)] shadow-[0_0_20px_rgba(25,230,25,0.8)]" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="mx-auto max-w-7xl px-6 py-24 lg:px-20">
          <div className="mb-12 text-center">
            <h2 className="text-4xl font-bold tracking-tight text-white">Simple Pricing</h2>
            <p className="mt-4 text-lg text-[var(--muted)]">
              Pay-per-match or subscribe for unlimited sustainability reporting.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {pricingPlans.map(({ plan, price, details, highlight }) => (
              <article
                key={plan}
                className={`rounded-2xl border p-6 transition hover:border-[var(--brand)]/50 ${
                  highlight
                    ? "border-[var(--brand)]/40 bg-[var(--brand)]/5"
                    : "border-white/10 bg-[var(--surface)]"
                }`}
              >
                {highlight && (
                  <span className="mb-3 inline-block rounded-full bg-[var(--brand)]/20 px-3 py-0.5 text-xs font-bold uppercase tracking-widest text-[var(--brand)]">
                    Popular
                  </span>
                )}
                <h3 className="text-xl font-bold text-white">{plan}</h3>
                <p className="mt-2 text-2xl font-black text-[var(--brand)]">{price}</p>
                <p className="mt-4 text-sm leading-relaxed text-[var(--muted)]">{details}</p>
                <Link
                  href="/auth?mode=register"
                  className={`mt-6 block w-full rounded-lg py-2.5 text-center text-sm font-bold transition ${
                    highlight
                      ? "bg-[var(--brand)] text-[#112111] hover:opacity-90"
                      : "border border-white/10 text-white hover:bg-white/5"
                  }`}
                >
                  Get started
                </Link>
              </article>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#0f1f0f]/80 px-6 py-12 lg:px-20">
        <div className="mx-auto flex max-w-7xl flex-col gap-12 md:flex-row md:justify-between">
          <div className="max-w-xs space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-[var(--brand)] text-[#112111]">
                <span className="material-symbols-outlined text-sm font-bold">eco</span>
              </div>
              <h2 className="text-lg font-bold text-white">FreightIQ</h2>
            </div>
            <p className="text-sm leading-relaxed text-[var(--muted)]">
              Revolutionizing the logistics industry through data-driven
              sustainability and smart matching.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 text-sm md:grid-cols-3">
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--brand)]">
                Platform
              </h4>
              <nav className="flex flex-col gap-2 text-[var(--muted)]">
                <a href="#" className="hover:text-[var(--brand)] transition-colors">Shippers</a>
                <a href="#" className="hover:text-[var(--brand)] transition-colors">Carriers</a>
                <a href="#" className="hover:text-[var(--brand)] transition-colors">Brokerage</a>
              </nav>
            </div>
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--brand)]">
                Company
              </h4>
              <nav className="flex flex-col gap-2 text-[var(--muted)]">
                <a href="#" className="hover:text-[var(--brand)] transition-colors">About Us</a>
                <a href="#" className="hover:text-[var(--brand)] transition-colors">Sustainability</a>
                <a href="#" className="hover:text-[var(--brand)] transition-colors">Careers</a>
              </nav>
            </div>
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--brand)]">
                Legal
              </h4>
              <nav className="flex flex-col gap-2 text-[var(--muted)]">
                <a href="#" className="hover:text-[var(--brand)] transition-colors">Privacy</a>
                <a href="#" className="hover:text-[var(--brand)] transition-colors">Terms</a>
              </nav>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-12 flex max-w-7xl flex-col items-center justify-between gap-3 border-t border-white/5 pt-8 text-xs text-[var(--muted)] md:flex-row">
          <p>© 2025 FreightIQ Logistics. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-[var(--brand)] transition-colors">Twitter</a>
            <a href="#" className="hover:text-[var(--brand)] transition-colors">LinkedIn</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
