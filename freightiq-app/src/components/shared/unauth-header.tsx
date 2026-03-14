import Link from "next/link";

export function UnauthHeader() {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between border-b border-[var(--brand)]/10 bg-[#112111]/90 px-6 py-4 backdrop-blur lg:px-20">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--brand)] text-[#112111]">
          <span className="material-symbols-outlined font-bold">eco</span>
        </div>
        <h2 className="text-xl font-bold tracking-tight text-white">FreightIQ</h2>
      </div>

      <nav className="hidden items-center gap-8 md:flex">
        <Link
          className="text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--brand)]"
          href="/#solutions"
        >
          Solutions
        </Link>
        <Link
          className="text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--brand)]"
          href="/#how-it-works"
        >
          How it Works
        </Link>
        <Link
          className="text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--brand)]"
          href="/#pricing"
        >
          Pricing
        </Link>
        <Link
          className="text-sm font-medium text-[var(--muted)] transition-colors hover:text-[var(--brand)]"
          href="/#impact"
        >
          CO2 Impact
        </Link>
      </nav>

      <div className="flex items-center gap-4">
        <Link
          className="px-4 py-2 text-sm font-bold text-[var(--muted)] transition-colors hover:text-[var(--brand)]"
          href="/auth?mode=login"
        >
          Login
        </Link>
        <Link
          className="rounded-lg bg-[var(--brand)] px-5 py-2 text-sm font-bold text-[#112111] transition hover:bg-[var(--brand-strong)]"
          href="/auth?mode=register"
        >
          Sign Up
        </Link>
      </div>
    </header>
  );
}
