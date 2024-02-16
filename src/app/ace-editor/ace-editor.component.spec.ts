import {AceEditorComponent} from './ace-editor.component';
import {MockBuilder, MockRender} from "ng-mocks";
import {AppModule} from "../app.module";
import {BehaviorSubject} from "rxjs";
import {fakeAsync, flush} from "@angular/core/testing";

describe('AceEditorComponent', () => {
  beforeEach(() => MockBuilder(AceEditorComponent, AppModule));

  it('should create', () => {
    const component = MockRender(AceEditorComponent).point.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should set the input', () => {
    // Arrange
    const params = {
      value: "initialValue"
    };

    // Act
    const component = MockRender(AceEditorComponent, params).point.componentInstance;

    // Assert
    expect(component.editor?.getValue()).toEqual("initialValue")
  });

  it('should get the new output', fakeAsync(() => {
    // Arrange
    const output = new BehaviorSubject<string>("");
    const params = {
      value: "oldValue",
      valueChange: output
    };
    const component = MockRender(AceEditorComponent, params).point.componentInstance;

    // Act
    component.editor?.setValue("newValue");

    // Assert
    flush();
    expect(output.getValue()).toEqual("newValue")
  }));
});
