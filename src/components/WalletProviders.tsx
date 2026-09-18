"use client";

import type { ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  RainbowKitAuthenticationProvider,
  RainbowKitProvider,
  darkTheme,
} from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";

import { config } from "@/lib/wagmi";
import { authenticationAdapter } from "@/lib/auth-adapter";
import { SessionProvider, useSession } from "@/components/SessionProvider";

const queryClient = new QueryClient();

function AuthBridge({ children }: { children: ReactNode }) {
  const { status, refresh, setUnauthenticated } = useSession();

  return (
    <RainbowKitAuthenticationProvider
      adapter={{
        ...authenticationAdapter,
        verify: async (args) => {
          const ok = await authenticationAdapter.verify(args);
          if (ok) await refresh();
          return ok;
        },
        signOut: async () => {
          await authenticationAdapter.signOut();
          setUnauthenticated();
        },
      }}
      status={status}
    >
      <RainbowKitProvider
        theme={darkTheme({ accentColor: "#7c5cff", accentColorForeground: "white", borderRadius: "medium" })}
      >
        {children}
      </RainbowKitProvider>
    </RainbowKitAuthenticationProvider>
  );
}

export function WalletProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        <SessionProvider>
          <AuthBridge>{children}</AuthBridge>
        </SessionProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}
