import {UserRootComponent} from './user-root.component';
import {MockBuilder, MockRender, ngMocks} from "ng-mocks";
import {AppModule} from "../app.module";
import {FileOrFolderElement} from "../file-list/file-list.component";
import {FilesCache} from "../resolver/files.resolver";
import {when} from "strong-mock";

describe('UserRootComponent', () => {
  beforeEach(() => MockBuilder(UserRootComponent, AppModule))

  it('should create', () => {
    let component = MockRender(UserRootComponent).point.componentInstance;
    expect(component).toBeTruthy();
  });
});

export function mockFilesCache(files: FileOrFolderElement[]) {
  let filesCache: FilesCache = {
    baseFolder: 'baseFolderId',
    all: files
  };
  let userRootComponent = ngMocks.findInstance(UserRootComponent);
  when(() => userRootComponent.getFilesCache()).thenReturn(filesCache);
}
