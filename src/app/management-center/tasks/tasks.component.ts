import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs/observable/forkJoin';
import {
  AlphabeticalComparator,
  ObjectFilterByKey
} from '../../utils/inventory-operator';

import * as _ from 'lodash';

import { GraphTaskService } from '../../services/rackhd/task.service';

import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TaskCustom, ModalTypes } from '../../models';
import { validateJSON } from '../shared/validation-rules';


@Component({
  selector: 'app-tasks',
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.scss']
})
export class TasksComponent implements OnInit {
  tasksStore: TaskCustom[] = [];
  allTasks: TaskCustom[] = [];
  selectedTasks: TaskCustom[] = [];
  selectedTask: TaskCustom = null;

  customTaskFormGroup: FormGroup;
  dgDataLoading = false;
  dgPlaceholder = 'No task found!';
  optionsJsonValid = true;
  propertiesJsonValid = true;
  action: string;

  isShowModal = false;
  rawData: string;

  modalTypes: ModalTypes;

  public friendlyNameComparator = new AlphabeticalComparator<TaskCustom>('friendlyName');
  public injectableNameComparator = new AlphabeticalComparator<TaskCustom>('injectableName');
  public implementsTaskComparator = new AlphabeticalComparator<TaskCustom>('implementsTask');

  public friendlyNameFilter = new ObjectFilterByKey<TaskCustom>('friendlyName');
  public injectableNameFilter = new ObjectFilterByKey<TaskCustom>('injectableName');
  public implementsTaskFilter = new ObjectFilterByKey<TaskCustom>('implementsTask');
  public optionsFilter = new ObjectFilterByKey<TaskCustom>('options');
  public propertiesFilter = new ObjectFilterByKey<TaskCustom>('properties');

  constructor(
    private taskService: GraphTaskService,
    private fb: FormBuilder
  ) {
    this.customTaskFormGroup = this.fb.group({
      injectableName: [{value: '', disabled: this.action === 'Update'}, Validators.required],
      friendlyName: ['', Validators.required],
      implementsTask: ['', Validators.required],
      options: ['', validateJSON],
      properties: ['', validateJSON],
    });
  }

  ngOnInit() {
    this.isShowModal = false;
    this.getAll();
    this.modalTypes = new ModalTypes(['Tasks', 'Detail', 'Options', 'Properties']);
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
    });
  }

  updateTask(payload: object): void {
    this.isShowModal = false;
    this.updateFormGroup();
    this.taskService.put(payload, 'text')
    .subscribe(() => {
      this.dgDataLoading = true;
      this.getAll();
    });
  }

  getChild(objKey: string, task: TaskCustom) {
    this.selectedTask = task;
    this.action = _.capitalize(objKey);
    this.rawData = task && task[objKey];
    if (!_.isEmpty(this.rawData)) {
      this.isShowModal = true;
    }
  }

  refresh() {
    this.isShowModal = false;
    this.dgDataLoading = true;
    this.getAll();
  }

  create() {
    this.action = 'Create';
    this.updateFormGroup();
    this.isShowModal = true;
  }

  batchDelete() {
    if (!_.isEmpty(this.selectedTasks)) {
      this.action = 'Delete';
      this.isShowModal = true;
    }
  }

  onFilter(filtered: TaskCustom[]) {
    this.tasksStore = filtered;
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

  updateFormGroup(taskCustom?: TaskCustom) {
    const control = this.customTaskFormGroup.get('injectableName');
    this.action === 'Update' ? control.disable() : control.enable();
    if (!_.isEmpty(taskCustom)) {
      const _taskCustom = _.cloneDeep(taskCustom);
      _taskCustom.options = JSON.stringify(_taskCustom.options);
      _taskCustom.properties = JSON.stringify(_taskCustom.properties);
      this.customTaskFormGroup.patchValue(_taskCustom);
    }
  }

  onCancel() {
    this.action = '';
    this.selectedTask = null;
    this.selectedTasks = [];
    this.isShowModal = false;
    this.customTaskFormGroup.reset();
    this.optionsJsonValid = true;
    this.propertiesJsonValid = true;
  }


  onUpdate(task: TaskCustom) {
    this.selectedTask = task;
    this.action = 'Update';
    this.updateFormGroup(this.selectedTask);
    this.isShowModal = true;
  }

  onGetDetails(task: TaskCustom) {
    this.selectedTask = task;
    this.action = 'Detail';
    this.getMetaData(task.injectableName);
  }

  onDelete(task: TaskCustom) {
    this.selectedTasks = [task];
    this.action = 'Delete';
    this.isShowModal = true;
  }

  onDeleteSubmit() {
    const list = _.map(this.selectedTasks, task => {
      return this.taskService.delete(task.injectableName);
    });
    this.isShowModal = false;
    return forkJoin(list)
    .subscribe(
      data => { this.refresh(); }
    );
  }

  onSubmit() {
    const payload = this.customTaskFormGroup.value;
    if (this.customTaskFormGroup.valid) {
      payload.options = _.isEmpty(payload.options) ? {} : JSON.parse(payload.options);
      payload.properties = _.isEmpty(payload.properties) ? {} : JSON.parse(payload.properties);
      this.updateTask(payload);
    }
  }

}
