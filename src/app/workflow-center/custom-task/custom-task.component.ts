import { Component, OnInit } from '@angular/core';
import { isJsonTextValid } from 'app/utils/inventory-operator';
import { forkJoin } from 'rxjs/observable/forkJoin'

import * as _ from 'lodash';

import { GraphTaskService } from 'app/services/rackhd/task.service';

import { FormControl, FormGroup } from '@angular/forms';
import { TaskCustom, ModalTypes } from 'app/models';

@Component({
  selector: 'app-custom-task',
  templateUrl: './custom-task.component.html',
  styleUrls: ['./custom-task.component.scss']
})
export class CustomTaskComponent implements OnInit {
  tasksStore: TaskCustom[] = [];
  allTasks: TaskCustom[] = [];
  selectedTasks: TaskCustom[] = [];
  selectedTask: TaskCustom;
  
  customTaskFormGroup: FormGroup;
  dgDataLoading: boolean = false
  dgPlaceholder: string = 'No task found!';
  optionsJsonValid: boolean = true;
  propertiesJsonValid: boolean = true;
  action: string;

  isShowModal = false;
  rawData: string;

  modalTypes: ModalTypes;

  constructor(
    private taskService: GraphTaskService,
  ) { }

  ngOnInit() {
    this.isShowModal = false;
    this.getAll();
    this.modalTypes = new ModalTypes(["Tasks", "Detail", "Options", "Properties"]);
  }

  getAll(): void {
    this.taskService.getAll()
      .subscribe(data => {
        this.tasksStore = data;
        this.allTasks = data;
        this.dgDataLoading = false;
      });
  }

  getMetaData(identifier: string): void {
    this.taskService.getByIdentifier(identifier)
    .subscribe(data => {
      this.rawData = data;
      this.isShowModal = true;
    })
  }

  updateTask(payload: object): void {
    this.isShowModal = false;
    this.createFormGroup();
    this.taskService.put(payload, 'text')
    .subscribe(()=>{
      this.dgDataLoading = true;
      this.getAll()
    })
  }

  getChild(objKey: string, task: TaskCustom){
    this.selectedTask = task;
    this.action = _.capitalize(objKey);
    this.rawData = task && task[objKey];
    if (!_.isEmpty(this.rawData))
      this.isShowModal = true;
  }

  refresh() {
    this.isShowModal = false;
    this.dgDataLoading = true;
    this.getAll();
  }

  create(){
    if(!this.customTaskFormGroup){
      this.createFormGroup();
    }
    this.action = "Create";
    this.isShowModal = true;
  }

  batchDelete() {
    if (!_.isEmpty(this.selectedTasks)){
      this.action = "Delete";
      this.isShowModal = true;
    }
  };

  onFilter(filtered: TaskCustom[]){
    this.tasksStore = filtered;
  }

  onAction(action){
    switch(action) {
      case 'Refresh':
        this.refresh();
        break;
      case 'Create':
        this.create();
        break;
      case 'Delete':
        this.batchDelete();
        break;
    };
  }

  createFormGroup(taskCustom?: TaskCustom){
    this.customTaskFormGroup = new FormGroup({
      injectableName: new FormControl(''),
      friendlyName: new FormControl(''),
      implementsTask: new FormControl(''),
      options: new FormControl(''),
      properties: new FormControl('')
    });
    if (!_.isEmpty(taskCustom)) {
      let _taskCustom = _.cloneDeep(taskCustom);
      _taskCustom.options = JSON.stringify(_taskCustom.options);
      _taskCustom.properties = JSON.stringify(_taskCustom.properties);
      this.customTaskFormGroup.patchValue(_taskCustom);
    }
  }

  onCancel(){
    this.action = '';
    this.selectedTask = null;
    this.selectedTasks = [];
    this.isShowModal = false;
    this.optionsJsonValid = true;
    this.propertiesJsonValid = true;
  }


  onUpdate(task: TaskCustom){
    this.selectedTask = task;
    this.createFormGroup(this.selectedTask);
    this.action = "Update";
    this.isShowModal = true;
  }

  onGetDetails(task: TaskCustom) {
    this.selectedTask = task;
    this.action = "Detail";
    this.getMetaData(task.injectableName);
  };

  onDelete(task: TaskCustom) {
    this.selectedTasks = [task];
    this.action = "Delete";
    this.isShowModal = true;
  };

  onDeleteSubmit(){
    let list = _.map(this.selectedTasks, task =>{
      return this.taskService.delete(task.injectableName);
    });
    this.isShowModal = false;
    return forkJoin(list)
    .subscribe(
      data => { this.refresh(); }
    )
  }

  onSubmit(){
    let payload = this.customTaskFormGroup.value;
    this.optionsJsonValid = isJsonTextValid(payload.options);
    this.propertiesJsonValid = isJsonTextValid(payload.tasks);
    if (this.optionsJsonValid && this.propertiesJsonValid) {
      payload.options = _.isEmpty(payload.options) ? {} : JSON.parse(payload.options);
      payload.properties = _.isEmpty(payload.properties) ? [] : JSON.parse(payload.properties);
      this.updateTask(payload)
    }
  }

}
