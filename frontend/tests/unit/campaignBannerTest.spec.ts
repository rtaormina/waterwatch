import {
  formatDateTime,
  updateCountdown,
} from "../../src/composables/CampaignLogic";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

describe("formatDateTime Logic", () => {
  it("formatDateTime should format date correctly", () => {
    const result = formatDateTime("2023-10-01T12:00:00Z");
    expect(result).toBe("October 1, 2023 at 2:00 PM");
    const result2 = formatDateTime("2023-12-01T09:05:00Z");
    expect(result2).toBe("December 1, 2023 at 10:05 AM");
  });
});

describe("updateCountdown", () => {
  const fixedTimestamp = 1684598400000; // May 20 2023

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(fixedTimestamp);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("updateCountdown should return correct time left if time left", () => {
    const result = updateCountdown("2023-05-21T12:00:00Z");
    expect(result.hasEnded).toBe(false);
    expect(result.timeLeft).toMatch("1d 20h 0m 0s");
  });

  it("updateCountdown should return correct time left if time has ended", () => {

    const result2 = updateCountdown("2021-09-01T12:00:00Z");
    expect(result2.hasEnded).toBe(true);
    expect(result2.timeLeft).toBe("Campaign has ended!");
  });
});
