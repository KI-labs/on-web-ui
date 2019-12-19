import {
  Component,
  ViewEncapsulation,
  OnInit,
  OnDestroy,
  OnChanges,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ClarityModule } from '@clr/angular';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { StringOperator } from 'app/utils/inventory-operator';

import * as _ from 'lodash';

@Component({
  selector: 'dropdown-group',
  templateUrl: './dropdown-group.component.html',
  styleUrls: ['./dropdown-group.component.scss'],
})

export class DropdownGroupComponent implements OnInit, OnDestroy, OnChanges  {
  @Input() public fields: string[] = []; // search field
  @Input() public labels: string[]; // label for inputs
  @Input() public widths: number[]; // input widths
  @Input() public columns: number []; // dropdown grid size, follow bootstrap grid configures
  @Input() public offsets: number [];
  @Input() public size: number = 10; // dropdown size
  @Input() public placeholders: string[]; // label for inputs
  @Input() public disable: boolean [];
  @Input() public isDefaultForm: boolean = false; // bootstrap/clarity default form format
  @Input() public marginTop: string = '0px'; // margin top
  @Input() public labelBold: boolean = true; // label bold
  @Input() public fieldsRequired: boolean []; // label bold

  @Input() public needSearchIcon: boolean = false; // search icon
  @Input() public needReset: boolean = false; // reset button

  @Input() public data: any[] = []; // all data for search

  @Output() public selected = new EventEmitter(); // Single item is selected
  @Output() public cleared: EventEmitter<string> = new EventEmitter(); // Ask for data reload

  public searchTerms = new Subject<any>();
  public searchSubscribe: any;
  public allData: any [];

  public dropdownLists: any = {};
  public filterForm: FormGroup;

  public classList: string [] = [];
  public resetClass: string;

  public isSelected: boolean = false;

  public ngOnChanges() {
    switch (this.data.length) {
      case 0:
        if (this.filterForm) { this.reset(); }
        break;
      case 1:
        const formValues = _.pick(this.data[0], this.fields);
        this.filterForm.patchValue(formValues);
        this.selected.emit(this.data[0]);
        break;
      default:
        this.allData = _.map(this.data, (value, key) => {
          const _value = _.pick(value, this.fields);
          _value['index'] = key;
          return _value;
        });
        const filtered = this.filterByFormGroup(this.allData);
        this.getDropdownLists(filtered);
    }
  }

  public ngOnInit() {
    const searchTrigger = this.searchTerms.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((term: string) => {
        this.search(term);
        return 'whatever';
      })
    );
    this.searchSubscribe = searchTrigger.subscribe();
    this.setDefaultParams();
    this.createFormGroup();
  }

  public ngOnDestroy() {
    this.searchSubscribe.unsubscribe();
  }

  public setDefaultParams() {
    const inputCount = this.fields.length;

    const columnSize = _.floor(12 / inputCount, 1);
    if (_.isEmpty(this.columns)) {
      this.columns = _.fill(Array(inputCount), columnSize);
    }
    if (_.isEmpty(this.offsets)) {
      this.offsets = _.fill(Array(inputCount), 0);
    }
    if (_.isEmpty(this.disable)) {
      this.disable = _.fill(Array(inputCount), false);
    }
    if (_.isEmpty(this.fieldsRequired)) {
      this.fieldsRequired = _.fill(Array(inputCount), false);
    }
    this.classList = _.map(this.offsets, (offset, key) => {
      return `col-lg-${this.columns[key]} col-lg-offset-${offset}`;
    });
    let buttonColumn = 12;
    buttonColumn = Math.abs(12 - _.sum(this.columns) - _.sum(this.offsets)) % 12;
    buttonColumn = buttonColumn ? buttonColumn : 12;
    this.resetClass = `col-lg-${buttonColumn}`;
  }

  public createFormGroup(): void {
    this.filterForm = new FormGroup({});
    _.forEach(this.fields, (field, index) => {
      this.filterForm.addControl(field, new FormControl({value: '', disabled: this.disable[index]}));
    });
  }

  public getDropdownLists(data): void {
    _.forEach(this.fields, (field) => {
      let list = _.map(data, field);
      list = _.uniq(list.sort());
      this.dropdownLists[field] = list.length > this.size ? _.slice(list, 0, this.size) : list;
    });
  }

  public filterOnlySelected(term: string, field: string, dataStore: any): any[] {
    // Filter only selected item
    // StringOperator does match not exactly compare
    const matched = [];
    _.forEach(dataStore, (data) => {
      if (data[field] === term) {
        matched.push(data);
      }
    });
    return matched;
  }

  public filterByFormGroup(allData) {
    if (!this.filterForm) { return allData; }
    const formValues = this.filterForm.value;
    let filtered = _.cloneDeep(allData);
    _.forEach(this.fields, (field) => {
      const term = formValues[field];
      if (term) {
        const excludeFields = _.remove(this.fields, field);
        filtered = StringOperator.search(term, filtered, excludeFields);
      }
    });
    return filtered;
  }

  public search(input?: any): void {
    let filtered = this.filterByFormGroup(this.allData);
    if (this.isSelected && input.value) {
      filtered = this.filterOnlySelected(input.value, input.field, filtered);
      this.isSelected = false;
    }
    this.getDropdownLists(filtered);
    if (filtered.length === 1) {
      this.onSelected(filtered[0]);
    }
  }

  public reset() {
    this.filterForm.reset();
    this.dropdownLists = [];
  }

  public onSelected(sel: any) {
    this.filterForm.patchValue(sel);
    this.selected.emit(this.data[sel.index]);
  }

  public onSearch(term: string, field: string): void {
    this.searchTerms.next({
      field,
      value: term
    });
  }

  public onChanged(): void {
    this.isSelected = true;
  }

  public onClear(field: string) {
    this.filterForm.patchValue({[field]: ''});
    this.searchTerms.next({
      field,
      value: ''
    });
    this.cleared.emit(field);
  }

  public onReset(field: string) {
    this.reset();
    this.cleared.emit('all');
  }
}
