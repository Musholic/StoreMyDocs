import {FilesCacheService} from './files-cache.service';
import {FileOrFolderElement} from "../file-list/file-list.component";
import {MockBuilder, MockRender, ngMocks} from "ng-mocks";
import {when} from "strong-mock";
import {AppModule} from "../app.module";

describe('FilesCacheService', () => {
  beforeEach(() => MockBuilder(FilesCacheService, AppModule));

  it('should be created', () => {
    // Act
    const service = MockRender(FilesCacheService).point.componentInstance;

    // Assert
    expect(service).toBeTruthy();
  });
});

export function mockFilesCacheServiceGetBaseFolder() {
  let filesCacheService = ngMocks.findInstance(FilesCacheService);
  when(() => filesCacheService.getBaseFolder()).thenReturn('baseFolderId')
}

export function mockFilesCacheService(files: FileOrFolderElement[], mockBaseFolder: boolean = false) {
  let filesCacheService = ngMocks.findInstance(FilesCacheService);
  when(() => filesCacheService.getAll()).thenReturn(files);
  if (mockBaseFolder) {
    mockFilesCacheServiceGetBaseFolder();
  }
  return filesCacheService;
}
