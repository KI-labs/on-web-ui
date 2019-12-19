import { Component, OnInit } from '@angular/core';
import { Poller, Node, POLLER_INTERVAL } from 'app/models';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { AlphabeticalComparator, DateComparator, ObjectFilterByKey, isJsonTextValid }
  from 'app/utils/inventory-operator';
import { PollersService } from 'app/services/rackhd/pollers.service';
import { NodeService } from 'app/services/rackhd/node.service';
import * as _ from 'lodash';

@Component({
  selector: 'app-pollers',
  templateUrl: './pollers.component.html',
  styleUrls: ['./pollers.component.scss']
})
export class PollersComponent implements OnInit {
  public pollerInterval: number[] = POLLER_INTERVAL;

  public pollerStore: Poller[];
  public allPollers: Poller[] = [];

  public selectedPoller: Poller;
  public isShowDetail: boolean;

  public isCreatePoller: boolean;
  public isDelete: boolean;
  public isUpdate: boolean;

  public updatePoller: Poller;
  public defaultInterval: number;
  public defaultPaused: boolean;

  public dgDataLoading = false;
  public dgPlaceholder = 'No poller found!';
  public jsonValid = true;

  public allNodes: Node[];
  public pollerForm: FormGroup;
  public updateForm: FormGroup;

  public selectedPollers: Poller[];

  public isShowLatestData = false;
  public currentPoller: any;
  public currentLatestData = '';

  public idComparator = new AlphabeticalComparator('id');
  public typeComparator = new AlphabeticalComparator('type');
  public configComparator = new AlphabeticalComparator('config');
  public pollIntervalComparator = new AlphabeticalComparator('pollInterval');
  public nodeComparator = new AlphabeticalComparator('node');
  public lastStartedComparator = new DateComparator('lastStarted');
  public lastFinishedComparator = new DateComparator('lastFinished');
  public pausedComparator = new AlphabeticalComparator('paused');
  public failureCountComparator = new AlphabeticalComparator('failureCount');

  public typeFilter = new ObjectFilterByKey('type');
  public nodeFilter = new ObjectFilterByKey('node');
  public configFilter = new ObjectFilterByKey('config');

  constructor(public pollersService: PollersService, public nodeService: NodeService,
              private fb: FormBuilder) {
  }

  public ngOnInit() {
    this.getAllPollers();
    this.getAllNodes();
    this.createForm();
    this.selectedPollers = [];
    this.defaultInterval = 60000;
  }

  public onFilter(filtered: any[]): void {
    this.pollerStore = filtered;
  }

  public onConfirm(value) {
    switch (value) {
      case 'reject':
        this.isDelete = false;
        break;
      case 'accept':
        this.isDelete = false;
        this.deleteSel();
    }
  }

  public onAction(action) {
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

  public getAllPollers(): void {
    this.pollersService.getAll()
      .subscribe((data) => {
        if (_.isEmpty(data)) {
          this.dgDataLoading = false;
          this.allPollers = [];
          this.pollerStore = [];
          return null;
        }
        this.allPollers = data;
        this.pollerStore = data;
        for (const poller of data) {
          this.getLatestData(poller);
        }
      });
  }

  public goToDetail(poller: Poller) {
    this.selectedPoller = poller;
    this.isShowDetail = true;
  }

  public create(): void {
    this.isCreatePoller = true;
  }

  public batchDelete(): void {
    if (!_.isEmpty(this.selectedPollers)) {
      this.isDelete = true;
    }
  }

  public willDelete(poller: Poller) {
    this.selectedPollers = [poller];
    this.isDelete = true;
  }

  public willUpdate(poller: Poller): void {
    this.updatePoller = poller;
    this.defaultInterval = poller.pollInterval;
    if (!_.includes(this.pollerInterval, poller.pollInterval)) {
      this.pollerInterval.push(poller.pollInterval);
      this.pollerInterval.sort();
    }
    this.defaultPaused = poller.paused;
    this.updateForm = this.fb.group({
      pollInterval: [this.defaultInterval, Validators.required],
      paused: [String(this.defaultPaused), Validators.required]
    });
    this.isUpdate = true;
  }

  public update(): void {
    const jsonData = {};
    const value = this.updateForm.value;

    if (value['pollInterval'] !== this.defaultInterval) {
      jsonData['pollInterval'] = value['pollInterval'];
    }
    if (Boolean(value['paused']) !== this.defaultPaused) {
      jsonData['paused'] = !this.defaultPaused;
    }
    const postData = JSON.stringify(jsonData);
    this.pollersService.patchByIdentifier(this.updatePoller.id, postData)
      .subscribe(() => {
          this.refresh();
        });
  }

  public getLatestData(poller: Poller): void {
    this.dgDataLoading = true;
    this.pollersService.getLatestData(poller.id)
      .subscribe((latestData) => {
        poller['latestData'] = latestData;
        this.dgDataLoading = false;
      });
  }

  public refresh() {
    this.dgDataLoading = true;
    this.getAllPollers();
  }

  public getAllNodes(): void {
    this.nodeService.getAll()
      .subscribe((data) => {
        this.allNodes = data;
      });
  }

  public createForm() {
    this.pollerForm = this.fb.group({
      type: ['', Validators.required],
      node: ['', Validators.required],
      pollInterval: 60000,
      config: '',
    });

    this.updateForm = this.fb.group({
      pollInterval: ['', Validators.required],
      paused: ['', Validators.required]
    });
  }

  public createPoller(): void {
    const jsonData = {};
    const value = this.pollerForm.value;

    this.jsonValid = isJsonTextValid(value.config);
    if (this.jsonValid) {
      // data transform
      jsonData['type'] = value['type'];
      jsonData['node'] = value['node'];
      jsonData['pollInterval'] = _.isEmpty(value.pollInterval) ? 60000 : parseInt(value.pollInterval);
      jsonData['config'] = _.isEmpty(value.config) ? {} : JSON.parse(value.config);

      this.isCreatePoller = false;
      this.pollersService.createPoller(jsonData)
        .subscribe(() => {
            this.refresh();
          });
    }
  }

  public deleteSel(): void {
    const list = [];
    _.forEach(this.selectedPollers, (poller) => {
      list.push(poller.id);
    });

    this.pollersService.deleteByIdentifiers(list)
      .subscribe(() => {
          this.refresh();
        });
  }

  public showPollerLatestData(poller: Poller) {
    this.isShowLatestData = true;
    this.currentPoller = poller;
    this.currentLatestData = poller.latestData || "There's no latest data.";
  }
}
