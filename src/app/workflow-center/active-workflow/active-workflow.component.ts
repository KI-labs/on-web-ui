import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import {forkJoin} from 'rxjs/observable/forkJoin';

import {
  createFilters,
  createComparator
} from '../../utils/inventory-operator';

import { forEach, isEmpty, startCase } from 'lodash-es';

import { WorkflowService } from '../../services/rackhd/workflow.service';
import { GraphService } from '../../services/rackhd/graph.service';
import { Workflow, ModalTypes } from '../../models';

@Component({
  selector: 'app-active-workflow',
  templateUrl: './active-workflow.component.html',
  styleUrls: ['./active-workflow.component.scss'],
  encapsulation: ViewEncapsulation.None
})

export class ActiveWorkflowComponent implements OnInit {
  workflowsStore: Workflow[] = [];
  allWorkflows: Workflow[] = [];
  selectedWorkflows: Workflow[] = [];
  selectedWorkflow: Workflow;

  action: string;
  isShowModal: boolean;
  rawData: string;

  // data grid helper
  dgDataLoading = false;
  dgPlaceholder = 'No active workflow found!';

  modalTypes: ModalTypes;

  gridFilter: any = {};
  gridComparator: any = {};

  constructor(
    private workflowService: WorkflowService,
    private graphService: GraphService,
    private router: Router
  ) {}

  ngOnInit() {
    createFilters(
      this.gridFilter,
      [
        'node', 'instanceId', 'id', 'name', 'injectableName', 'domain',
        'definition', 'context', 'tasks', 'serviceGraph'
      ],
      new Workflow()
    );
    createComparator(this.gridComparator, ['node', 'name', 'injectableName', 'domain'], new Workflow());
    this.modalTypes = new ModalTypes(
      ['Detail', 'Tasks', 'Options', 'Instance Id', 'Context', 'Definition']
    );
    this.isShowModal = false;
    this.getAll();
  }

  getAll(): void {
    this.workflowService.getAllActive()
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

  deleteSel() {
    const list = [];
    forEach(this.selectedWorkflows, workflow => {
      if (!workflow.serviceGraph || workflow.serviceGraph === 'false') {
        list.push(this.workflowService.cancelActiveWorkflow(workflow.node));
      }
    });
    if (isEmpty(list)) {
      this.isShowModal = false;
      return;
    }

    this.isShowModal = false;
    return forkJoin(list)
    .subscribe((result) => {
      this.refresh();
    });
  }

  getChild(objKey: string, workflow: Workflow) {
    this.selectedWorkflow = workflow;
    this.action = startCase(objKey);
    this.rawData = workflow && workflow[objKey];
    if (!isEmpty(this.rawData)) {
      this.isShowModal = true;
    }
  }

  getDefinition(workflow: Workflow) {
    this.selectedWorkflow = workflow;
    const graphName = workflow.definition.split('/').pop();
    this.graphService.getByIdentifier(graphName)
    .subscribe(
      data => {
        this.rawData = data;
        this.action = 'Definition';
        this.isShowModal = true;
      }
    );
  }

  refresh() {
    this.isShowModal = false;
    this.dgDataLoading = true;
    this.getAll();
  }

  batchCancel() {
    if (!isEmpty(this.selectedWorkflows)) {
      this.action = 'Cancel';
      this.isShowModal = true;
    }
  }

  onConfirm(value) {
    switch (value) {
      case 'reject':
        this.isShowModal = false;
        break;
      case 'accept':
        this.isShowModal = false;
        this.deleteSel();
    }
  }

  onFilter(filtered: Workflow[]) {
    this.workflowsStore = filtered;
  }

  onAction(action) {
    switch (action) {
      case 'Refresh':
        this.refresh();
        break;
      case 'Cancel':
        this.batchCancel();
        break;
    }
  }

  onCancel(workflow: Workflow) {
    this.selectedWorkflows = [workflow];
    this.action = 'Cancel';
    this.isShowModal = true;
  }

  onGetDetails(workflow: Workflow) {
    this.selectedWorkflow = workflow;
    this.action = 'Detail';
    this.getMetaData(workflow.instanceId);
  }

  gotoCanvas(workflow) {
    const graphId = workflow.instanceId;
    const url = '/workflowCenter/workflowViewer?graphId=' + graphId;
    this.router.navigateByUrl(url);
  }
}
