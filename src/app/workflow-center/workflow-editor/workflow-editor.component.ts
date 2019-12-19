import { Component, EventEmitter, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import * as _ from 'lodash';
import { GraphService } from '../../services/rackhd/graph.service';
import { JSONEditor } from '../../utils/json-editor';

const global = (window as any);

@Component({
  selector: 'app-workflow-editor',
  templateUrl: './workflow-editor.component.html',
  styleUrls: ['./workflow-editor.component.scss']
})
export class WorkflowEditorComponent implements OnInit {
  public onWorkflowInput = new EventEmitter();
  public selectWorkflow: any;
  public editor: any;
  public isShowModal: boolean;
  public saveGraphInfo: any = {};
  public isWorkflowValid: boolean;

  public workflowStore: any[] = [];

  public isWaitOnMismatch = false;

  public columns = [12];
  public placeholders = ['Search workflow definitions'];
  public fields = ['injectableName'];

  constructor(
    public graphService: GraphService,
    private router: Router) { }

  public clearInput() {
    this.onWorkflowChanged(this.graphService.getInitGraph());
    this.pushDataToCanvas();
  }

  public putWorkflowIntoCanvas(injectableName: string) {
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

  public onSelected(selWorkflow: any) {
    this.selectWorkflow = selWorkflow;
    this.putWorkflowIntoCanvas(selWorkflow.injectableName);
  }

  public onRefresh() {
    this.clearInput();
    this.getworkflowStore();
  }

  public ngOnInit() {
    this.isShowModal = false;
    this.selectWorkflow = this.graphService.getInitGraph();
    const container = document.getElementById('jsoneditor');
    const options = {mode: 'code'};
    this.editor = new JSONEditor(container, options);
    this.updateEditor(this.selectWorkflow);
    this.getworkflowStore();
  }

  public ngAfterViewInit() {
    this.pushDataToCanvas();
  }

  public getworkflowStore() {
    this.graphService.getAll()
      .subscribe((graphs) => {
        this.workflowStore = graphs;
      });
  }

  public applyWorkflowJson() {
    const tmpWorkflow = this.editor.get();
    this.isWaitOnMismatch = this.isTaskWaitOnLegal(tmpWorkflow) ? false : true;
    if (!this.isWaitOnMismatch) {
      this.selectWorkflow = tmpWorkflow;
      this.pushDataToCanvas();
    }
  }

  public isTaskWaitOnLegal(obj: any): boolean {
    let isLegal = true;
    if (obj && obj.tasks) {
      const taskLables = _.map(obj.tasks, 'label');
      const waitOnLables = _.unionBy(_.flatten(_.map(obj.tasks, 'waitOn').map(_.keys)));
      for (const label of waitOnLables) {
        isLegal = _.includes(taskLables, label);
        if (isLegal === false) {
          break;
        }
      }
    }
    return isLegal;
  }

  public refreshWorkflow() {
    const injectableNameTmp = this.selectWorkflow['injectableName'];
    for (const workflow of this.workflowStore) {
      if (workflow['injectableName'] === injectableNameTmp) {
        this.selectWorkflow = workflow;
        this.updateEditor(this.selectWorkflow);
        this.applyWorkflowJson();
        break;
      }
    }
  }

  public saveConfirm() {
    this.isWorkflowValid = this.selectWorkflow && this.selectWorkflow.injectableName
      && this.selectWorkflow.friendlyName && _.startsWith(this.selectWorkflow.injectableName, 'Graph.')
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
        notes: "Please make sure 'injectableName', 'friendlyName' and 'tasks' are not empty! Make sure 'injectableName' starts with 'Graph.'",
        type: 0
      };
    }
    this.isShowModal = true;
  }

  public saveWorkflow() {
    this.selectWorkflow = this.editor.get();
    this.graphService.createGraph(this.selectWorkflow)
      .subscribe(
        (res) => {
          this.saveGraphInfo = {
            status: 'Saved Successfully!',
            notes: 'Workflow ' + this.selectWorkflow.injectableName + ' has been saved successfully. Do you want to run it now?',
            type: 1
          };
        },
        (err) => {
          this.isShowModal = false;
        }
      );
  }

  public updateEditor(workflow: any) {
    this.editor.set(workflow);
  }

  public pushDataToCanvas() {
    this.onWorkflowInput.emit(_.cloneDeep(this.selectWorkflow));
  }

  public onWorkflowChanged(workflow: any) {
    this.selectWorkflow = workflow;
    this.updateEditor(workflow);
  }

  public jumpRunWorkflow() {
    this.isShowModal = false;
    this.router.navigate(['workflowCenter/runWorkflow'], {
      queryParams: {
        injectableName: this.editor.get().injectableName
      }
    });
  }
}
