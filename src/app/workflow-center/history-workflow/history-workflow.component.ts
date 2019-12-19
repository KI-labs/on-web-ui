import { ChangeDetectorRef, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';

import {
  createFilters,
  createComparator
} from '../../utils/inventory-operator';
import * as _ from 'lodash';
import { WorkflowService } from 'app/services/rackhd/workflow.service';
import { GraphService } from 'app/services/rackhd/graph.service';
import { Workflow, ModalTypes, HISTORY_WORKFLOW_STATUS } from 'app/models';

@Component({
  selector: 'app-history-workflow',
  templateUrl: './history-workflow.component.html',
  styleUrls: ['./history-workflow.component.scss'],
  encapsulation: ViewEncapsulation.None
})

export class HistoryWorkflowComponent implements OnInit {
  public workflowsStore: Workflow[] = [];
  public allWorkflows: Workflow[] = [];
  public selectedWorkflows: Workflow[] = [];
  public selectedWorkflow: Workflow;

  public action: string;
  public isShowModal: boolean;
  public rawData: string;

  public selectedStatus: string;
  public statusCountMatrix: {};
  public statusFilterValue: string;

  // data grid helper
  public dgDataLoading = false;
  public dgPlaceholder = 'No history workflow found!';

  public modalTypes: ModalTypes;

  public gridFilters: any = {};
  public gridComparators: any = {};

  constructor(
    private workflowService: WorkflowService,
    private graphService: GraphService,
    private router: Router,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  public ngOnInit() {
    createFilters(
      this.gridFilters,
      [
        'node', 'instanceId', 'id', 'name', 'injectableName', 'domain',
        'definition', 'context', 'tasks', 'serviceGraph', 'status'
      ],
      new Workflow()
    );
    createComparator(
      this.gridComparators,
      ['node', 'name', 'injectableName', 'domain', 'status'],
      new Workflow()
    );
    this.modalTypes = new ModalTypes(
      ['Detail', 'Tasks', 'Options', 'Instance Id', 'Context', 'Definition']
    );
    this.isShowModal = false;
    this.getAll();
  }

  public getAll(): void {
    this.workflowService.getAllHistory()
      .subscribe((data) => {
        this.workflowsStore = data;
        this.allWorkflows = data;
        this.dgDataLoading = false;
        this.collectStatusType();
      });
  }

  get statusTypes() {
    return HISTORY_WORKFLOW_STATUS;
  }

  public selectStatus(status: string) {
    this.selectedStatus = this.selectedStatus === status ? '' : status;
    this.statusFilterValue = this.selectedStatus;
    this.changeDetectorRef.detectChanges();
  }

  public collectStatusType() {
    this.statusCountMatrix = _.transform(this.allWorkflows, (result, item) => {
      const type = item.status;
      result[type] ? result[type] += 1 : result[type] = 1;
    }, []);
  }

  public getMetaData(identifier: string): void {
    this.workflowService.getByIdentifier(identifier)
    .subscribe((data) => {
      this.rawData = data;
      this.isShowModal = true;
    });
  }

  public deleteSel() {
    const list = _.map(this.selectedWorkflows, (workflow) => {
      return workflow.instanceId;
    });
    this.isShowModal = false;
    this.workflowService.deleteByIdentifiers(list)
    .subscribe(() => {
      this.refresh();
    });
  }

  // getRawData(identifier: string): void {}

  public getHttpMethod() {
  }

  public getChild(objKey: string, workflow: Workflow) {
    this.selectedWorkflow = workflow;
    this.action = _.startCase(objKey);
    this.rawData = workflow && workflow[objKey];
    this.isShowModal = true;
  }

  public getDefinition(workflow: Workflow) {
    this.selectedWorkflow = workflow;
    const graphName = workflow.definition.split('/').pop();
    this.graphService.getByIdentifier(graphName)
    .subscribe(
      (data) => {
        this.rawData = data;
        this.action = 'Definition';
        this.isShowModal = true;
      }
    );
  }

  public refresh() {
    this.isShowModal = false;
    this.dgDataLoading = true;
    this.getAll();
  }

  public batchDelete() {
    if (!_.isEmpty(this.selectedWorkflows)) {
      this.action = 'Delete';
      this.isShowModal = true;
    }
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

  public onFilter(filtered: Workflow[]) {
    this.workflowsStore = filtered;
  }

  public onAction(action) {
    switch (action) {
      case 'Refresh':
        this.refresh();
        break;
      case 'Delete':
        this.batchDelete();
        break;
    }
  }

  public onDelete(workflow: Workflow) {
    this.selectedWorkflows = [workflow];
    this.action = 'Delete';
    this.isShowModal = true;
  }

  public onBatchCancel() {
    if (!_.isEmpty(this.selectedWorkflows)) {
      this.action = 'Cancel';
      this.isShowModal = true;
    }
  }

  public onCancel(workflow: Workflow) {
    this.selectedWorkflows = [workflow];
    this.action = 'Cancel';
    this.isShowModal = true;
  }

  // onCreate(){}

  // onUpdate(workflow: Workflow){}

  public onGetDetails(workflow: Workflow) {
    this.selectedWorkflow = workflow;
    this.action = 'Detail';
    this.getMetaData(workflow.instanceId);
  }

  // onGetRawData() {};

  // onChange(){}

  // onCancel(){}

  public gotoCanvas(workflow) {
    const graphId = workflow.instanceId;
    const url = '/workflowCenter/workflowViewer?graphId=' + graphId;
    this.router.navigateByUrl(url);
  }

  // onCreateSubmit(){}
}
