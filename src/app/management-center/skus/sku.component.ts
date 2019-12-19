import { Component, OnInit } from '@angular/core';
import { SKU, ModalTypes } from 'app/models';
import { FormControl, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { AlphabeticalComparator, ObjectFilterByKey, StringOperator, isJsonTextValid } from 'app/utils/inventory-operator';
import { Subject } from 'rxjs/Subject';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Observable } from 'rxjs/Observable';
import * as _ from 'lodash';
import { SkusService } from 'app/services/rackhd/sku.service';
import { isEmbeddedView } from '@angular/core/src/view/util';

@Component({
  selector: 'app-sku',
  templateUrl: './sku.component.html',
  styleUrls: ['./sku.component.scss']
})

export class SkuComponent implements OnInit {
  public skuStore: SKU[] = [];
  public allSkus: SKU[] = [];

  public selectedSku: SKU;
  public isShowDetail: boolean;
  public isShowModal: boolean;
  public rawData: any;
  public action: any;

  public dgDataLoading = false;
  public dgPlaceholder = 'No SKU found!';

  public isCreateSku: boolean;
  public isDelete: boolean;
  public selectedSkus: SKU[];
  public isSkuOnly: boolean;

  public skuForm: FormGroup;
  public skuPackFiles: FileList;

  public defaultRules: string = ' ' ;
  public rulesJsonValid = true;
  public optionsJsonValid = true;
  public modalTypes: ModalTypes;
  public updateTheSku  = false;

  public idComparator = new AlphabeticalComparator('id');
  public discoveryGraphNameComparator = new AlphabeticalComparator('discoveryGraphName');
  public nameComparator = new AlphabeticalComparator('name');

  public nameFilter = new ObjectFilterByKey('name');
  public discoveryGraphNameFilter = new ObjectFilterByKey('discoveryGraphName');

  constructor(public skusService: SkusService, private fb: FormBuilder) { }

  public ngOnInit() {
    this.modalTypes = new ModalTypes(['Rules', 'Sku Config', 'Discovery Graph Options']);
    this.getAllSkus();
    this.createForm();
    this.selectedSkus = [];
    this.isSkuOnly = false;
  }

  public onFilter(filtered): void {
    this.skuStore = filtered;
  }

  public onConfirm(value) {
    switch (value) {
      case 'reject':
        this.isDelete = false;
        break;
      case 'accept':
        this.isDelete = false;
        this.deleteSel();
    }
  }

  public onAction(action) {
    switch (action) {
      case 'Refresh':
        this.refresh();
        break;
      case 'Create':
        this.create();
        break;
      case 'Delete':
        this.batchDelete();
        break;
    }
  }

  public createForm() {
    this.skuForm = this.fb.group({
      name: new FormControl('', { validators: [Validators.required] }),
      discoveryGraphName: '',
      discoveryGraphOptions: '',
      rules: new FormControl('', { validators: [Validators.required] })
    });
  }

  public onRadioChange() {
    this.isSkuOnly = !this.isSkuOnly;
  }

  public getAllSkus(): void {
    this.skusService.getAll()
      .subscribe( (data) => {
        this.skuStore = data;
        this.allSkus = data;
        this.dgDataLoading = false;
      });
  }

  public goToDetail(sku: SKU) {
    this.selectedSku = sku;
    this.isShowDetail = true;
  }

  public getChild(objKey: string, sku: SKU) {
    this.selectedSku = sku;
    this.action = _.startCase(objKey);
    this.rawData = sku && sku[objKey];
    if (this.selectedSku && this.action && (!_.isEmpty(this.rawData))) {
      this.isShowModal = true;
    }
  }

  public create(): void {
    this.isCreateSku = true;
    this.isSkuOnly = false;
    this.updateTheSku = false;
    this.createForm();

  }

  public willUpdate(sku: SKU): void {
    this.rulesJsonValid = true;
    this.optionsJsonValid = true;
    const name = sku.name;
    const rules = sku.rules;
    const formValues = {
      name,
      discoveryGraphName: sku.discoveryGraphName,
      rules: JSON.stringify(rules),
      discoveryGraphOptions: JSON.stringify(sku.discoveryGraphOptions)
    };
    this.skuForm.patchValue(formValues);
    this.isCreateSku = true;
    this.isSkuOnly = true;
    this.updateTheSku = true;
  }

  public batchDelete(): void {
    if (!_.isEmpty(this.selectedSkus)) {
      this.isDelete = true;
    }
  }

  public willDelete(sku: SKU): void {
    this.selectedSkus = [sku];
    this.isDelete = true;
  }

  public refresh() {
    this.dgDataLoading = true;
    this.getAllSkus();
  }

  public onChange(event) {
    this.skuPackFiles = event.target.files;
  }

  public createSku(): void {
    const jsonData = {};
    this.skuForm.getRawValue();
    const value = this.skuForm.value;
    // data transform
    jsonData['name'] = value['name'];
    // TODO: name is required;
    if (value['discoveryGraphName']) {
      jsonData['discoveryGraphName'] = value['discoveryGraphName'];
    }
    this.rulesJsonValid = isJsonTextValid(value['rules']);
    this.optionsJsonValid = isJsonTextValid(value['discoveryGraphOptions']);
    if (this.rulesJsonValid) {
      jsonData['rules'] = value['rules'] ? JSON.parse(value['rules']) : [];
      const self = this;
      if (_.isEmpty(jsonData['rules'])) {
        self.rulesJsonValid = false;
      }
      _.forEach(_.map(jsonData['rules'], 'path'), function(item) {
          if (_.isUndefined(item)) {
            self.rulesJsonValid = false;
          }
      });
    }
    if (this.optionsJsonValid) {
      const data =  value['discoveryGraphOptions']  && JSON.parse(value['discoveryGraphOptions']);
      if (!_.isEmpty(data)) {
        jsonData['discoveryGraphOptions'] = data;
      }
    }
    if (this.rulesJsonValid && this.optionsJsonValid && this.skuForm.get('name').valid) {
      this.isCreateSku = false;
      if (this.updateTheSku === true) {
        this.updateTheSku = false;
        this.skusService.updateSku(jsonData)
          .subscribe((data) => {
            this.refresh();
          });
      } else {
        this.skusService.createSku(jsonData)
          .subscribe((data) => {
            this.refresh();
          });
      }

    }
  }

  public createSkupack(): void {
    this.isCreateSku = false;
    const file = this.skuPackFiles[0];
    const identifier = this.selectedSkus.length && this.selectedSku['id'];
    this.skusService.uploadByPost(file, identifier)
      .subscribe(() => {
        this.refresh();
      });
  }

  public deleteSel(): void {
    const list = [];
    _.forEach(this.selectedSkus, (sku) => {
      list.push(sku.id);
    });

    this.skusService.deleteByIdentifiers(list)
    .subscribe((results) => {
      this.refresh();
    });
  }
}
