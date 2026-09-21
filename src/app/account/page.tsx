"use client";

import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useSession } from "@/components/SessionProvider";

const PLATFORMS: { id: "youtube" | "twitter" | "instagram" | "tiktok"; label: string; matches: string }[] = [
  { id: "youtube", label: "YouTube", matches: "YOUTUBE" },
  { id: "twitter", label: "X", matches: "TWITTER" },
  { id: "instagram", label: "Instagram", matches: "INSTAGRAM" },
  { id: "tiktok", label: "TikTok", matches: "TIKTOK" },
];

export default function ConnectAccountsPage() {
  const { status, user } = useSession();
  const { openConnectModal } = useConnectModal();

  if (status === "loading") {
    return <main className="mx-auto max-w-lg px-6 py-16 text-sm text-[var(--text-muted)]">Loading…</main>;
  }

  if (status !== "authenticated") {
    return (
      <main className="mx-auto max-w-lg px-6 py-16">
        <h1 className="mb-2 text-lg font-medium">Connect accounts</h1>
        <p className="mb-5 text-sm text-[var(--text-secondary)]">
          Connect your wallet first — linked accounts attach to your marketplace profile.
        </p>
        <button
          onClick={() => openConnectModal?.()}
          className="rounded-lg bg-[var(--accent-bg)] px-4 py-2 text-sm text-[var(--accent)]"
        >
          Connect wallet
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-6 py-10">
      <h1 className="mb-1 text-lg font-medium">Connect accounts</h1>
      <p className="mb-6 text-sm text-[var(--text-secondary)]">
        Linked accounts show real follower counts on your public profile — pulled directly
        from each platform, not typed in.
      </p>

      <div className="flex flex-col gap-2.5">
        {PLATFORMS.map((p) => {
          const linked = user?.socials.find((s) => s.platform === p.matches);
          return (
            <div
              key={p.id}
              className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
            >
              <div>
                <div className="text-sm font-medium">{p.label}</div>
                {linked ? (
                  <div className="text-xs text-[var(--text-secondary)]">
                    Connected as {linked.username ?? linked.displayName ?? "—"}
                    {linked.followerCount != null && ` · ${linked.followerCount.toLocaleString()} followers`}
                  </div>
                ) : (
                  <div className="text-xs text-[var(--text-muted)]">Not connected</div>
                )}
              </div>
              {linked ? (
                <span className="rounded-full bg-[var(--accent-bg)] px-2.5 py-1 text-xs text-[var(--accent)]">
                  Connected
                </span>
              ) : (
                <a
                  href={`/backend/socials/${p.id}/start`}
                  className="rounded-lg border border-[var(--border)] px-3.5 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  Connect
                </a>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-xs text-[var(--text-muted)]">
        After connecting, this may briefly redirect somewhere unexpected before landing back
        in the marketplace — a known limitation while the backend&apos;s allowed-origins
        setting catches up to this new site.
      </p>
    </main>
  );
}
