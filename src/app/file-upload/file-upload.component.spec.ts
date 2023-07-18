import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FileUploadComponent} from './file-upload.component';
import {MatIconModule} from "@angular/material/icon";
import {MockBuilder, MockRender} from "ng-mocks";
import {AppModule} from "../app.module";
import {FileUploadService} from "./file-upload.service";
import {mock, when} from "strong-mock";
import {Observable} from "rxjs";

describe('FileUploadComponent', () => {

    beforeEach(() => {
        return MockBuilder(FileUploadComponent, AppModule)
            .keep(MatIconModule);
    });

    it('should create', () => {
        // Arrange
        const fixture = MockRender(FileUploadComponent);
        const component = fixture.point.componentInstance;

        // Assert
        expect(component).toBeTruthy();
    });

    describe('When selecting a file to upload', () => {
        it('Should shows the file as being uploaded', () => {
            // Arrange
            const fixture = MockRender(FileUploadComponent);
            const page = new Page(fixture);
            let fileUploadService = TestBed.inject(FileUploadService);
            let uploadMock = mock<typeof fileUploadService['upload']>();
            fileUploadService.upload = uploadMock;

            let file = new File([''], 'TestFile.txt');
            when(() => uploadMock(file)).thenReturn(new Observable())

            // Act
            page.uploadFile(file);

            // Assert
            expect(page.uploadedFiles).toEqual('Uploading TestFile.txt...')
        });
    })
});

class Page {
    private fixture: ComponentFixture<FileUploadComponent>;

    constructor(fixture: ComponentFixture<FileUploadComponent>) {
        this.fixture = fixture;
    }

    uploadFile(file: File) {

        const dataTransfer = new DataTransfer()
        dataTransfer.items.add(file)

        let event = new InputEvent('change', {dataTransfer: dataTransfer});

        let uploadInput = this.uploadInput;
        uploadInput.files = dataTransfer.files;
        uploadInput.dispatchEvent(event);
        this.fixture.detectChanges();
    }

    get uploadedFiles(): string | undefined {
        const element = this.query<HTMLElement>('span') || undefined;

        return element?.textContent?.trim();
    }

    private get uploadInput(): HTMLInputElement {
        return this.query<HTMLInputElement>('input');
    }

    private query<T>(selector: string): T {
        return this.fixture.nativeElement.querySelector(selector);
    }
}
