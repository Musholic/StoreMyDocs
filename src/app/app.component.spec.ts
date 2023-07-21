import {TestBed} from '@angular/core/testing';
import {RouterTestingModule} from '@angular/router/testing';
import {AppComponent} from './app.component';
import {MatToolbarModule} from "@angular/material/toolbar";
import {MockBuilder, MockRender} from "ng-mocks";
import {AppModule} from "./app.module";

describe('AppComponent', () => {
  beforeEach(() => MockBuilder(AppComponent, AppModule))

  it('should create the app', () => {
    let component = MockRender(AppComponent).point.componentInstance;
    expect(component).toBeTruthy();
  });
});
