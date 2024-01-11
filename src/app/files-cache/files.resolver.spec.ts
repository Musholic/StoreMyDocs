import {ActivatedRoute, RouterModule} from '@angular/router';

import {filesResolver} from './files.resolver';
import {MockBuilder, NG_MOCKS_GUARDS, NG_MOCKS_RESOLVERS, ngMocks, Type} from "ng-mocks";
import {RouterTestingModule} from "@angular/router/testing";
import {AppModule} from "../app.module";
import {fakeAsync} from "@angular/core/testing";
import {when} from "strong-mock";
import {mockFileService} from "../file-list/file.service.spec";
import {of} from "rxjs";
import {mockFileElement} from "../file-list/file-list.component.spec";
import {UserRootComponent} from "../user-root/user-root.component";
import {navigateTo} from "../../testing/common-testing-function.spec";

describe('filesResolver', () => {
  beforeEach(() => {
    return MockBuilder(
      [
        RouterModule,
        RouterTestingModule.withRoutes([])
      ],
      AppModule,
    )
      .exclude(NG_MOCKS_GUARDS)
      .exclude(NG_MOCKS_RESOLVERS)
      .keep(filesResolver);
  });


  function getRouteData<T>(component: Type<T>) {
    // Let's extract ActivatedRoute of the current component.
    const el = ngMocks.find(component);
    const route = ngMocks.findInstance(el, ActivatedRoute);

    return route.snapshot.data;
  }

  it('should fetch baseFolder and files', fakeAsync(() => {
    // Arrange
    let fileService = mockFileService();
    let fileElement = mockFileElement('file1');
    when(() => fileService.findAll()).thenReturn(of([fileElement]))
    when(() => fileService.findOrCreateBaseFolder()).thenReturn(of('baseFolderId'));

    // Act
    navigateTo('/');

    // Assert
    expect(getRouteData(UserRootComponent)).toEqual({
      files: {
        baseFolder: 'baseFolderId',
        all: [fileElement]
      }
    });
  }));
});
