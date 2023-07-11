import {ComponentFixture, TestBed} from '@angular/core/testing';
import {FileUploadComponent} from './file-upload.component';
import {MatIconModule} from "@angular/material/icon";

describe('FileUploadComponent', () => {
  let component: FileUploadComponent;
  let fixture: ComponentFixture<FileUploadComponent>;
  let page: Page;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MatIconModule],
      declarations: [FileUploadComponent]
    });
    fixture = TestBed.createComponent(FileUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    page = new Page(fixture);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('When selecting a file to upload', () => {
    it('Should shows the file as being uploaded', () => {
      // Act
      page.uploadFile('TestFile.txt');

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

  uploadFile(fileName: string) {

    const dataTransfer = new DataTransfer()
    dataTransfer.items.add(new File([''], fileName))

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
