import {FilesCacheService} from './files-cache.service';
import {FileOrFolderElement} from "../file-list/file-list.component";
import {MockBuilder, MockRender, ngMocks} from "ng-mocks";
import {mock, UnexpectedProperty, when} from "strong-mock";
import {AppModule} from "../app.module";
import {mockFileElement} from "../file-list/file-list.component.spec";
import {ActivatedRoute, ActivatedRouteSnapshot, Data, Router} from "@angular/router";
import {FilesCache} from "./files.resolver";

describe('FilesCacheService', () => {
  beforeEach(() => MockBuilder(FilesCacheService, AppModule)
    .provide({
      provide: Router,
      useValue: mock<Router>()
    })
    .provide({
      provide: ActivatedRoute,
      useValue: mock<ActivatedRoute>({
        unexpectedProperty: UnexpectedProperty.THROW
      })
    })
  );

  it('should be created', () => {
    // Act
    const service = MockRender(FilesCacheService).point.componentInstance;

    // Assert
    expect(service).toBeTruthy();
  });

  describe('getAll', () => {
    it('should return all files from cache', () => {
      // Arrange
      const service = MockRender(FilesCacheService).point.componentInstance;

      const fileElement = mockFileElement('inCache');
      const filesCache: FilesCache = {
        all: [fileElement],
        baseFolder: ''
      };

      const activatedRoute = ngMocks.get(ActivatedRoute);
      when(() => activatedRoute.snapshot).thenReturn({data: {files: filesCache} as Data} as ActivatedRouteSnapshot);

      // Act
      const all = service.getAll();

      // Assert
      expect(all).toEqual([fileElement])
    })
  })

  describe('getBaseFolder', () => {
    it('should return all files from cache', () => {
      // Arrange
      const service = MockRender(FilesCacheService).point.componentInstance;

      const fileElement = mockFileElement('inCache');
      const filesCache: FilesCache = {
        all: [fileElement],
        baseFolder: 'baseFolderId'
      };

      const activatedRoute = ngMocks.get(ActivatedRoute);
      when(() => activatedRoute.snapshot).thenReturn({data: {files: filesCache} as Data} as ActivatedRouteSnapshot);

      // Act
      const baseFolder = service.getBaseFolder();

      // Assert
      expect(baseFolder).toEqual('baseFolderId')
    })
  })

  describe('refreshCacheAndReload', () => {
    it('should refresh cache and reload', () => {
      // Arrange
      const service = MockRender(FilesCacheService).point.componentInstance;

      const router = ngMocks.get(Router);
      when(() => router.url).thenReturn("currentUrl")
      when(() => router.navigate(['currentUrl'], {onSameUrlNavigation: "reload"}))
        .thenResolve(true);

      // Act
      service.refreshCacheAndReload();

      // Assert
      expect(FilesCacheService.reloadRouteData).toBeTruthy();
    })

  })

});

export function mockFilesCacheServiceGetBaseFolder() {
  const filesCacheService = ngMocks.findInstance(FilesCacheService);
  when(() => filesCacheService.getBaseFolder()).thenReturn('baseFolderId')
}

export function mockFilesCacheService(files: FileOrFolderElement[], mockBaseFolder: boolean = false) {
  const filesCacheService = ngMocks.findInstance(FilesCacheService);
  when(() => filesCacheService.getAll()).thenReturn(files);
  if (mockBaseFolder) {
    mockFilesCacheServiceGetBaseFolder();
  }
  return filesCacheService;
}
