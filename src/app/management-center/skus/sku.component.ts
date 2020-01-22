import { Component, OnInit } from '@angular/core';
import { SKU, ModalTypes } from '../../models';
import { FormControl, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { AlphabeticalComparator, ObjectFilterByKey, isJsonTextValid } from '../../utils/inventory-operator';
import { map, isUndefined, isEmpty, startCase, forEach } from 'lodash-es';
import { SkusService } from '../../services/rackhd/sku.service';


@Component({
  selector: 'app-sku',
  templateUrl: './sku.component.html',
  styleUrls: ['./sku.component.scss']
})

export class SkuComponent implements OnInit {
  skuStore: SKU[] = [];
  allSkus: SKU[] = [];

  selectedSku: SKU;
  isShowDetail: boolean;
  isShowModal: boolean;
  rawData: any;
  action: any;

  dgDataLoading = false;
  dgPlaceholder = 'No SKU found!';

  isCreateSku: boolean;
  isDelete: boolean;
  selectedSkus: SKU[];
  isSkuOnly: boolean;

  skuForm: FormGroup;
  skuPackFiles: FileList;

  defaultRules = ' ' ;
  rulesJsonValid = true;
  optionsJsonValid = true;
  modalTypes: ModalTypes;
  updateTheSku  = false;

  constructor(public skusService: SkusService, private fb: FormBuilder) { }

  public idComparator = new AlphabeticalComparator('id');
  public discoveryGraphNameComparator = new AlphabeticalComparator('discoveryGraphName');
  public nameComparator = new AlphabeticalComparator('name');

  public nameFilter = new ObjectFilterByKey('name');
  public discoveryGraphNameFilter = new ObjectFilterByKey('discoveryGraphName');

  ngOnInit() {
    this.modalTypes = new ModalTypes(['Rules', 'Sku Config', 'Discovery Graph Options']);
    this.getAllSkus();
    this.createForm();
    this.selectedSkus = [];
    this.isSkuOnly = false;
  }

  onFilter(filtered): void {
    this.skuStore = filtered;
  }

  onConfirm(value) {
    switch (value) {
      case 'reject':
        this.isDelete = false;
        break;
      case 'accept':
        this.isDelete = false;
        this.deleteSel();
    }
  }

  onAction(action) {
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

  createForm() {
    this.skuForm = this.fb.group({
      name: new FormControl('', { validators: [Validators.required] }),
      discoveryGraphName: '',
      discoveryGraphOptions: '',
      rules: new FormControl('', { validators: [Validators.required] })
    });
  }

  onRadioChange() {
    this.isSkuOnly = !this.isSkuOnly;
  }

  getAllSkus(): void {
    this.skusService.getAll()
      .subscribe( data => {
        this.skuStore = data;
        this.allSkus = data;
        this.dgDataLoading = false;
      });
  }

  goToDetail(sku: SKU) {
    this.selectedSku = sku;
    this.isShowDetail = true;
  }

  getChild(objKey: string, sku: SKU) {
    this.selectedSku = sku;
    this.action = startCase(objKey);
    this.rawData = sku && sku[objKey];
    if (this.selectedSku && this.action && (!isEmpty(this.rawData))) {
      this.isShowModal = true;
    }
  }

  create(): void {
    this.isCreateSku = true;
    this.isSkuOnly = false;
    this.updateTheSku = false;
    this.createForm();

  }

  willUpdate(sku: SKU): void {
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

  batchDelete(): void {
    if (!isEmpty(this.selectedSkus)) {
      this.isDelete = true;
    }
  }

  willDelete(sku: SKU): void {
    this.selectedSkus = [sku];
    this.isDelete = true;
  }

  refresh() {
    this.dgDataLoading = true;
    this.getAllSkus();
  }

  onChange(event) {
    this.skuPackFiles = event.target.files;
  }

  createSku(): void {
    const jsonData: any = {};
    this.skuForm.getRawValue();
    const value = this.skuForm.value;
    // data transform
    jsonData.name = value.name;
    // TODO: name is required;
    if (value.discoveryGraphName) {
      jsonData.discoveryGraphName = value.discoveryGraphName;
    }
    this.rulesJsonValid = isJsonTextValid(value.rules);
    this.optionsJsonValid = isJsonTextValid(value.discoveryGraphOptions);
    if (this.rulesJsonValid) {
      jsonData.rules = value.rules ? JSON.parse(value.rules) : [];
      const self = this;
      if (isEmpty(jsonData.rules)) {
        self.rulesJsonValid = false;
      }
      forEach(map(jsonData.rules, 'path'), (item) => {
          if (isUndefined(item)) {
            self.rulesJsonValid = false;
          }
      });
    }
    if (this.optionsJsonValid) {
      const data = value.discoveryGraphOptions  && JSON.parse(value.discoveryGraphOptions);
      if (!isEmpty(data)) {
        jsonData.discoveryGraphOptions = data;
      }
    }
    if (this.rulesJsonValid && this.optionsJsonValid && this.skuForm.get('name').valid) {
      this.isCreateSku = false;
      if (this.updateTheSku === true) {
        this.updateTheSku = false;
        this.skusService.updateSku(jsonData)
          .subscribe(data => {
            this.refresh();
          });
      } else {
        this.skusService.createSku(jsonData)
          .subscribe(data => {
            this.refresh();
          });
      }

    }
  }

  createSkupack(): void {
    this.isCreateSku = false;
    const file = this.skuPackFiles[0];
    const identifier = this.selectedSkus.length && this.selectedSku.id;
    this.skusService.uploadByPost(file, identifier)
    .subscribe(() => {
      this.refresh();
    });
  }

  deleteSel(): void {
    const list = [];
    forEach(this.selectedSkus, sku => {
      list.push(sku.id);
    });

    this.skusService.deleteByIdentifiers(list)
    .subscribe(results => {
      this.refresh();
    });
  }
}
