import { test } from "node:test";
import assert from "node:assert/strict";
import { isPhantomDateChange, LEAD_DATE_GUARD_MS } from "./leadDateGuard.ts";

test("same-tick fire (0ms) is treated as phantom", () => {
  assert.equal(isPhantomDateChange(1000, 1000, LEAD_DATE_GUARD_MS), true);
});

test("fire just under the guard window is treated as phantom", () => {
  assert.equal(isPhantomDateChange(1000, 1000 + LEAD_DATE_GUARD_MS - 1, LEAD_DATE_GUARD_MS), true);
});

test("fire exactly at the guard window is treated as genuine", () => {
  assert.equal(isPhantomDateChange(1000, 1000 + LEAD_DATE_GUARD_MS, LEAD_DATE_GUARD_MS), false);
});

test("fire well after the guard window (a real, unhurried tap) is genuine", () => {
  assert.equal(isPhantomDateChange(1000, 1000 + 2000, LEAD_DATE_GUARD_MS), false);
});

test("a clock that somehow runs backward never reads as genuine", () => {
  // firedAt - focusedAt goes negative, which is < guardMs either way -
  // documenting the behavior explicitly rather than leaving it implicit.
  assert.equal(isPhantomDateChange(2000, 1000, LEAD_DATE_GUARD_MS), true);
});
