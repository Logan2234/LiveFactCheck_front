import { test, expect } from "@playwright/test";
import { HomePage } from "./pages/home.page";

test("home page shows the LFC heading @smoke", async ({ page }) => {
  const home = new HomePage(page);
  await home.goto();

  await expect(home.heading).toHaveText("LFC");
});
