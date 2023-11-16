import {expect, test as base} from '@playwright/test';

// The following errors are excluded since they are expected with the current test environment
const excludedErrors: string[] = [
  'Failed to load resource: the server responded with a status of 403',
  'The given origin is not allowed for the given client ID.'
];

type ConsoleFixtureData = {
  messages: string[];
};

/**
 * Ensure there is no unexpected error logged in the console
 */
export const test = base.extend<ConsoleFixtureData>({
  page: async ({page}, use) => {
    const messages: string[] = [];

    page.on('console', (msg) => {
      const errorText = msg.text();

      const isError = msg.type() === 'error' && !excludedErrors.some((excluded) => errorText.includes(excluded));
      if (isError) {
        messages.push(`[${msg.type()}] ${errorText}`);
      }
    });

    // pass the modified page object to the test
    await use(page);

    // access the console messages through the fixture data
    expect(messages).toEqual([]);
  },
});
