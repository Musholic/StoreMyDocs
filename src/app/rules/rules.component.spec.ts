import {RulesComponent} from './rules.component';
import {MockBuilder, MockRender, ngMocks} from "ng-mocks";
import {AppModule} from "../app.module";
import {when} from "strong-mock";
import {MatButtonHarness} from "@angular/material/button/testing";
import {HarnessLoader, TestKey} from "@angular/cdk/testing";
import {ComponentFixture, fakeAsync, tick} from "@angular/core/testing";
import {TestbedHarnessEnvironment} from "@angular/cdk/testing/testbed";
import {mustBeConsumedAsyncObservable} from "../../testing/common-testing-function.spec";
import {mockRuleService} from "./rule.service.spec";
import {MatInputHarness} from "@angular/material/input/testing";
import {MatFormFieldHarness} from "@angular/material/form-field/testing";
import {MatFormFieldModule} from "@angular/material/form-field";
import {BrowserAnimationsModule, NoopAnimationsModule} from "@angular/platform-browser/animations";
import {MatInputModule} from "@angular/material/input";
import {FormsModule} from "@angular/forms";
import {MatChipsModule} from "@angular/material/chips";
import {MatChipGridHarness} from "@angular/material/chips/testing";
import {Rule} from "./rule.repository";
import {BreakpointObserver} from "@angular/cdk/layout";
import {RuleService} from "./rule.service";

describe('RulesComponent', () => {
  beforeEach(() => MockBuilder(RulesComponent, AppModule)
    .keep(MatInputModule)
    .keep(MatFormFieldModule)
    .keep(FormsModule)
    .keep(MatChipsModule)
    .keep(BreakpointObserver)
    .mock(RuleService)
    .replace(BrowserAnimationsModule, NoopAnimationsModule)
  );

  it('should create', () => {
    // Arrange
    mockSampleRules()

    // Act
    let component = MockRender(RulesComponent).point.componentInstance;

    // Assert
    expect(component).toBeTruthy();
  });

  it('should list two rules', fakeAsync(() => {
    // Arrange
    mockSampleRules();

    // Act
    let fixture = MockRender(RulesComponent);

    // Assert
    tick();
    fixture.detectChanges();
    expect(Page.getRuleNames()).toEqual(['Electric bill', 'Bank account statement']);
    expect(Page.getRuleCategory('Electric bill')).toEqual('Electricity  > Bills');
    expect(Page.getRuleScript('Electric bill')).toEqual('return fileName === "electricity_bill.pdf"');
  }))

  it('should run all the rules when clicking on "run rules" button', async () => {
    // Arrange
    mockSampleRules();
    let ruleService = mockRuleService();
    when(() => ruleService.runAll()).thenReturn(mustBeConsumedAsyncObservable(undefined));
    let fixture = MockRender(RulesComponent);
    let page = new Page(fixture);

    // Act
    await page.clickOnRunRulesButton();

    // Assert
    // no failure from mock setup
  })

  it('should create a new rule', fakeAsync(async () => {
    // Arrange
    let ruleService = mockRuleService();
    when(() => ruleService.findAll()).thenResolve([]);

    let expectedRule: Rule = {
      name: 'New rule',
      category: ['Cat1', 'ChildCat1'],
      script: 'return fileName === "child_cat_1.txt"'
    };
    when(() => ruleService.create(expectedRule)).thenResolve(undefined);

    // After refresh, there should be the new rule
    when(() => ruleService.findAll()).thenResolve([expectedRule]);
    let fixture = MockRender(RulesComponent);

    let page = new Page(fixture);

    // Act
    await page.clickOnCreateNewRule();
    fixture.detectChanges();
    await page.setCreateRuleName('New rule');
    await page.setCreateRuleCategory(['Cat1', 'ChildCat1']);
    await page.setCreateRuleScript('return fileName === "child_cat_1.txt"');
    await page.clickOnCreate();

    // Assert
    // No failure in mock setup
    tick();
    fixture.detectChanges();
    expect(Page.getRuleNames())
      .toEqual(['New rule']);
  }))

  it('should delete an existing rule', fakeAsync(async () => {
    // Arrange
    let ruleService = mockRuleService();

    let rule: Rule = {
      name: 'Rule1',
      category: ['Cat1', 'ChildCat1'],
      script: 'return fileName === "child_cat_1.txt"'
    };
    when(() => ruleService.findAll()).thenResolve([rule]);

    // A refresh is expected after delete
    when(() => ruleService.findAll()).thenResolve([]);

    when(() => ruleService.delete(rule)).thenResolve();

    let fixture = MockRender(RulesComponent);
    tick();

    let page = new Page(fixture);

    // Act
    await page.deleteFirstRule();

    // Assert
    // No failure in mock setup
    tick();
    fixture.detectChanges();
    expect(Page.getRuleNames())
      .toEqual([]);
  }))
});


function mockSampleRules() {
  let ruleService = mockRuleService();
  when(() => ruleService.findAll()).thenResolve(getSampleRules());
}

export function getSampleRules(): Rule[] {
  return [{
    name: 'Electric bill',
    category: ['Electricity', 'Bills'],
    script: 'return fileName === "electricity_bill.pdf"'
  }, {
    name: 'Bank account statement',
    category: ['Bank', 'Account statement'],
    script: 'return false'
  }];
}

class Page {
  private loader: HarnessLoader;

  constructor(fixture: ComponentFixture<RulesComponent>) {
    this.loader = TestbedHarnessEnvironment.loader(fixture);
  }

  static getRuleNames(): string[] {
    return ngMocks.findAll("mat-panel-title")
      .map(row => row.nativeNode.textContent.trim());
  }

  static getRuleCategory(name: string): string {
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

  async clickOnCreateNewRule() {
    let button = await this.loader.getHarness(MatButtonHarness.with({text: 'Create new rule'}));
    await button.click();
  }

  async setCreateRuleName(name: string) {
    let input = await this.getInputByFloatingLabel('Name');
    await input.setValue(name);
  }

  async setCreateRuleCategory(category: string[]) {
    // let inputHarness = await this.loader.getHarness(MatInputHarness.with({placeholder: 'Select category...'}));
    let chipGridHarness = await this.loader.getHarness(MatChipGridHarness);
    let inputHarness = await chipGridHarness.getInput()
    if (inputHarness) {
      for (const catElement of category) {
        await inputHarness.setValue(catElement);
        let testElement = await inputHarness.host();
        await testElement.sendKeys(TestKey.ENTER)
      }
    }
  }

  async setCreateRuleScript(script: string) {
    let inputHarness = await this.getInputByFloatingLabel('Script');
    await inputHarness.setValue(script);
  }

  async clickOnCreate() {
    let button = await this.loader.getHarness(MatButtonHarness.with({text: 'Create'}));
    await button.click();
  }

  private async getInputByFloatingLabel(floatingLabelText: string | RegExp) {
    let formFieldHarness = await this.loader.getHarness(MatFormFieldHarness.with({floatingLabelText: floatingLabelText}));
    let control = await formFieldHarness.getControl();
    if (control) {
      return control as MatInputHarness;
    }
    throw Error("No input found with floating label '" + floatingLabelText + "'");
  }

  async deleteFirstRule() {
    let button = await this.loader.getHarness(MatButtonHarness.with({text: 'Delete'}));
    await button.click();
  }
}
