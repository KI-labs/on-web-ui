import { ChangeDetectorRef, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Comparator, StringFilter } from "@clr/angular";
import { Subject } from 'rxjs/Subject';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Observable } from 'rxjs/Observable';

import {
  AlphabeticalComparator,
  StringOperator,
  ObjectFilterByKey,
  createFilters,
  createComparator
} from '../../utils/inventory-operator';
import { FormsModule, ReactiveFormsModule, FormGroup,FormControl }   from '@angular/forms';
import * as _ from 'lodash';
import { WorkflowService } from 'app/services/rackhd/workflow.service';
import { GraphService } from 'app/services/rackhd/graph.service';
import { Workflow, Task, ModalTypes, HISTORY_WORKFLOW_STATUS } from 'app/models';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';

@Component({
  selector: 'app-history-workflow',
  templateUrl: './history-workflow.component.html',
  styleUrls: ['./history-workflow.component.scss'],
  encapsulation: ViewEncapsulation.None
})

export class HistoryWorkflowComponent implements OnInit {
  workflowsStore: Workflow[] = [];
  allWorkflows: Workflow[] = [];
  selectedWorkflows: Workflow[] = [];
  selectedWorkflow: Workflow;

  action: string;
  isShowModal: boolean;
  rawData: string;

  selectedStatus: string;
  statusCountMatrix: {};
  statusFilterValue: string;
  taskFormGroup: FormGroup;
  tasksJsonValid = true;

  // data grid helper
  dgDataLoading = false;
  dgPlaceholder = 'No history workflow found!';

  modalTypes: ModalTypes;

  gridFilters: any = {};
  gridComparators: any = {};

  constructor(
    private workflowService: WorkflowService,
    private graphService: GraphService,
    private router: Router,
    private changeDetectorRef: ChangeDetectorRef
  ){}

  ngOnInit() {
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
      ["node", "name", "injectableName", "domain", 'status'],
      new Workflow()
    );

    this.modalTypes = new ModalTypes(
      ["Detail", "Tasks", "Options", "Instance Id", "Context", "Definition", "Add task"]
    );
    this.isShowModal = false;
    this.getAll();
  }

  getAll(): void {
    this.workflowService.getAllHistory()
      .subscribe(data => {
        this.workflowsStore = data;
        this.allWorkflows = data;
        this.dgDataLoading = false;
        this.collectStatusType();
      });
  }

  get statusTypes(){
    return HISTORY_WORKFLOW_STATUS;
  }

  selectStatus(status: string){
    this.selectedStatus = this.selectedStatus === status ? '' : status;
    this.statusFilterValue = this.selectedStatus;
    this.changeDetectorRef.detectChanges();
  };

  collectStatusType() {
    this.statusCountMatrix = _.transform(this.allWorkflows, (result, item) => {
      let type = item.status;
      result[type] ? result[type] += 1 : result[type] = 1;
    }, []);
  }

  getMetaData(identifier: string): void {
    this.workflowService.getByIdentifier(identifier)
    .subscribe(data => {
      this.rawData = data;
      this.isShowModal = true;
    })
  }

  deleteSel(){
    let list = _.map(this.selectedWorkflows, workflow => {
      return workflow.instanceId;
    });
    this.isShowModal = false;
    this.workflowService.deleteByIdentifiers(list)
    .subscribe(() => {
      this.refresh();
    });
  }

  createFormGroup(task?: Task){
    this.taskFormGroup = new FormGroup({
      tasks: new FormControl('')
    });
    if (!_.isEmpty(task)) {
      console.log(task)
      this.taskFormGroup.patchValue({tasks: task});
      // let _workflow = _.cloneDeep(workflow);
      // _workflow.options = JSON.stringify(_workflow.options);
      // _workflow.tasks = JSON.stringify(_workflow.tasks);
      // this.taskFormGroup.patchValue(_workflow);
    }
  }

  //getRawData(identifier: string): void {}

  getHttpMethod(){
  }

  getChild(objKey: string, workflow: Workflow){
    this.selectedWorkflow = workflow;
    this.action = _.startCase(objKey);
    this.rawData = workflow && workflow[objKey];
    this.isShowModal = true;
  }

  getDefinition(workflow: Workflow){
    this.selectedWorkflow = workflow;
    let graphName = workflow.definition.split('/').pop();
    this.graphService.getByIdentifier(graphName)
    .subscribe(
      data => {
        this.rawData = data;
        this.action = "Definition"
        this.isShowModal = true;
      }
    )
  }

  refresh() {
    this.isShowModal = false;
    this.dgDataLoading = true;
    this.getAll();
  }

  batchDelete() {
    if (!_.isEmpty(this.selectedWorkflows)){
      this.action = "Delete";
      this.isShowModal = true;
    }
  };

  onConfirm(value) {
    switch(value) {
      case 'reject':
        this.isShowModal = false;
        break;
      case 'accept':
        this.isShowModal = false;
        this.deleteSel();
    }
  }

  onFilter(filtered: Workflow[]){
    this.workflowsStore = filtered;
  }

  onAction(action){
    switch(action) {
      case 'Refresh':
        this.refresh();
        break;
      case 'Delete':
        this.batchDelete();
        break;
    };
  }

  onDelete(workflow: Workflow) {
    this.selectedWorkflows = [workflow];
    this.action = "Delete";
    this.isShowModal = true;
  };

  onBatchCancel() {
    if (!_.isEmpty(this.selectedWorkflows)){
      this.action = "Cancel";
      this.isShowModal = true;
    }
  };

  onCancel(workflow: Workflow) {
    this.selectedWorkflows = [workflow];
    this.action = "Cancel";
    this.isShowModal = true;
  };

  // onCreate(){}

  // onUpdate(workflow: Workflow){}

  onGetDetails(workflow: Workflow) {
    this.selectedWorkflow = workflow;
    this.action = "Detail";
    this.getMetaData(workflow.instanceId);
  };

  // onGetRawData() {};

  // onChange(){}

  // onCancel(){}

  gotoCanvas(workflow){
    let graphId = workflow.instanceId;
    let url = "/workflowCenter/workflowViewer?graphId=" + graphId;
    this.router.navigateByUrl(url);
  }

  onAddTask(workflow: Workflow) {
    this.selectedWorkflow = workflow;
    console.log(this.selectedWorkflow)
    this.action = "Add task";
    this.createFormGroup();
    this.isShowModal = true;
  }

  // onCreateSubmit(){}
}
