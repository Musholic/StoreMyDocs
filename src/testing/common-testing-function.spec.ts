import {TestBed} from "@angular/core/testing";
import {GoogleDriveAuthService} from "../app/file-upload/google-drive-auth.service";
import {mock, when} from "strong-mock";
import {BaseFolderService} from "../app/file-upload/base-folder.service";
import {Observable, of, tap} from "rxjs";
import {MockInstance} from "ng-mocks";

export function mockGetApiToken() {
  let accessTokenMock = MockInstance(GoogleDriveAuthService, 'getApiToken',
    mock<GoogleDriveAuthService['getApiToken']>())
  when(() => accessTokenMock()).thenResolve('at87964');
}

export function mockFindOrCreateBaseFolder() {
  let findOrCreateBaseFolderMock = MockInstance(BaseFolderService, 'findOrCreateBaseFolder',
    mock<BaseFolderService['findOrCreateBaseFolder']>())
  when(() => findOrCreateBaseFolderMock('at87964')).thenReturn(of('parentId7854'));
}

export async function findAsyncSequential<T>(
  array: T[],
  predicate: (t: T) => Promise<boolean>,
): Promise<T | undefined> {
  for (const t of array) {
    if (await predicate(t)) {
      return t;
    }
  }
  return undefined;
}

let notConsumedObservables = new Set<Observable<any>>();

export function mustBeConsumedObservable<T>(observable: Observable<T>): Observable<T> {
  notConsumedObservables.add(observable);
  return observable.pipe(tap(value => notConsumedObservables.delete(observable)));
}

export function verifyObservablesAreConsumed() {
  expect(notConsumedObservables.size).withContext("An observable was not consumed").toEqual(0);
}

export function resetObservablesAreConsumed() {
  notConsumedObservables.clear();
}
