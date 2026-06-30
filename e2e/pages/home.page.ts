import type { Page, Locator } from "@playwright/test";

/** Page Object for the live fact-checking home page. */
export class HomePage {
  readonly page: Page;
  readonly heading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole("heading", { level: 1 });
  }

  async goto() {
    await this.page.goto("/");
  }
}
