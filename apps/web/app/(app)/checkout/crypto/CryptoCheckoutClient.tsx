"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { confirmMockPaymentAction } from "../actions";

interface CoinOption {
  symbol: string;
  name: string;
  network: string;
  address: string;
  icon: string;
}

const COINS: CoinOption[] = [
  {
    symbol: "USDT",
    name: "Tether USD",
    network: "TRON (TRC20)",
    address: "TN7z84G6KkQ5J1WvP79aL88F3e1qR3b7sU",
    icon: "₮",
  },
  {
    symbol: "BTC",
    name: "Bitcoin",
    network: "Bitcoin Native SegWit",
    address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
    icon: "₿",
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    network: "Ethereum (ERC20)",
    address: "0x71C836441F80226714560d39f7160be37e60e7E4",
    icon: "Ξ",
  },
  {
    symbol: "SOL",
    name: "Solana",
    network: "Solana Mainnet",
    address: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    icon: "◎",
  },
];

export function CryptoCheckoutClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentId = searchParams.get("paymentId") || "";
  const orderId = searchParams.get("orderId") || paymentId;
  const jobId = searchParams.get("jobId") || "";
  const amount = searchParams.get("amount") || "2.99";

  const [selectedCoin, setSelectedCoin] = useState<CoinOption>(COINS[0]!);
  const [copied, setCopied] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function handleCopyAddress() {
    navigator.clipboard.writeText(selectedCoin.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleConfirmSent() {
    setIsVerifying(true);
    setErrorMsg(null);

    const result = await confirmMockPaymentAction(paymentId);
    setIsVerifying(false);

    if (result.success) {
      if (jobId) {
        router.push(`/jobs/${jobId}?upgraded=true`);
      } else {
        router.push(`/dashboard?payment=success&ref=${orderId}`);
      }
    } else {
      setErrorMsg(result.error);
    }
  }

  return (
    <div className="max-w-md mx-auto py-8 px-4 space-y-6">
      <div className="card-paper bg-[var(--bg-raised)] p-6 rounded-lg border border-[var(--line-paper)] shadow-lg space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--line-paper)] pb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-sm">
              ⚡
            </div>
            <div>
              <h2 className="font-semibold text-sm text-[var(--text-primary)]">
                Web3 Crypto Gateway
              </h2>
              <span className="text-[10px] text-[var(--text-muted)] font-mono">
                Decentralized & Zero Chargeback
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-mono text-[var(--text-muted)] block">AMOUNT</span>
            <strong className="text-lg font-bold text-[#0A7A50] font-mono">
              ${amount} USD
            </strong>
          </div>
        </div>

        {/* Coin Selector */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-mono uppercase text-[var(--text-muted)]">
            Select Cryptocurrency:
          </label>
          <div className="grid grid-cols-2 gap-2">
            {COINS.map((coin) => (
              <button
                key={coin.symbol}
                type="button"
                onClick={() => setSelectedCoin(coin)}
                className={`p-2 rounded border text-left flex items-center gap-2 cursor-pointer transition-all ${
                  selectedCoin.symbol === coin.symbol
                    ? "border-[var(--accent-default)] bg-blue-50/30 shadow-2xs font-semibold"
                    : "border-[var(--line-paper)] hover:border-[var(--text-muted)]"
                }`}
              >
                <span className="w-6 h-6 rounded-full bg-neutral-200 dark:bg-neutral-800 text-xs flex items-center justify-center font-bold">
                  {coin.icon}
                </span>
                <div className="text-xs">
                  <span className="block text-[var(--text-primary)]">{coin.symbol}</span>
                  <span className="block text-[10px] text-[var(--text-muted)] font-mono leading-none">
                    {coin.network.split(" ")[0]}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Deposit Address Box */}
        <div className="space-y-2 bg-[var(--bg-card)] p-3.5 rounded border border-[var(--line-paper)]">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[var(--text-muted)]">Deposit Network:</span>
            <span className="font-mono font-bold text-[var(--text-primary)]">
              {selectedCoin.network}
            </span>
          </div>

          <div className="space-y-1 pt-1">
            <span className="text-[10px] font-mono uppercase text-[var(--text-muted)]">
              {selectedCoin.symbol} Transfer Address:
            </span>
            <div className="flex items-center gap-1.5">
              <input
                readOnly
                value={selectedCoin.address}
                className="w-full text-[11px] font-mono bg-white dark:bg-neutral-900 border border-[var(--line-paper)] rounded px-2.5 py-1.5 text-[var(--text-primary)] select-all"
              />
              <button
                type="button"
                onClick={handleCopyAddress}
                className="px-2.5 py-1.5 bg-[var(--bg-raised)] hover:bg-[var(--bg-subtle)] border border-[var(--line-paper)] rounded text-[11px] font-medium text-[var(--text-primary)] cursor-pointer whitespace-nowrap"
              >
                {copied ? "✓ Copied" : "Copy"}
              </button>
            </div>
          </div>
        </div>

        {/* Status Notification */}
        <div className="flex items-center gap-2 text-[11px] font-mono text-[var(--text-muted)] bg-purple-50/60 dark:bg-purple-950/20 p-2.5 rounded border border-purple-200/50 dark:border-purple-800/50">
          <span className="inline-block w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
          <span>Listening for on-chain block confirmation...</span>
        </div>

        {errorMsg && (
          <div className="rounded bg-red-50 border border-red-200 p-2.5 text-xs text-red-700">
            {errorMsg}
          </div>
        )}

        {/* Action Button */}
        <button
          type="button"
          onClick={handleConfirmSent}
          disabled={isVerifying}
          className="button-primary text-xs !py-3 w-full font-semibold cursor-pointer bg-purple-600 hover:bg-purple-700"
        >
          {isVerifying ? "Verifying Transaction..." : "I Have Sent The Crypto Payment"}
        </button>
      </div>
    </div>
  );
}
