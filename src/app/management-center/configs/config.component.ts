import { ChangeDetectorRef, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Comparator, StringFilter } from '@clr/angular';
import { Subject } from 'rxjs/Subject';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Observable } from 'rxjs/Observable';
import { AlphabeticalComparator, StringOperator, ObjectFilterByKey } from '../../utils/inventory-operator';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl }   from '@angular/forms';
import * as _ from 'lodash';

import { ConfigService } from '../services/config.service';
import { Config } from '../../models';

@Component({
  selector: 'app-config',
  templateUrl: './config.component.html',
  styleUrls: ['./config.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ConfigComponent implements OnInit {
  public configStore: Config[] = [];
  public allConfigs: Config[] = [];
  public selectedConfig: Config;

  public modalAction: string;
  public isShowModal: boolean;
  public modalFormGroup: FormGroup;
  public isShowUpdateStatus: boolean;
  public configureType: string;

  // data grid helper
  public dgDataLoading = false;
  public dgPlaceholder = 'No configuration found!';

  public keyComparator = new AlphabeticalComparator<Config>('key');
  public keyFilter = new ObjectFilterByKey<Config>('key');
  public valueFilter = new ObjectFilterByKey<Config>('value');

  constructor(private configService: ConfigService) { }

  public ngOnInit() {
    this.getAllConfig();
    this.modalFormGroup = new FormGroup({
      key: new FormControl(''),
      value: new FormControl('')
    });
  }

  public getAllConfig(): void {
    this.configService.getAll()
      .subscribe((data) => {
        const _data = [];
        _.forEach(_.keys(data), (key) => {
          // Remove unnecessary enviroment configures
          if (key.match('^[a-z].*')) {
            _data.push({key, value: data[key]});
          }
        });
        this.configStore = _data;
        this.allConfigs = _data;
        this.dgDataLoading = false;
      });
  }

  public create() {
    this.isShowUpdateStatus = true;
    this.selectedConfig = {key: null, value: null};
    this.modalFormGroup.setValue({key: null, value: null});
    this.modalAction = 'Create';
    this.isShowModal = true;
  }

  public refresh() {
    this.dgDataLoading = true;
    this.getAllConfig();
  }

  public onAction(action) {
    switch (action) {
      case 'Refresh':
        this.refresh();
        break;
      case 'Create':
        this.create();
        break;
    }
  }

  public onFilter(filtered) {
    this.configStore = filtered;
  }

  public onUpdate(item: Config) {
    this.isShowUpdateStatus = true;
    this.selectedConfig = item;
    this.configureType = typeof item.value;
    // Configure values can be string, number or object;
    const value = (this.configureType === 'object')
      ? JSON.stringify(this.selectedConfig.value)
      : this.selectedConfig.value;
    this.modalFormGroup.setValue({key: item.key, value});
    this.modalAction = 'Update';
    this.isShowModal = true;
  }

  // onDelete() {};

  // onBatchDelete() {};

  // onGetDetails() {};

  // onGetRawData() {};

  public getHttpMethod() {
    if (this.modalAction === 'Create') { return 'put'; }
    if (this.modalAction === 'Update') { return 'patch'; }
  }

  public onSubmit() {
    const key: any = this.modalFormGroup.get('key').value;
    let value: any = this.modalFormGroup.get('value').value;
    const method: string = this.getHttpMethod();
    if (this.configureType === 'number') {
      value = parseInt(value);
    } else if (this.configureType === 'object') {
      value = JSON.parse(value);
    }
    const payload = {};
    payload[key] = value;
    this.isShowUpdateStatus = false;
    this.configService[method](payload)
    .subscribe( (data) => {
      this.selectedConfig.key = key;
      this.selectedConfig.value = data[this.selectedConfig.key];
      this.refresh();
    });
  }
}
