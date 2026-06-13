"use client";

import { useState } from "react";
import { IMessageSimulator } from "./IMessageSimulator";
import { TelegramSimulator } from "./TelegramSimulator";
import { DiscordSimulator } from "./DiscordSimulator";
import { WhatsAppSimulator } from "./WhatsAppSimulator";
import { SlackSimulator } from "./SlackSimulator";
import { XSimulator } from "./XSimulator";

/**
 * Tabbed hub for the chat payment playgrounds. Switches between the iMessage,
 * Telegram, Discord, WhatsApp, Slack and X simulators — one component per
 * channel, all sharing the phone frame, keyboard and payment logic.
 */

type Channel =
  | "imessage"
  | "telegram"
  | "discord"
  | "whatsapp"
  | "slack"
  | "x";

const TABS: { id: Channel; label: string; icon: string }[] = [
  { id: "imessage", label: "iMessage", icon: "💬" },
  { id: "telegram", label: "Telegram", icon: "✈️" },
  { id: "discord", label: "Discord", icon: "🎮" },
  { id: "whatsapp", label: "WhatsApp", icon: "🟢" },
  { id: "slack", label: "Slack", icon: "💼" },
  { id: "x", label: "X", icon: "𝕏" },
];

const SIMS: Record<Channel, React.ComponentType> = {
  imessage: IMessageSimulator,
  telegram: TelegramSimulator,
  discord: DiscordSimulator,
  whatsapp: WhatsAppSimulator,
  slack: SlackSimulator,
  x: XSimulator,
};

export function ChannelPlayground() {
  const [channel, setChannel] = useState<Channel>("imessage");
  const Sim = SIMS[channel];

  return (
    <div className="flex flex-col items-center gap-7">
      {/* Channel switcher */}
      <div
        role="tablist"
        aria-label="Chat channel"
        className="flex flex-wrap justify-center gap-1 rounded-2xl border border-white/10 bg-pear-900/50 p-1"
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
              className={`rounded-xl px-3.5 py-2 text-sm font-semibold transition sm:px-4 ${
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
      <Sim key={channel} />
    </div>
  );
}
