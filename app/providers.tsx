"use client";

import { createConfig, http, WagmiProvider } from "wagmi";
import { injected, walletConnect } from "wagmi/connectors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { defineChain } from "viem";

const arcMainnet = defineChain({
  id: 5042,
  name: "Arc",
  nativeCurrency: {
    name: "USDC",
    symbol: "USDC",
    decimals: 6,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.mainnet.arc.io"],
    },
  },
  blockExplorers: {
    default: {
      name: "ArcScan",
      url: "https://explorer.arc.io",
    },
  },
  testnet: false,
});

const config = createConfig({
  chains: [arcMainnet],
  connectors: [
    injected(),
    walletConnect({
      projectId: "92dd7e3853740570d6fdf91afe366a2e",
      showQrModal: true,
    }),
  ],
  transports: {
    [arcMainnet.id]: http("https://rpc.mainnet.arc.io"),
  },
  pollingInterval: 10000,
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10000,
      retry: 1,
    },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}