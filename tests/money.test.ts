import { describe, expect, it } from "vitest";
import {
  formatUsdc,
  formatUsdcDisplay,
  parseUsdc,
  splitEvenly,
} from "@/lib/money";

describe("parseUsdc", () => {
  it("parses dollar strings and numbers into base units", () => {
    expect(parseUsdc("$20")).toBe(20_000_000n);
    expect(parseUsdc("20.50")).toBe(20_500_000n);
    expect(parseUsdc(5)).toBe(5_000_000n);
  });

  it("rejects malformed and non-positive amounts", () => {
    expect(() => parseUsdc("abc")).toThrow();
    expect(() => parseUsdc("0")).toThrow();
    expect(() => parseUsdc("-1")).toThrow();
  });
});

describe("formatUsdc", () => {
  it("formats base units back to readable strings", () => {
    expect(formatUsdc(20_000_000n)).toBe("20");
    expect(formatUsdc(20_500_000n)).toBe("20.5");
    expect(formatUsdcDisplay(125_000_000n)).toBe("$125");
  });
});

describe("splitEvenly", () => {
  it("splits evenly and distributes the remainder", () => {
    expect(splitEvenly(100n, 4)).toEqual([25n, 25n, 25n, 25n]);
    const split = splitEvenly(10n, 3);
    expect(split).toEqual([4n, 3n, 3n]);
    expect(split.reduce((a, b) => a + b, 0n)).toBe(10n);
  });
});
