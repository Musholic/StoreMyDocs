import {TestBed} from "@angular/core/testing";
import {GoogleDriveAuthService} from "../app/file-upload/google-drive-auth.service";
import {mock, when} from "strong-mock";
import {BaseFolderService} from "../app/file-upload/base-folder.service";
import {of} from "rxjs";

export function mockGetApiToken() {
  let authService = TestBed.inject(GoogleDriveAuthService);
  let accessTokenMock = mock<GoogleDriveAuthService['getApiToken']>();
  authService.getApiToken = accessTokenMock;
  when(() => accessTokenMock()).thenResolve('at87964');
}

export function mockFindOrCreateBaseFolder() {
  let baseFolderService = TestBed.inject(BaseFolderService);
  let findOrCreateBaseFolderMock = mock<BaseFolderService['findOrCreateBaseFolder']>();
  baseFolderService.findOrCreateBaseFolder = findOrCreateBaseFolderMock
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
