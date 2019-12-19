import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs/observable/forkJoin';

import {
  createFilters,
  createComparator
} from 'app/utils/inventory-operator';

import * as _ from 'lodash';

import { WorkflowService } from 'app/services/rackhd/workflow.service';
import { GraphService } from 'app/services/rackhd/graph.service';
import { Workflow, ModalTypes } from 'app/models';

@Component({
  selector: 'app-active-workflow',
  templateUrl: './active-workflow.component.html',
  styleUrls: ['./active-workflow.component.scss'],
  encapsulation: ViewEncapsulation.None
})

export class ActiveWorkflowComponent implements OnInit {
  public workflowsStore: Workflow[] = [];
  public allWorkflows: Workflow[] = [];
  public selectedWorkflows: Workflow[] = [];
  public selectedWorkflow: Workflow;

  public action: string;
  public isShowModal: boolean;
  public rawData: string;

  // data grid helper
  public dgDataLoading = false;
  public dgPlaceholder = 'No active workflow found!';

  public modalTypes: ModalTypes;

  public gridFilter: any = {};
  public gridComparator: any = {};

  constructor(
    private workflowService: WorkflowService,
    private graphService: GraphService,
    private router: Router
  ) { }

  public ngOnInit() {
    createFilters(
      this.gridFilter,
      [
        'node', 'instanceId', 'id', 'name', 'injectableName', 'domain',
        'definition', 'context', 'tasks', 'serviceGraph'
      ],
      new Workflow()
    );
    createComparator(
      this.gridComparator,
      ['node', 'name', 'injectableName', 'domain'],
      new Workflow()
    );
    this.modalTypes = new ModalTypes(
      ['Detail', 'Tasks', 'Options', 'Instance Id', 'Context', 'Definition']
    );
    this.isShowModal = false;
    this.getAll();
  }

  public getAll(): void {
    this.workflowService.getAllActive()
      .subscribe((data) => {
        this.workflowsStore = data;
        this.allWorkflows = data;
        this.dgDataLoading = false;
      });
  }

  public getMetaData(identifier: string): void {
    this.workflowService.getByIdentifier(identifier)
      .subscribe((data) => {
        this.rawData = data;
        this.isShowModal = true;
      });
  }

  public deleteSel() {
    const list = [];
    _.forEach(this.selectedWorkflows, (workflow) => {
      if (!workflow.serviceGraph || workflow.serviceGraph === 'false') {
        list.push(this.workflowService.cancelActiveWorkflow(workflow.node));
      }
    });
    if (_.isEmpty(list)) {
      this.isShowModal = false;
      return;
    }

    this.isShowModal = false;
    return forkJoin(list)
      .subscribe(() => {
        this.refresh();
      });
  }

  public getChild(objKey: string, workflow: Workflow) {
    this.selectedWorkflow = workflow;
    this.action = _.startCase(objKey);
    this.rawData = workflow && workflow[objKey];
    if (!_.isEmpty(this.rawData)) {
      this.isShowModal = true;
    }
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

  public batchCancel() {
    if (!_.isEmpty(this.selectedWorkflows)) {
      this.action = 'Cancel';
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
      case 'Cancel':
        this.batchCancel();
        break;
    }
  }

  public onCancel(workflow: Workflow) {
    this.selectedWorkflows = [workflow];
    this.action = 'Cancel';
    this.isShowModal = true;
  }

  public onGetDetails(workflow: Workflow) {
    this.selectedWorkflow = workflow;
    this.action = 'Detail';
    this.getMetaData(workflow.instanceId);
  }

  public gotoCanvas(workflow) {
    const graphId = workflow.instanceId;
    const url = '/workflowCenter/workflowViewer?graphId=' + graphId;
    this.router.navigateByUrl(url);
  }
}
