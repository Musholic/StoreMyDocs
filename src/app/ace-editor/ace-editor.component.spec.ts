import {AceEditorComponent} from './ace-editor.component';
import {MockBuilder, MockRender} from "ng-mocks";
import {AppModule} from "../app.module";
import {BehaviorSubject} from "rxjs";
import {fakeAsync, flush} from "@angular/core/testing";

describe('AceEditorComponent', () => {
  beforeEach(() => MockBuilder(AceEditorComponent, AppModule));

  it('should create', () => {
    let component = MockRender(AceEditorComponent).point.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should set the input', () => {
    // Arrange
    let params = {
      value: "initialValue"
    };

    // Act
    let component = MockRender(AceEditorComponent, params).point.componentInstance;

    // Assert
    expect(component.editor?.getValue()).toEqual("initialValue")
  });

  it('should get the new output', fakeAsync(() => {
    // Arrange
    let output = new BehaviorSubject<string>("");
    let params = {
      value: "oldValue",
      valueChange: output
    };
    let component = MockRender(AceEditorComponent, params).point.componentInstance;

    // Act
    component.editor?.setValue("newValue");

    // Assert
    flush();
    expect(output.getValue()).toEqual("newValue")
  }));
});
