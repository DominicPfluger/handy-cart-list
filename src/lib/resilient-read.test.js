import { describe, expect, test } from "bun:test";
import { resilientRead } from "./resilient-read";

describe("offline startup reads", () => {
  test("a stalled request returns saved data without overwriting it", async () => {
    const saved = { products: ["Milch"] };
    let writes = 0;
    let unavailable = false;
    const result = await resilientRead({
      read: () => new Promise(() => {}), timeout: 10,
      fallback: () => saved, onSuccess: () => { writes++; },
      onFailure: () => { unavailable = true; },
    });
    expect(result).toBe(saved);
    expect(writes).toBe(0);
    expect(unavailable).toBe(true);
  });
  test("first visit can open without a saved catalog when the server fails", async () => {
    const result = await resilientRead({
      read: async () => { throw new Error("HTTP 530"); }, timeout: 10,
      fallback: () => ({ products: [] }),
      onSuccess: () => { throw new Error("must not persist fallback"); }, onFailure: () => {},
    });
    expect(result.products).toEqual([]);
  });
  test("retry after recovery saves the real catalog and clears the outage", async () => {
    let unavailable = true;
    let saved = [];
    const result = await resilientRead({
      read: async () => ["Milch", "Brot"], timeout: 10, fallback: () => [],
      onSuccess: (value) => { saved = value; unavailable = false; }, onFailure: () => {},
    });
    expect(result).toEqual(["Milch", "Brot"]);
    expect(saved).toEqual(["Milch", "Brot"]);
    expect(unavailable).toBe(false);
  });
  test("late responses cannot overwrite the fallback after a timeout", async () => {
    let writes = 0;
    await resilientRead({
      read: () => new Promise((resolve) => setTimeout(() => resolve("late"), 30)),
      timeout: 5, fallback: () => "saved", onSuccess: () => { writes++; }, onFailure: () => {},
    });
    await new Promise((resolve) => setTimeout(resolve, 40));
    expect(writes).toBe(0);
  });
});