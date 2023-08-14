import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MatToolbarModule} from "@angular/material/toolbar";
import {FileUploadComponent} from './file-upload/file-upload.component';
import {MatButtonModule} from "@angular/material/button";
import {HomepageComponent} from './homepage/homepage.component';
import {MatIconModule} from "@angular/material/icon";
import {HttpClientModule} from "@angular/common/http";
import {MatCardModule} from "@angular/material/card";
import {MatProgressBarModule} from "@angular/material/progress-bar";
import {FileUploadElementComponent} from './file-upload/file-upload-element/file-upload-element.component';
import {NavBarComponent} from './nav-bar/nav-bar.component';
import {MatMenuModule} from "@angular/material/menu";
import {MatListModule} from "@angular/material/list";
import {FooterComponent} from './footer/footer.component';

@NgModule({
  declarations: [
    AppComponent,
    FileUploadComponent,
    HomepageComponent,
    FileUploadElementComponent,
    NavBarComponent,
    FooterComponent
  ],
    imports: [
        BrowserModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        HttpClientModule,

        MatToolbarModule,
        MatButtonModule,
        MatIconModule,
        MatCardModule,
        MatProgressBarModule,
        MatMenuModule,
        MatListModule
    ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
