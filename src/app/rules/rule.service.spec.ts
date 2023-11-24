import {RuleService} from './rule.service';
import {MockBuilder, MockInstance, MockRender} from "ng-mocks";
import {AppModule} from "../app.module";
import {mockFileService} from "../file-list/file.service.spec";
import {mock, when} from "strong-mock";
import {mustBeConsumedAsyncObservable} from "../../testing/common-testing-function.spec";
import {fakeAsync, tick} from "@angular/core/testing";
import {mockFileElement} from "../file-list/file-list.component.spec";
import {BaseFolderService} from "../file-upload/base-folder.service";

describe('RuleService', () => {
  beforeEach(() => MockBuilder(RuleService, AppModule));

  it('should be created', () => {
    // Act
    const service = MockRender(RuleService).point.componentInstance;

    // Assert
    expect(service).toBeTruthy();
  });

  describe('runAll', () => {
    it('should automatically categorize a file', fakeAsync(() => {
      // Arrange
      let baseFolderService = mock<BaseFolderService>();
      MockInstance(BaseFolderService, () => {
        return {
          findOrCreateBaseFolder: baseFolderService.findOrCreateBaseFolder
        }
      });
      when(() => baseFolderService.findOrCreateBaseFolder())
        .thenReturn(mustBeConsumedAsyncObservable('baseFolderId'));

      let fileService = mockFileService();

      when(() => fileService.findOrCreateFolder("Electricity", "baseFolderId"))
        .thenReturn(mustBeConsumedAsyncObservable('elecCatId548'));

      when(() => fileService.findOrCreateFolder("Bills", "elecCatId548"))
        .thenReturn(mustBeConsumedAsyncObservable('billsCatId489'));

      let file = mockFileElement('electricity_bill.pdf');
      when(() => fileService.findAll()).thenReturn(mustBeConsumedAsyncObservable([file]))


      // The file should be set to the bills category
      when(() => fileService.setCategory(file.id, 'billsCatId489'))
        .thenReturn(mustBeConsumedAsyncObservable(undefined));

      const service = MockRender(RuleService).point.componentInstance;

      // Act
      service.runAll().subscribe();

      // Assert
      tick();
      // No failure in mock setup
    }));
  })
});
