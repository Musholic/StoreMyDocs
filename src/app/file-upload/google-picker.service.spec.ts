import {GooglePickerService} from './google-picker.service';
import {MockBuilder, MockRender} from "ng-mocks";
import {AppModule} from "../app.module";

describe('GooglePickerService', () => {
  beforeEach(() =>
    MockBuilder(GooglePickerService, AppModule)
  );

  it('should be created', () => {
    // Act
    const service = MockRender(GooglePickerService).point.componentInstance;

    // Assert
    expect(service).toBeTruthy();
  });
});
