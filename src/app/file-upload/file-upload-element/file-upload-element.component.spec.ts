import {FileUploadElementComponent, FileUploadProgress} from './file-upload-element.component';
import {MockBuilder, MockRender, ngMocks} from "ng-mocks";
import {AppModule} from "../../app.module";
import {ComponentFixture} from "@angular/core/testing";
import {TestbedHarnessEnvironment} from "@angular/cdk/testing/testbed";
import {HarnessLoader} from "@angular/cdk/testing";
import {MatProgressBarHarness} from "@angular/material/progress-bar/testing";
import {MatProgressBarModule} from "@angular/material/progress-bar";

describe('FileUploadElementComponent', () => {

    beforeEach(() => {
        return MockBuilder(FileUploadElementComponent, AppModule)
            .keep(MatProgressBarModule);
    });

    it('should create', () => {
        // Arrange
        const fixture = MockRender(FileUploadElementComponent);
        const component = fixture.point.componentInstance;

        // Assert
        expect(component).toBeTruthy();
    });
    describe('When a file is partially uploaded', () => {
        it('should show current progress', async () => {
            // Arrange
            let fileProgress: FileUploadProgress = {fileName: 'Test.txt', total: 100, loaded: 40};

            // Act
            const fixture = MockRender(FileUploadElementComponent, {fileProgress: fileProgress} as FileUploadElementComponent);

            // Assert
            const page = new Page(fixture);
            expect(page.getFileName()).toEqual('Test.txt');
            expect(await page.getUploadProgress()).toEqual(40);

        })
    })
});

class Page {
    private loader: HarnessLoader;

    constructor(fixture: ComponentFixture<FileUploadElementComponent>) {
        this.loader = TestbedHarnessEnvironment.loader(fixture);
    }

    getFileName(): string {
        return ngMocks.find('span').nativeNode.textContent.trim();
    }

    async getUploadProgress() {
        let progressBar = await this.loader.getHarness(MatProgressBarHarness);
        return progressBar.getValue();
    }
}
