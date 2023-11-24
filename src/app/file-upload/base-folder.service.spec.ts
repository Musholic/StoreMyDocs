import {BaseFolderService} from './base-folder.service';
import {MockBuilder, MockInstance, MockRender} from "ng-mocks";
import {AppModule} from "../app.module";
import {fakeAsync, tick} from "@angular/core/testing";
import {mock, when} from "strong-mock";
import {of} from "rxjs";
import {mockFileService} from "../file-list/file.service.spec";
import {mustBeConsumedAsyncObservable} from "../../testing/common-testing-function.spec";

describe('BaseFolderService', () => {
  beforeEach(() => MockBuilder(BaseFolderService, AppModule));

  it('should be created', () => {
    // Act
    const service = MockRender(BaseFolderService).point.componentInstance;

    // Assert
    expect(service).toBeTruthy();
  });

  it('should find or create base folder', fakeAsync(() => {
    // Arrange
    let fileServiceMock = mockFileService();

    when(() => fileServiceMock.findOrCreateFolder('storemydocs.ovh'))
      .thenReturn(of('folderId51'))
    const service = MockRender(BaseFolderService).point.componentInstance;

    // Act
    let result = '';
    service.findOrCreateBaseFolder()
      .subscribe(value => result = value);

    // Assert
    tick();
    expect(result).toBe('folderId51');
  }));
});

export function mockBaseFolderService() {
  let baseFolderService = mock<BaseFolderService>();
  MockInstance(BaseFolderService, () => {
    return {
      findOrCreateBaseFolder: baseFolderService.findOrCreateBaseFolder
    }
  });
  when(() => baseFolderService.findOrCreateBaseFolder())
    .thenReturn(mustBeConsumedAsyncObservable('baseFolderId'));
  return baseFolderService;
}
