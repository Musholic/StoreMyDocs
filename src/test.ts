import {resetAll, verifyAll} from "strong-mock";

import {getTestBed} from '@angular/core/testing';
import {BrowserDynamicTestingModule, platformBrowserDynamicTesting,} from '@angular/platform-browser-dynamic/testing';
import {resetObservablesAreConsumed, verifyObservablesAreConsumed} from "./testing/common-testing-function.spec";

// Initialize the Angular testing environment.
getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting(), {
  errorOnUnknownElements: true,
  errorOnUnknownProperties: true
});

beforeEach(() => {
  resetAll();
  resetObservablesAreConsumed();
})

afterEach(() => {
  verifyAll();
  verifyObservablesAreConsumed();
})
