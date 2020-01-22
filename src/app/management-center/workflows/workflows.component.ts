import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import {
  AlphabeticalComparator,
  ObjectFilterByKey
} from '../../utils/inventory-operator';
import { FormControl, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs/observable/forkJoin';

import { map, capitalize, isEmpty, cloneDeep } from 'lodash-es';

import { GraphService } from '../../services/rackhd/graph.service';
import { Graph, ModalTypes } from '../../models';


@Component({
  selector: 'app-workflows',
  templateUrl: './workflows.component.html',
  styleUrls: ['./workflows.component.scss'],
  encapsulation: ViewEncapsulation.None
})

export class WorkflowsComponent implements OnInit {
  workflowsStore: Graph[] = [];
  allWorkflows: Graph[] = [];
  selectedWorkflows: Graph[] = [];
  selectedWorkflow: Graph;

  action: string;
  isShowModal: boolean;
  rawData: string;
  modalFormGroup: FormGroup;
  // data grid helper
  dgDataLoading = false;
  dgPlaceholder = 'No workflow found!';

  modalTypes: ModalTypes;

  public friendlyNameComparator = new AlphabeticalComparator<Graph>('friendlyName');
  public injectableNameComparator = new AlphabeticalComparator<Graph>('injectableName');

  public friendlyNameFilter = new ObjectFilterByKey<Graph>('friendlyName');
  public injectableNameFilter = new ObjectFilterByKey<Graph>('injectableName');
  public optionsFilter = new ObjectFilterByKey<Graph>('options');
  public tasksFilter = new ObjectFilterByKey<Graph>('tasks');

  constructor(
    private workflowService: GraphService,
    private router: Router) {}

  ngOnInit() {
    this.isShowModal = false;
    this.getAll();
    this.modalTypes = new ModalTypes(['Tasks', 'Detail', 'Options']);
  }

  getAll(): void {
    this.workflowService.getAll()
      .subscribe(data => {
        this.workflowsStore = data;
        this.allWorkflows = data;
        this.dgDataLoading = false;
      });
  }

  getMetaData(identifier: string): void {
    this.workflowService.getByIdentifier(identifier)
    .subscribe(data => {
      this.rawData = data;
      this.isShowModal = true;
    });
  }

  upsertGraph(payload: object): void {
    this.isShowModal = false;
    this.workflowService.put(payload, 'text')
    .subscribe();
  }

  getChild(objKey: string, workflow: Graph) {
    this.selectedWorkflow = workflow;
    this.action = capitalize(objKey);
    this.rawData = workflow && workflow[objKey];
    if (!isEmpty(this.rawData)) {
      this.isShowModal = true;
    }
  }

  createFormGroup(workflow?: Graph) {
    this.modalFormGroup = new FormGroup({
      injectableName: new FormControl(''),
      friendlyName: new FormControl(''),
      options: new FormControl(''),
      tasks: new FormControl('')
    });
    if (!isEmpty(workflow)) {
      const workflowCloned = cloneDeep(workflow);
      workflowCloned.options = JSON.stringify(workflowCloned.options);
      workflowCloned.tasks = JSON.stringify(workflowCloned.tasks);
      this.modalFormGroup.patchValue(workflowCloned);
    }
  }

  refresh() {
    this.isShowModal = false;
    this.dgDataLoading = true;
    this.getAll();
  }

  batchDelete() {
    if (!isEmpty(this.selectedWorkflows)) {
      this.action = 'Delete';
      this.isShowModal = true;
    }
  }

  create() {
    if (!this.modalFormGroup) {
      this.createFormGroup();
    }
    this.action = 'Create';
    this.isShowModal = true;
  }

  onFilter(filtered: Graph[]) {
    this.workflowsStore = filtered;
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


  onUpdate(workflow: Graph) {
    this.selectedWorkflow = workflow;
    this.createFormGroup(this.selectedWorkflow);
    this.action = 'Update';
    this.isShowModal = true;
  }

  onDelete(workflow: Graph) {
    this.selectedWorkflows = [workflow];
    this.action = 'Delete';
    this.isShowModal = true;
  }

  onGetDetails(workflow: Graph) {
    this.selectedWorkflow = workflow;
    this.action = 'Detail';
    this.getMetaData(workflow.injectableName);
  }

  // onGetRawData() {};

  // onChange(){}

  onCancel() {
    this.action = '';
    this.selectedWorkflow = null;
    this.selectedWorkflows = [];
    this.isShowModal = false;
  }

  onDeleteSubmit() {
    const list = map(this.selectedWorkflows, workflow => {
      return this.workflowService.delete(workflow.injectableName);
    });
    this.isShowModal = false;
    return forkJoin(list)
    .subscribe(
      data => { this.refresh(); }
    );
  }

  gotoCanvas(workflow) {
    const graphName = workflow.injectableName;
    const url = '/workflowCenter/workflowViewer?graphName=' + graphName;
    this.router.navigateByUrl(url);
  }

  onSubmit() {
    const payload = this.modalFormGroup.value;
    if (this.modalFormGroup.valid) {
      payload.options = isEmpty(payload.options) ? {} : JSON.parse(payload.options);
      payload.tasks = isEmpty(payload.tasks) ? [] : JSON.parse(payload.tasks);
      this.upsertGraph(payload);
    }
  }
}
