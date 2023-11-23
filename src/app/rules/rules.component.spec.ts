import {RulesComponent} from './rules.component';
import {MockBuilder, MockInstance, MockRender, ngMocks} from "ng-mocks";
import {AppModule} from "../app.module";
import {RuleService} from "./rule.service";
import {mock, when} from "strong-mock";
import {MatButtonHarness} from "@angular/material/button/testing";
import {HarnessLoader} from "@angular/cdk/testing";
import {ComponentFixture} from "@angular/core/testing";
import {TestbedHarnessEnvironment} from "@angular/cdk/testing/testbed";

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

  it('should run all the rules when clicking on "run rules" button', async () => {
    // Arrange
    let ruleService = mock<RuleService>();
    MockInstance(RuleService, () => {
      return {
        runAll: ruleService.runAll
      }
    });
    when(() => ruleService.runAll()).thenReturn(undefined);
    let fixture = MockRender(RulesComponent);
    let page = new Page(fixture);

    // Act
    await page.clickOnRunRulesButton();

    // Assert
    // no failure from mock setup
  })
});

class Page {
  private loader: HarnessLoader;

  constructor(fixture: ComponentFixture<RulesComponent>) {
    this.loader = TestbedHarnessEnvironment.loader(fixture);
  }

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

  async clickOnRunRulesButton() {
    let button = await this.loader.getHarness(MatButtonHarness.with({text: 'Run all'}));
    return button.click();
  }
}
