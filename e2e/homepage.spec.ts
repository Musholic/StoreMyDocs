import { expect } from '@playwright/test';
import {test} from "./fail-on-error-base";

test.describe('Home page', () => {
  test('Has title', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle("Store My Docs");
  });
})

