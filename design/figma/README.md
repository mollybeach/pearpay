# Pear Pay — Figma design files

These are **importable design files** for the Pear Pay app. Figma can't be
authored as a native `.fig` outside the app, so each screen is an **SVG** that
Figma imports as a **fully editable frame** (vector shapes + live text layers),
built from the app's real tokens (`tailwind.config.ts`).

## Files

| File | Frame | Screen |
|------|-------|--------|
| `00-design-system.svg` | 1440×1700 | Color palette, type scale, buttons, payment card, badges, channel tabs, inputs |
| `01-home.svg` | 1440×1700 | Landing page — hero, features grid, channels |
| `02-simulator.svg` | 1440×1024 | The `/messages` Simulator — gray backdrop + iMessage phone with settled card |
| `03-try-it.svg` | 1440×1320 | `/pay` — live on-chain wallet flow (Base Sepolia) + natural-language demo |
| `04-prizes.svg` | 1440×1200 | `/prizes` — sponsor prize tabs (Finalist / Arc / Dynamic / Unlink) |
| `05-claim.svg` | 1440×900 | The public claim page (`/claim/:token`) |

## How to import into Figma

1. New Figma file → **File ▸ Place image…** *(or just drag the `.svg` onto the canvas)*.
2. Figma converts each SVG into a frame of editable vectors and text — recolor,
   restyle, and re-layout freely.
3. Repeat per file; rename the top frame to the screen name. Drop them on one
   page as your screen flow.
4. To turn the swatches/components in `00-design-system.svg` into a real Figma
   library: select a color rect → **right panel ▸ Fill ▸ + (style)**; select the
   payment card / buttons → **Create component (⌥⌘K)**.

> Tip: import `00-design-system.svg` **first** and publish its colors/text as
> styles, then the screen frames will be trivial to keep on-brand.

## Design tokens (source of truth: `tailwind.config.ts`)

### Color — pear palette
| Token | Hex | Use |
|-------|-----|-----|
| pear-50 | `#f2fbe7` | logo badge bg |
| pear-100 | `#e3f6cb` | |
| pear-200 | `#c9ed9c` | |
| pear-300 | `#aade63` | settled accents |
| pear-400 | `#92cf3f` | bright lime accent / links |
| **pear-500** | **`#74b327`** | **primary ("Pay") button** |
| pear-600 | `#598c1d` | |
| pear-700 | `#446a1b` | |
| pear-800 | `#39551c` | |
| pear-900 | `#16301a` | deep-forest cards |
| pear-950 | `#0a1f12` | **page background** |
| leaf | `#2e6b2e` | |
| cream | `#eafff3` | **primary text** |

Common surfaces are `pear-900 @ 40%` cards on a `pear-950` page, hairline
borders at `white @ 10%`, and a glow shadow `0 0 60px -10px rgba(116,179,39,.45)`.

### Typography — system UI
`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`

| Role | Size / weight |
|------|---------------|
| Display | 60 / 800 |
| Heading | 36 / 700 |
| Subhead | 18 / 600 |
| Body | 16 / 400 (cream @ 75%) |
| Caption | 12 / uppercase, tracking |

### Radii & spacing
Cards `rounded-2xl` (~18px) · pills/inputs `rounded-xl` (~14px) · chips
`rounded-full`. Page gutters 80px (desktop), section padding 64–80px.

### Channel accent colors (for the Simulator screens)
iMessage blue `#2c7cf6` · Telegram `#3390ec` · Discord `#5865f2` /
`#313338` · WhatsApp `#25d366` / `#075e54` · Slack `#007a5a` / `#1a1d21` ·
X `#1d9bf0` / `#000`.

---
Regenerate or extend these any time — they're plain SVG, so they stay in sync
with the codebase by editing the values above.
