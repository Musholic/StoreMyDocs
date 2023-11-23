import {RulesComponent} from './rules.component';
import {MockBuilder, MockRender, ngMocks} from "ng-mocks";
import {AppModule} from "../app.module";

describe('RulesComponent', () => {
  beforeEach(() => MockBuilder(RulesComponent, AppModule));

  it('should create', () => {
    let component = MockRender(RulesComponent).point.componentInstance;
    expect(component).toBeTruthy();
  });

  it('should list two rules', () => {
    // Act
    MockRender(RulesComponent);

    // Assert
    expect(Page.getRuleNames()).toEqual(['Electric bill', 'Bank account statement']);
    expect(Page.getRuleDescription('Electric bill')).toEqual('Detect electric bills');
    expect(Page.getRuleScript('Electric bill')).toEqual('return fileName === "electric_bill.pdf"');
  })
});

class Page {
  static getRuleNames(): string[] {
    return ngMocks.findAll("mat-panel-title")
      .map(row => row.nativeNode.textContent.trim());
  }

  static getRuleDescription(name: string): string {
    let rule = ngMocks.findAll("mat-panel-title")
      .find(row => row.nativeNode.textContent.trim() === name)
      ?.parent;
    return ngMocks.find(rule, 'mat-panel-description')
      .nativeNode.textContent.trim();
  }

  static getRuleScript(name: string): string {
    let rule = ngMocks.findAll("mat-panel-title")
      .find(row => row.nativeNode.textContent.trim() === name)
      ?.parent?.parent;
    return ngMocks.find(rule, '.ruleScript')
      .nativeNode.textContent.trim();
  }
}
