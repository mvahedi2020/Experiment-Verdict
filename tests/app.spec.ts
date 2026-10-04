import { test, expect, type Page } from "@playwright/test";
const KEY = "experiment-verdict:v1";
async function open(page: Page) {
  await page.goto("./");
  await page.waitForLoadState("networkidle");
  await expect(
    page.getByRole("heading", { name: "Evidence before a decision." }),
  ).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}
async function draft(page: Page) {
  await page
    .getByLabel("Reviewer rationale")
    .fill(
      "Completion clears the original threshold and complaints stay within the guardrail. Proceed with a bounded next step.",
    );
  await page.getByLabel("Primary", { exact: true }).check();
  await page.getByLabel("Guardrail", { exact: true }).check();
  await page
    .getByRole("combobox", { name: "Verdict", exact: true })
    .selectOption("proceed");
  await page
    .getByRole("button", { name: "Review verdict", exact: true })
    .click();
}
async function save(page: Page) {
  await draft(page);
  await page
    .getByRole("button", { name: "Confirm verdict", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("saved locally");
}
test("primary review, cancel, immutable export, reload and withdrawal", async ({
  page,
}) => {
  await open(page);
  await draft(page);
  await expect(page.getByRole("dialog")).toContainText("Observation window");
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  expect(await page.evaluate((k) => localStorage.getItem(k), KEY)).toBeNull();
  await expect(
    page.getByRole("button", { name: "Review verdict", exact: true }),
  ).toBeFocused();
  await save(page);
  const raw = JSON.parse(
    (await page.evaluate((k) => localStorage.getItem(k), KEY))!,
  );
  expect(raw.reviews[0].snapshot.contract.minimumArm).toBe(1000);
  await page.getByLabel("Evidence fixture").selectOption("1");
  await page
    .getByRole("button", { name: "EV-E1#primary", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "EV-E1 · Balanced signal",
  );
  await expect(page.getByRole("dialog")).toContainText("Original declaration");
  await page.getByRole("button", { name: "Close snapshot" }).click();
  const dl = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export EV-V1", exact: true }).click();
  const download = await dl;
  expect(download.suggestedFilename()).toBe("EV-V1-EV-E1.json");
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream!) chunks.push(chunk);
  const output = JSON.parse(Buffer.concat(chunks).toString());
  expect(output.snapshot.evidence.id).toBe("EV-E1");
  expect(output.verdict).toBe("proceed");
  await page.reload();
  await page
    .getByRole("button", { name: "Withdraw EV-V1", exact: true })
    .click();
  await page
    .getByLabel("Withdrawal reason")
    .fill("Withdraw pending a more careful review of exposure collection.");
  await page
    .getByRole("button", { name: "Review withdrawal", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirm withdrawal", exact: true })
    .click();
  await expect(page.getByText("EV-V1 · PROCEED · WITHDRAWN")).toBeVisible();
  expect(
    JSON.parse((await page.evaluate((k) => localStorage.getItem(k), KEY))!)
      .reviews,
  ).toHaveLength(1);
});
test("harm, inconclusive and invalid fixtures cannot proceed; exploratory rule retains original", async ({
  page,
}) => {
  await open(page);
  for (const i of ["1", "2", "3", "4"]) {
    await page.getByLabel("Evidence fixture").selectOption(i);
    await expect(page.locator("option[value=proceed]")).toHaveAttribute(
      "disabled",
      "",
    );
    await expect(page.locator(".eligibility")).toBeVisible();
  }
  await page.getByLabel("Evidence fixture").selectOption("1");
  await page.getByRole("button", { name: "Explore a rule revision" }).click();
  await page.getByLabel("Complaint upper bound (pp)").fill("5");
  await page
    .getByLabel("Revision reason")
    .fill(
      "Exploratory tolerance after seeing the fictional complaint increase.",
    );
  await page
    .getByRole("button", { name: "Review revision", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirm post-result revision" })
    .click();
  await expect(
    page.getByText(
      "Exploratory EV-R2: thresholds satisfied. Original gate remains blocked.",
    ),
  ).toBeVisible();
  await expect(page.locator("option[value=proceed]")).toHaveAttribute(
    "disabled",
    "",
  );
  await page
    .getByLabel("Reviewer rationale")
    .fill(
      "Stop because the original complaint guardrail fails despite completion gains.",
    );
  await page.getByLabel("Guardrail", { exact: true }).check();
  await page
    .getByRole("combobox", { name: "Verdict", exact: true })
    .selectOption("stop");
  await page
    .getByRole("button", { name: "Review verdict", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirm verdict", exact: true })
    .click();
  const raw = JSON.parse(
    (await page.evaluate((k) => localStorage.getItem(k), KEY))!,
  );
  expect(raw.reviews[0].snapshot.originalRule.id).toBe("EV-R1");
  expect(raw.reviews[0].snapshot.activeRule.id).toBe("EV-R2");
});
test("stale verdict and reset previews reject changed bytes, compatible refresh restores", async ({
  page,
}) => {
  await open(page);
  await save(page);
  const saved = await page.evaluate((k) => localStorage.getItem(k), KEY);
  await draft(page);
  await page.evaluate(({ k, s }) => localStorage.setItem(k, s), {
    k: KEY,
    s: saved! + " ",
  });
  await page.getByRole("button", { name: "Confirm verdict" }).click();
  await expect(page.getByRole("status")).toContainText("stale");
  expect(await page.evaluate((k) => localStorage.getItem(k), KEY)).toBe(
    saved + " ",
  );
  await page
    .getByRole("button", { name: "Refresh saved evidence", exact: true })
    .click();
  await page.getByRole("button", { name: "Confirm saved refresh" }).click();
  await expect(page.getByRole("status")).toContainText("restored");
  await page.getByRole("button", { name: "Review reset", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("no undo");
  await page.evaluate(
    (k) => localStorage.setItem(k, "invalid-external-record"),
    KEY,
  );
  await page.getByRole("button", { name: "Confirm reset" }).click();
  expect(await page.evaluate((k) => localStorage.getItem(k), KEY)).toBe(
    "invalid-external-record",
  );
});
test("invalid storage preserved until explicit reset and cancellation does not alter bytes", async ({
  page,
}) => {
  await page.addInitScript(
    (k) => localStorage.setItem(k, "{invalid-original-bytes"),
    KEY,
  );
  await open(page);
  await expect(
    page.getByRole("button", { name: "Review verdict", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Review reset", exact: true }).click();
  await page.keyboard.press("Escape");
  expect(await page.evaluate((k) => localStorage.getItem(k), KEY)).toBe(
    "{invalid-original-bytes",
  );
  await page.getByRole("button", { name: "Review reset", exact: true }).click();
  await page.getByRole("button", { name: "Confirm reset" }).click();
  expect(
    JSON.parse((await page.evaluate((k) => localStorage.getItem(k), KEY))!)
      .reviews,
  ).toEqual([]);
});
for (const mode of ["getItem", "property", "setItem"])
  test(`unavailable persistence ${mode} is explained without unseen writes`, async ({
    page,
  }) => {
    await page.addInitScript(
      ({ key, mode }) => {
        localStorage.setItem(key, "preserve me");
        (window as unknown as { writes: number }).writes = 0;
        if (mode === "property")
          Object.defineProperty(window, "localStorage", {
            get() {
              throw Error("blocked property");
            },
          });
        else {
          const nativeGet = Storage.prototype.getItem;
          Storage.prototype.getItem = function (k) {
            if (k === key && mode === "getItem") throw Error("blocked read");
            if (k === key && mode === "setItem") return null;
            return nativeGet.call(this, k);
          };
          Storage.prototype.setItem = function () {
            (window as unknown as { writes: number }).writes++;
            if (mode === "setItem") throw Error("quota");
          };
        }
      },
      { key: KEY, mode },
    );
    await open(page);
    if (mode === "setItem") {
      await draft(page);
      await page.getByRole("button", { name: "Confirm verdict" }).click();
      await expect(page.getByRole("status")).toContainText("memory only");
      await expect(
        page.getByRole("button", { name: "Export EV-V1" }),
      ).toBeVisible();
    } else {
      await page
        .getByRole("button", { name: "Review reset", exact: true })
        .click();
      await expect(page.getByRole("status")).toContainText("Reset is blocked");
      expect(
        await page.evaluate(
          () => (window as unknown as { writes: number }).writes,
        ),
      ).toBe(0);
    }
  });
test("keyboard dialog traps focus, Escape cancels and returns trigger", async ({
  page,
}) => {
  await open(page);
  const trigger = page.getByRole("button", { name: "Evidence & rules" });
  await trigger.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press("Tab");
    expect(
      await page.evaluate(() => !!document.activeElement?.closest("dialog")),
    ).toBe(true);
  }
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press("Shift+Tab");
    expect(
      await page.evaluate(() => !!document.activeElement?.closest("dialog")),
    ).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
});
for (const width of [320, 390])
  test(`mobile ${width} and short screen layout`, async ({ page }) => {
    await page.setViewportSize({ width, height: 633 });
    await open(page);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await draft(page);
    await expect(
      page.getByRole("button", { name: "Confirm verdict" }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({
      path: `test-results/screenshots/mobile-${width}.png`,
      fullPage: true,
    });
  });
test("production security policy, no unexpected network, safe text and document links", async ({
  page,
}) => {
  const external: string[] = [];
  const errors: string[] = [];
  page.on("request", (r) => {
    if (
      new URL(r.url()).origin !==
      new URL(test.info().project.use.baseURL!).origin
    )
      external.push(r.url());
  });
  page.on("pageerror", (e) => errors.push(e.message));
  await open(page);
  expect(
    await page.locator("meta[name=referrer]").getAttribute("content"),
  ).toBe("no-referrer");
  expect(
    await page
      .locator("meta[http-equiv=Content-Security-Policy]")
      .getAttribute("content"),
  ).toContain("object-src 'none'");
  await page
    .getByLabel("Reviewer rationale")
    .fill(
      "<img src=x onerror=alert(1)> This literal text is a reviewer rationale.",
    );
  await page.getByLabel("Quality", { exact: true }).check();
  await page
    .getByRole("button", { name: "Review verdict", exact: true })
    .click();
  await page.getByRole("button", { name: "Confirm verdict" }).click();
  expect(await page.locator("img").count()).toBe(0);
  for (const link of await page.locator("footer a").all()) {
    const response = await page.request.get((await link.getAttribute("href"))!);
    expect(response.ok()).toBe(true);
    expect((await response.text()).trim().startsWith("# ")).toBe(true);
  }
  expect(external).toEqual([]);
  expect(errors).toEqual([]);
  await page.screenshot({ path: "test-results/screenshots/desktop.png", fullPage: true });
});

test("cleared thresholds are rejected while explicit zero is valid", async ({
  page,
}) => {
  await open(page);
  await page.getByRole("button", { name: "Explore a rule revision" }).click();
  await page.getByLabel("Primary lower bound (pp)").fill("");
  await page
    .getByLabel("Revision reason")
    .fill("Explore a deliberately conservative product threshold.");
  await page
    .getByRole("button", { name: "Review revision", exact: true })
    .click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "Enter both thresholds",
  );
  expect(await page.evaluate((k) => localStorage.getItem(k), KEY)).toBeNull();
  await page.getByLabel("Primary lower bound (pp)").fill("0");
  await page
    .getByRole("button", { name: "Review revision", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Confirm post-result revision" })
    .click();
  expect(
    JSON.parse((await page.evaluate((k) => localStorage.getItem(k), KEY))!)
      .rules[1].primary,
  ).toBe(0);
});

test("refresh preview rejects a second changed value", async ({ page }) => {
  await open(page);
  await save(page);
  await page
    .getByRole("button", { name: "Refresh saved evidence", exact: true })
    .click();
  await page.evaluate(
    (k) => localStorage.setItem(k, "second external change"),
    KEY,
  );
  await page.getByRole("button", { name: "Confirm saved refresh" }).click();
  await expect(page.getByRole("status")).toContainText("stale");
  expect(await page.evaluate((k) => localStorage.getItem(k), KEY)).toBe(
    "second external change",
  );
});

test("short withdrawal reason shows validation inside its modal", async ({
  page,
}) => {
  await open(page);
  await save(page);
  await page.getByRole("button", { name: "Withdraw EV-V1" }).click();
  await page.getByLabel("Withdrawal reason").fill("too short");
  await page
    .getByRole("button", { name: "Review withdrawal", exact: true })
    .click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText(
    "at least 20 characters",
  );
  await page.keyboard.press("Escape");
  expect(
    JSON.parse((await page.evaluate((k) => localStorage.getItem(k), KEY))!)
      .withdrawals,
  ).toEqual([]);
});

test("incomplete rationale and missing references explain why review cannot be recorded", async ({
  page,
}) => {
  await open(page);
  await page
    .getByRole("button", { name: "Review verdict", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("20–2,000");
  expect(await page.evaluate((k) => localStorage.getItem(k), KEY)).toBeNull();
  await page
    .getByLabel("Reviewer rationale")
    .fill("A careful rationale still needs evidence references.");
  await page
    .getByRole("button", { name: "Review verdict", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText(
    "select evidence references",
  );
  expect(await page.evaluate((k) => localStorage.getItem(k), KEY)).toBeNull();
});
