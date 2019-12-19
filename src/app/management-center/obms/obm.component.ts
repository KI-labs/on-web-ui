import { Component, OnInit } from '@angular/core';
import { OBM, Node, OBM_TYPES } from 'app/models';

import { FormControl, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { AlphabeticalComparator, ObjectFilterByKey, StringOperator } from 'app/utils/inventory-operator';

import { Subject } from 'rxjs/Subject';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Observable } from 'rxjs/Observable';
import { ObmService } from 'app/services/rackhd/obm.service';
import { NodeService } from 'app/services/rackhd/node.service';
import * as _ from 'lodash';

@Component({
  selector: 'app-obm',
  templateUrl: './obm.component.html',
  styleUrls: ['./obm.component.scss']
})

export class ObmComponent implements OnInit {

  get obmMetaList() {
    return OBM_TYPES;
  }
  public obmStore: OBM[];
  public allObms: OBM[] = [];
  public selectedObm: OBM;
  public selectedObms: OBM[];
  public obmTypes: string[] = [];
  public selObmService: any;

  public action: string;
  public rawData: string;
  public isShowModal: boolean;

  public dgDataLoading = false;
  public dgPlaceholder = 'No OBM found!';

  public allNodes: Node[] = [];
  public selNodeId: string;

  public obmForm: FormGroup;

  public configFields: string[];

  public idComparator = new AlphabeticalComparator('id');
  public nodeComparator = new AlphabeticalComparator('node');
  public serviceComparator = new AlphabeticalComparator('service');
  public configComparator = new AlphabeticalComparator('config');

  public nodeFilter = new ObjectFilterByKey('node');
  public serviceFilter = new ObjectFilterByKey('service');

  constructor(
    public obmsService: ObmService,
    public nodeService: NodeService,
    private fb: FormBuilder
  ) { }

  public ngOnInit() {
    this.getAllObms();
    this.getAllNodes();
    this.obmTypes = _.sortBy(_.keys(this.obmMetaList));
    this.createForm();
    this.selectedObms = [];
  }

  public onFilter(filtered): void {
    this.obmStore = filtered;
  }

  public onConfirm(value) {
    switch (value) {
      case 'reject':
        this.isShowModal = false;
        break;
      case 'accept':
        this.isShowModal = false;
        this.deleteSel();
    }
  }

  public onAction(action) {
    switch (action) {
      case 'Refresh':
        this.refresh();
        break;
      case 'Create':
        this.action = 'create';
        this.isShowModal = true;
        break;
      case 'Delete':
        this.batchDelete();
        break;
    }
  }

  public getAllObms(): void {
    this.obmsService.getAll()
      .subscribe((data) => {
        this.obmStore = data;
        this.allObms = data;
        this.dgDataLoading = false;
      });
  }

  public getAllNodes(): void {
    this.nodeService.getAll()
      .subscribe((data) => {
        this.allNodes = data;
      });
  }

  public goToDetail(obm: OBM) {
    this.selectedObm = obm;
    this.action = 'detail';
    this.isShowModal = true;
  }

  public getChild(objKey: string, obm: OBM) {
    this.selectedObm = obm;
    this.action = _.capitalize(objKey);
    this.rawData = obm && obm[objKey];
    this.action = 'Config';
    this.isShowModal = true;
  }

  public batchDelete(obm?: OBM): void {
    if (obm) {
      this.selectedObms = [obm];
    }
    this.action = 'delete';
    this.isShowModal = true;
  }

  public refresh() {
    this.dgDataLoading = true;
    this.getAllObms();
  }

  public createForm() {
    this.obmForm = this.fb.group({
      service: { value: '', validators: [Validators.required, Validators.minLength(1)] },
      nodeId: { value: '', validators: [Validators.required, Validators.minLength(25), Validators.maxLength(25)] }
    });
  }

  public updateFormInputs(service: string) {
    this.selObmService = this.obmMetaList[service];
    const config = this.selObmService.config;
    this.configFields = _.keys(config);
    _.forEach(this.configFields, (field) => {
      this.obmForm.addControl(field, new FormControl('', Validators.required));
    });
  }

  public onServiceSelected() {
    const service = this.obmForm.value.service;
    if (service) {
      this.updateFormInputs(service);
    }
  }

  public onNodeSelected(node) {
    this.selNodeId = node.id;
  }

  public onNodeClear() {
    this.selNodeId = null;
  }

  public onUpsert(): void {
    const values = this.obmForm.value;
    const payload =  {
      nodeId: this.selNodeId,
      service: values.service,
      config: {}
    };
    delete values.service;
    delete values.nodeId;
    if (values.port) { values.port = parseInt(values.port, 10); }
    _.merge(payload.config, values);
    this.obmsService.creatObm(payload)
    .subscribe((data) => {
      this.refresh();
      this.selNodeId = null;
    });
  }

  public closeUpsertModal() {
    _.forEach(_.keys(this.obmForm.value), (field) => {
      if (field === 'nodeId' || field === 'service') { return true; }
      this.obmForm.removeControl(field);
    });
    this.configFields = [];
    this.selObmService = null;
    this.obmForm.reset();
    this.isShowModal = false;
  }

  public onUpdate(obm: OBM) {
    this.updateFormInputs(obm.service);
    this.selNodeId = obm.node.split('/').pop();
    const formValues = {
      service: obm.service,
      nodeId: this.selNodeId
    };
    _.merge(formValues, obm.config);
    this.obmForm.patchValue(formValues);
    this.isShowModal = true;
    this.action = 'update';
  }

  public willDelete(obm) {
    this.selectedObms = [obm];
    this.action = 'delete';
    this.isShowModal = true;
  }

  public deleteSel(): void {
    const list = [];
    _.forEach(this.selectedObms, (obm) => {
      list.push(obm.id);
    });

    this.obmsService.deleteByIdentifiers(list)
    .subscribe((results) => {
      this.refresh();
    });
  }
}
