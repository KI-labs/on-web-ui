import { Component, EventEmitter, OnInit, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { map, unionBy,  cloneDeep, startsWith, flatten, includes, keys} from 'lodash';
import { GraphService } from '../../services/rackhd/graph.service';
import { JSONEditor } from '../../utils/json-editor';
import { JSONEditorOptions } from 'jsoneditor';

@Component({
  selector: 'app-workflow-editor',
  templateUrl: './workflow-editor.component.html',
  styleUrls: ['./workflow-editor.component.scss']
})

export class WorkflowEditorComponent implements OnInit, AfterViewInit  {
  onWorkflowInput = new EventEmitter();
  selectWorkflow: any;
  editor: any;
  isShowModal: boolean;
  saveGraphInfo: any = {};
  isWorkflowValid: boolean;

  workflowStore: any[] = [];

  isWaitOnMismatch = false;

  columns = [12];
  placeholders = ['Search workflow definitions'];
  fields = ['injectableName'];

  constructor(
    public graphService: GraphService,
    private router: Router) {}

  clearInput() {
    this.onWorkflowChanged(this.graphService.getInitGraph());
    this.pushDataToCanvas();
  }

  putWorkflowIntoCanvas(injectableName: string) {
    let workflow = {};
    for (const item of this.workflowStore) {
      if (item.injectableName.replace(/\s/ig, '') === injectableName.replace(/\s/ig, '')) {
        workflow = item;
        break;
      }
    }
    if (workflow) {
      this.updateEditor(workflow);
      this.applyWorkflowJson();
    }
  }

  onSelected(selWorkflow: any) {
    this.selectWorkflow = selWorkflow;
    this.putWorkflowIntoCanvas(selWorkflow.injectableName);
  }

  onRefresh() {
    this.clearInput();
    this.getWorkflowStore();
  }

  ngOnInit() {
    this.isShowModal = false;
    this.selectWorkflow = this.graphService.getInitGraph();
    const container = document.getElementById('jsoneditor');
    const options: JSONEditorOptions = {mode: 'code'};
    this.editor = new JSONEditor(container, options);
    this.updateEditor(this.selectWorkflow);
    this.getWorkflowStore();
  }

  ngAfterViewInit() {
    this.pushDataToCanvas();
  }

  getWorkflowStore() {
    this.graphService.getAll()
      .subscribe(graphs => {
        this.workflowStore = graphs;
      });
  }

  applyWorkflowJson() {
    const tmpWorkflow = this.editor.get();
    this.isWaitOnMismatch = this.isTaskWaitOnLegal(tmpWorkflow) ? false : true;
    if (!this.isWaitOnMismatch) {
      this.selectWorkflow = tmpWorkflow;
      this.pushDataToCanvas();
    }
  }

  isTaskWaitOnLegal(obj: any): boolean {
    let isLegal = true;
    if (obj && obj.tasks) {
      const taskLables = map(obj.tasks, 'label');
      const waitOnLables = unionBy(flatten(map(obj.tasks, 'waitOn').map(keys)));
      for (const label of waitOnLables) {
        isLegal = includes(taskLables, label);
        if (isLegal === false) {
          break;
        }
      }
    }
    return isLegal;
  }

  refreshWorkflow() {
    const injectableNameTmp = this.selectWorkflow.injectableName;
    for (const workflow of this.workflowStore) {
      if (workflow.injectableName === injectableNameTmp) {
        this.selectWorkflow = workflow;
        this.updateEditor(this.selectWorkflow);
        this.applyWorkflowJson();
        break;
      }
    }
  }

  saveConfirm() {
    this.isWorkflowValid = this.selectWorkflow && this.selectWorkflow.injectableName
      && this.selectWorkflow.friendlyName && startsWith(this.selectWorkflow.injectableName, 'Graph.')
      && this.selectWorkflow.tasks && (this.selectWorkflow.tasks.length > 0);
    if (this.isWorkflowValid) {
      this.saveGraphInfo = {
        status: 'Are you sure to save ' + this.selectWorkflow.injectableName,
        notes: '',
        type: 0
      };
    } else {
      this.saveGraphInfo = {
        status: 'Invalid workflow payload!',
        notes: 'Please make sure \'injectableName\', \'friendlyName\' and \'tasks\' are not empty! Make sure \'injectableName\' starts with \'Graph.\'',
        type: 0
      };
    }
    this.isShowModal = true;
  }

  saveWorkflow() {
    this.selectWorkflow = this.editor.get();
    this.graphService.createGraph(this.selectWorkflow)
      .subscribe(
        res => {
          this.saveGraphInfo = {
            status: 'Saved Successfully!',
            notes: 'Workflow ' + this.selectWorkflow.injectableName + ' has been saved successfully. Do you want to run it now?',
            type: 1
          };
        },
        err => {
          this.isShowModal = false;
        }
      );
  }

  updateEditor(workflow: any) {
    this.editor.set(workflow);
  }

  pushDataToCanvas() {
    this.onWorkflowInput.emit(cloneDeep(this.selectWorkflow));
  }

  onWorkflowChanged(workflow: any) {
    this.selectWorkflow = workflow;
    this.updateEditor(workflow);
  }

  jumpRunWorkflow() {
    this.isShowModal = false;
    this.router.navigate(['workflowCenter/runWorkflow'], {
      queryParams: {
        injectableName: this.editor.get().injectableName
      }
    });
  }
}
