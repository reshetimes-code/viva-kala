import { test, expect } from "@playwright/test";
import { isPhantomDateChange, LEAD_DATE_GUARD_MS } from "../src/lib/leadDateGuard";

// Cross-engine check for the lead-popup date field's phantom-"change"
// guard (see src/lib/leadDateGuard.ts and its own unit test for the pure
// logic). This does NOT reproduce iOS's native date-picker sheet - that's
// OS-level UIKit chrome no browser engine (this WebKit project included -
// it's desktop WebKit, the Safari-for-Mac engine, not mobile Safari) can
// render, and it's exactly why the original bug needed a real iPhone to
// even see. What this DOES verify, for real, in three separate JS engines:
// event dispatch + timer + performance.now() behavior around focus/change
// on a date input is sane and consistent, and the actual production guard
// function (imported from source, not reimplemented here) classifies both
// a same-tick fire and a comfortably-delayed one the way the app relies on.
// No dev server, no DB, no real invite page - a bare static fixture only.

test.beforeEach(async ({ page }) => {
  await page.setContent('<input type="date" id="d" />');
});

test("a same-tick change right after focus reads as phantom", async ({ page }) => {
  const { focusedAt, firedAt } = await page.evaluate(() => {
    return new Promise<{ focusedAt: number; firedAt: number }>((resolve) => {
      const input = document.querySelector("input")!;
      let focusedAt = 0;
      input.addEventListener("focus", () => {
        focusedAt = performance.now();
        // Simulated phantom fire: same tick as focus, no delay - exactly
        // how the real iOS bug behaves (change fires before any tap).
        input.dispatchEvent(new Event("change", { bubbles: true }));
      });
      input.addEventListener(
        "change",
        () => resolve({ focusedAt, firedAt: performance.now() }),
        { once: true }
      );
      input.focus();
    });
  });

  expect(isPhantomDateChange(focusedAt, firedAt, LEAD_DATE_GUARD_MS)).toBe(true);
});

test("a change well after focus (a real, unhurried tap) reads as genuine", async ({ page }) => {
  const { focusedAt, firedAt } = await page.evaluate(() => {
    return new Promise<{ focusedAt: number; firedAt: number }>((resolve) => {
      const input = document.querySelector("input")!;
      let focusedAt = 0;
      input.addEventListener("focus", () => {
        focusedAt = performance.now();
      });
      input.addEventListener(
        "change",
        () => resolve({ focusedAt, firedAt: performance.now() }),
        { once: true }
      );
      input.focus();
      // A human can't open a sheet, see it, and tap a day in under this -
      // stands in for a genuine, deliberate pick.
      setTimeout(() => input.dispatchEvent(new Event("change", { bubbles: true })), 600);
    });
  });

  expect(isPhantomDateChange(focusedAt, firedAt, LEAD_DATE_GUARD_MS)).toBe(false);
});
