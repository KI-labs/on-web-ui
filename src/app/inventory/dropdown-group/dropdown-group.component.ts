import {
  Component,
  OnInit,
  OnDestroy,
  OnChanges,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { Subject } from 'rxjs/Subject';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { StringOperator } from '../../utils/inventory-operator';

import { map, pick, floor, isEmpty, fill, sum, forEach, uniq, slice, cloneDeep, remove  } from 'lodash-es';

@Component({
  selector: 'app-dropdown-group',
  templateUrl: './dropdown-group.component.html',
  styleUrls: ['./dropdown-group.component.scss'],
})

export class DropdownGroupComponent implements OnInit, OnDestroy, OnChanges  {
  @Input() fields: string[] = []; // search field
  @Input() labels: string[]; // label for inputs
  @Input() widths: number[]; // input widths
  @Input() columns: number []; // dropdown grid size, follow bootstrap grid configures
  @Input() offsets: number [];
  @Input() size = 10; // dropdown size
  @Input() placeholders: string[]; // label for inputs
  @Input() disable: boolean [];
  @Input() isDefaultForm = false; // bootstrap/clarity default form format
  @Input() marginTop = '0px'; // margin top
  @Input() labelBold = true; // label bold
  @Input() fieldsRequired: boolean []; // label bold

  @Input() needSearchIcon = false; // search icon
  @Input() needReset = false; // reset button

  @Input() data: any[] = []; // all data for search

  @Output() selected = new EventEmitter(); // Single item is selected
  @Output() cleared: EventEmitter<string> = new EventEmitter(); // Ask for data reload

  searchTerms = new Subject<any>();
  searchSubscribe: any;
  allData: any [];

  dropdownLists: any = {};
  filterForm: FormGroup;

  classList: string [] = [];
  resetClass: string;

  isSelected = false;

  ngOnChanges() {
    switch (this.data.length) {
      case 0:
        if (this.filterForm) { this.reset(); }
        break;
      case 1:
        const formValues = pick(this.data[0], this.fields);
        this.filterForm.patchValue(formValues);
        this.selected.emit(this.data[0]);
        break;
      default:
        this.allData = map(this.data, (value, key) => {
          const _value = pick(value, this.fields);
          _value.index = key;
          return _value;
        });
        const filtered = this.filterByFormGroup(this.allData);
        this.getDropdownLists(filtered);
    }
  }

  ngOnInit() {
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

  ngOnDestroy() {
    this.searchSubscribe.unsubscribe();
  }

  setDefaultParams() {
    const inputCount = this.fields.length;

    const columnSize = floor(12 / inputCount, 1);
    if (isEmpty(this.columns)) {
      this.columns = fill(Array(inputCount), columnSize);
    }
    if (isEmpty(this.offsets)) {
      this.offsets = fill(Array(inputCount), 0);
    }
    if (isEmpty(this.disable)) {
      this.disable = fill(Array(inputCount), false);
    }
    if (isEmpty(this.fieldsRequired)) {
      this.fieldsRequired = fill(Array(inputCount), false);
    }
    this.classList = map(this.offsets, (offset, key) => {
      return `clr-col-lg-${this.columns[key]} clr-col-lg-offset-${offset}`;
    });
    let buttonColumn = 12;
    buttonColumn = Math.abs(12 - sum(this.columns) - sum(this.offsets)) % 12;
    buttonColumn = buttonColumn ? buttonColumn : 12;
    this.resetClass = `clr-col-lg-${buttonColumn}`;
  }

  createFormGroup(): void {
    this.filterForm = new FormGroup({});
    forEach(this.fields, (field, index) => {
      this.filterForm.addControl(field, new FormControl({value: '', disabled: this.disable[index]}));
    });
  }

  getDropdownLists(data): void {
    forEach(this.fields, field => {
      let list = map(data, field);
      list = uniq(list.sort());
      this.dropdownLists[field] = list.length > this.size ? slice(list, 0, this.size) : list;
    });
  }

  filterOnlySelected(term: string, field: string, dataStore: any): any[] {
    // Filter only selected item
    // StringOperator does match not exactly compare
    const matched = [];
    forEach(dataStore, data => {
      if (data[field] === term) {
        matched.push(data);
      }
    });
    return matched;
  }

  filterByFormGroup(allData) {
    if (!this.filterForm) { return allData; }
    const formValues = this.filterForm.value;
    let filtered = cloneDeep(allData);
    forEach(this.fields, (field) => {
      const term = formValues[field];
      if (term) {
        const excludeFields = remove(this.fields, field);
        filtered = StringOperator.search(term, filtered, excludeFields);
      }
    });
    return filtered;
  }

  search(input?: any): void {
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

  reset() {
    this.filterForm.reset();
    this.dropdownLists = [];
  }

  onSelected(sel: any) {
    this.filterForm.patchValue(sel);
    this.selected.emit(this.data[sel.index]);
  }

  onSearch(term: string, field: string): void {
    this.searchTerms.next({
      field,
      value: term
    });
  }

  onChanged(): void {
    this.isSelected = true;
  }

  onClear(field: string) {
    this.filterForm.patchValue({[field]: ''});
    this.searchTerms.next({
      field,
      value: ''
    });
    this.cleared.emit(field);
  }

  onReset() {
    this.reset();
    this.cleared.emit('all');
  }
}
