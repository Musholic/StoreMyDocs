import {BaseFolderService} from './base-folder.service';
import {MockBuilder, MockInstance, MockRender} from "ng-mocks";
import {AppModule} from "../app.module";
import {fakeAsync, tick} from "@angular/core/testing";
import {FileService} from "../file-list/file.service";
import {mock, when} from "strong-mock";
import {of} from "rxjs";

function mockFindOrCreateFolder() {
  let findOrCreateFolderMock = MockInstance(FileService, 'findOrCreateFolder', mock<FileService['findOrCreateFolder']>());
  when(() => findOrCreateFolderMock('storemydocs.ovh'))
    .thenReturn(of('folderId51'))
}

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
    mockFindOrCreateFolder();
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
