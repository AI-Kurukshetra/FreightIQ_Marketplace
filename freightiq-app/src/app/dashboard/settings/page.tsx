export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="mt-2 text-[var(--muted)]">Manage your account preferences and notifications.</p>
      </div>

      <div className="rounded-2xl border border-[var(--brand)]/10 bg-slate-800/40 p-8 text-center">
        <span className="material-symbols-outlined mb-4 block text-5xl text-[var(--brand)]/40">settings</span>
        <p className="text-[var(--muted)]">Settings configuration coming soon.</p>
      </div>
    </div>
  );
}
