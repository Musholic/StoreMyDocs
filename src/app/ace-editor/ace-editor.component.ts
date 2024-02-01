import {Component, ElementRef, EventEmitter, HostBinding, Input, OnInit, Output, ViewChild} from '@angular/core';
import * as ace from "ace-builds";
import {Ace} from "ace-builds";
import {MatFormFieldControl} from "@angular/material/form-field";
import {Subject} from "rxjs";
import Editor = Ace.Editor;

@Component({
  selector: 'app-ace-editor',
  templateUrl: './ace-editor.component.html',
  styleUrl: './ace-editor.component.scss',
  providers: [{provide: MatFormFieldControl, useExisting: AceEditorComponent}],
})
export class AceEditorComponent implements MatFormFieldControl<string>, OnInit {
  static nextId = 0;
  @HostBinding() id = `app-ace-editor-${AceEditorComponent.nextId++}`;

  stateChanges = new Subject<void>();
  ngControl = null;

  @Input()
  value!: string;
  @Output() valueChange = new EventEmitter<string>();

  placeholder: string = "";
  focused: boolean = false;
  empty: boolean = false;
  shouldLabelFloat: boolean = true;
  disabled: boolean = false;
  errorState: boolean = false;
  controlType?: string | undefined = "app-ace-editor";
  autofilled?: boolean | undefined;
  userAriaDescribedBy?: string | undefined;

  editor?: Editor;
  @ViewChild("ruleScriptEdit", {static: true}) private ruleScriptEdit?: ElementRef<HTMLElement>;

  constructor() {
    ace.config.set("fontSize", "14px");
    ace.config.set("basePath", "ace");
    // TODO: add autocompletion
  }

  private _required = false;

  @Input()
  get required() {
    return this._required;
  }

  set required(req: boolean) {
    this._required = req;
    this.stateChanges.next();
  }


  ngOnInit() {
    if (this.ruleScriptEdit) {
      this.editor = ace.edit(this.ruleScriptEdit.nativeElement);
      this.editor.session.setMode("ace/mode/javascript");

      this.editor.setValue(this.value);
      this.editor.on("input", () => {
        this.valueChange.emit(this.editor?.getValue());
        this.stateChanges.next();
      });
      this.editor.on("focus", () => {
        this.focused = true;
        this.stateChanges.next();
      });
      this.editor.on("blur", () => {
        this.focused = false;
        this.stateChanges.next();
      });
    }
  }

  setDescribedByIds(ids: string[]): void {
  }

  onContainerClick(event: MouseEvent): void {
    this.editor?.focus();
  }
}
