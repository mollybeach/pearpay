"use client";

import { useState } from "react";
import { IMessageSimulator } from "./IMessageSimulator";
import { TelegramSimulator } from "./TelegramSimulator";
import { DiscordSimulator } from "./DiscordSimulator";

/**
 * Tabbed hub for the chat payment playgrounds. Switches between the iMessage,
 * Telegram and Discord simulators — one component per channel, all sharing the
 * phone frame, keyboard and payment logic.
 */

type Channel = "imessage" | "telegram" | "discord";

const TABS: { id: Channel; label: string; icon: string }[] = [
  { id: "imessage", label: "iMessage", icon: "💬" },
  { id: "telegram", label: "Telegram", icon: "✈️" },
  { id: "discord", label: "Discord", icon: "🎮" },
];

export function ChannelPlayground() {
  const [channel, setChannel] = useState<Channel>("imessage");

  return (
    <div className="flex flex-col items-center gap-7">
      {/* Channel switcher */}
      <div
        role="tablist"
        aria-label="Chat channel"
        className="flex gap-1 rounded-full border border-white/10 bg-pear-900/50 p-1"
      >
        {TABS.map((t) => {
          const active = channel === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setChannel(t.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                active
                  ? "bg-pear-500 text-pear-950 shadow-glow"
                  : "text-cream/70 hover:bg-white/5 hover:text-cream"
              }`}
            >
              <span aria-hidden className="mr-1.5">
                {t.icon}
              </span>
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Keying by channel resets each simulator's state when you switch. */}
      {channel === "imessage" ? (
        <IMessageSimulator key="imessage" />
      ) : channel === "telegram" ? (
        <TelegramSimulator key="telegram" />
      ) : (
        <DiscordSimulator key="discord" />
      )}
    </div>
  );
}
