"use client";

import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Zap, PlusCircle, ShieldCheck } from "lucide-react";
import { useSession } from "@/components/SessionProvider";

const NAV = [
  { href: "/", label: "Browse listings", icon: Zap },
  { href: "/listings/new", label: "Create your own listing", icon: PlusCircle },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useSession();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-[var(--border)] px-5 py-6 md:flex">
      <div className="mb-1">
        <div className="font-logo text-xl leading-tight text-[var(--text-primary)]">Late Night</div>
        <div className="font-logo text-xl leading-tight text-[var(--spotlight)]">Marketplace</div>
      </div>
      <div className="mb-8 text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
        The marketplace for attention
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <a
              key={item.href}
              href={item.href}
              className={
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm " +
                (active
                  ? "bg-[var(--violet-bg)] text-[var(--text-primary)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]")
              }
            >
              <Icon size={16} strokeWidth={2} />
              {item.label}
            </a>
          );
        })}
        {user?.role === "SUPERADMIN" && (
          <a
            href="/review"
            className={
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm " +
              (pathname === "/review"
                ? "bg-[var(--violet-bg)] text-[var(--text-primary)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]")
            }
          >
            <ShieldCheck size={16} strokeWidth={2} />
            Review queue
          </a>
        )}
      </nav>

      <div className="mt-auto">
        <a
          href="/account"
          className="mb-2 block text-center text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
        >
          Connect accounts
        </a>
        <ConnectButton.Custom>
          {({ account, openConnectModal, openAccountModal, mounted }) => {
            const connected = mounted && account;
            return (
              <button
                onClick={connected ? openAccountModal : openConnectModal}
                className="w-full rounded-lg border border-[var(--border-strong)] px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                {connected ? account.displayName : "Connect wallet"}
              </button>
            );
          }}
        </ConnectButton.Custom>
      </div>
    </aside>
  );
}
