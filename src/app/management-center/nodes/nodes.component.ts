import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';

import { NodeService } from 'app/services/rackhd/node.service';
import { Node, NODE_TYPE_MAP, NodeType, OBM } from 'app/models';

import { FormBuilder, FormGroup } from '@angular/forms';
import { ObmService } from 'app/services/rackhd/obm.service';
import { SkusService } from 'app/services/rackhd/sku.service';
import { IbmService } from '../services/ibm.service';
import {
  AlphabeticalComparator,
  DateComparator,
  isJsonTextValid,
  ObjectFilterByKey
} from 'app/utils/inventory-operator';

@Component({
  selector: 'app-nodes',
  templateUrl: './nodes.component.html',
  styleUrls: ['./nodes.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class NodesComponent implements OnInit {
  public nodeStore: Node[] = [];
  public allNodes: Node[] = [];

  public nodeTypes: NodeType[];
  public nodesTypeCountMatrix = {};

  public selectedType: string;
  public selectedSku: string;
  public selectedNode: Node;
  public selectedNodes: Node[];
  public isShowDetail: boolean;

  public isShowObmDetail: boolean;
  public selectedObms: OBM[];

  public isShowIbmDetail: boolean;
  public selectedIbms: OBM[];

  public isShowSkuDetail: boolean;
  public skuDetail: any;

  public isCreateNode: boolean;
  public isDelete: boolean;
  public nodeForm: FormGroup;

  public selectableNodeTypes: string[];

  public dgDataLoading = false;
  public dgPlaceholder = 'No node found!';

  public jsonValid = true;

  public nameComparator = new AlphabeticalComparator('name');
  public idComparator = new AlphabeticalComparator('id');
  public typeComparator = new AlphabeticalComparator('type');
  public skuComparator = new AlphabeticalComparator('sku');
  public autoDiscoverComparator = new AlphabeticalComparator('autoDiscover');
  public identifiersComparator = new AlphabeticalComparator('identifiers');
  public discoveredTimeComparator = new DateComparator('discoveredTime');
  public typeFilter = new ObjectFilterByKey('type');
  public skuFilter = new ObjectFilterByKey('sku');
  public typeFilterValue: string = this.selectedType;

  public shapeMap = {
    compute: 'computer',
    storage: 'data-cluster',
    network: 'network-switch'
  };

  constructor(
    public activatedRoute: ActivatedRoute,
    public router: Router,
    public nodeService: NodeService,
    public obmService: ObmService,
    public ibmService: IbmService,
    public skuService: SkusService,
    private fb: FormBuilder) { }

  public ngOnInit() {
    const self = this;
    this.selectableNodeTypes = _.values(NODE_TYPE_MAP);
    this.nodeService.getNodeTypes().subscribe(
      (data) => {
        this.nodeTypes = _.transform(
          data,
          function(result, item) {
            const dt = new NodeType();
            if (_.has(NODE_TYPE_MAP, item)) {
              dt.identifier = item;
              dt.displayName = NODE_TYPE_MAP[item];
              result.push(dt);
            }
          }, []);
      }
    );
    this.selectedNodes = [];
    this.getAllNodes();
    this.createForm();
  }

  public afterGetNodes() {
    this.nodesTypeCountMatrix = _.transform(this.nodeStore, (result, item) => {
      let type = item.type;
      if (!_.has(NODE_TYPE_MAP, type)) {
        type = 'other';
      }
      result[type] ? result[type] += 1 : result[type] = 1;
    }, []);
  }

  public getAllNodes(): void {
    this.nodeService.getAll()
      .subscribe((data) => {
        this.nodeStore = data;
        this.allNodes = data;
        this.dgDataLoading = false;
        this.afterGetNodes();
      });
  }

  public create(): void {
    this.isCreateNode = true;
  }

  public batchDelete(node?: Node): void {
    if (!_.isEmpty(this.selectedNodes)) {
      this.isDelete = true;
    }
  }

  public willDelete(node: Node): void {
    this.selectedNodes = [node];
    this.isDelete = true;
  }

  public refresh() {
    this.dgDataLoading = true;
    this.getAllNodes();
  }

  public createForm() {
    this.nodeForm = this.fb.group({
      name: '',
      type: '',
      autoDiscover: '',
      otherConfig: '',
    });
  }

  public createNode(): void {
    const value = this.nodeForm.value;
    this.jsonValid = isJsonTextValid(value['otherConfig']);
    if (this.jsonValid) {
      const jsonData = value['otherConfig'] ? JSON.parse(value['otherConfig']) : {};

      // data transform
      jsonData['name'] = value['name'];
      jsonData['type'] = value['type'];
      jsonData['autoDiscover'] = value['autoDiscover'] === 'true' ? true : false;
      this.isCreateNode = false;

      this.nodeService.post(jsonData)
        .subscribe((data) => {
          this.refresh();
        });
    }
  }

  public deleteSel(): void {
    const list = _.map(this.selectedNodes, (node) => {
      return node.id;
    });

    this.nodeService.deleteByIdentifiers(list)
      .subscribe((results) => {
        this.refresh();
      });
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

  public onFilter(filtered) {
    this.nodeStore = filtered;
    this.afterGetNodes();
  }

  public selectType(type: NodeType) {
    if (this.selectedType === type.displayName) {
      this.selectedType = '';
    } else {
      this.selectedType = type.displayName;
    }
    this.typeFilterValue = this.selectedType;
  }

  public goToDetail(node: Node) {
    this.selectedNode = node;
    this.isShowDetail = true;
  }

  public goToShowObmDetail(node: Node) {
    this.selectedNode = node;
    this.selectedObms = [];
    if (node.obms.length > 0) {
      for (const entry of node.obms) {
        const obmId = entry['ref'].split('/').pop();
        this.getObmById(obmId);
      }
      this.isShowObmDetail = true;
    }

  }

  public goToShowIbmDetail(node: Node) {
    this.selectedNode = node;
    this.selectedObms = [];
    if (node.ibms.length > 0) {
      for (const entry of node.ibms) {
        const ibmId = entry['ref'].split('/').pop();
        this.getIbmById(ibmId);
      }
      this.isShowIbmDetail = true;
    }
  }

  public goToShowSkuDetail(node: Node) {
    this.selectedNode = node;
    const skuId = node.sku ? node.sku.split('/')[4] : '';
    if (skuId) {
      this.skuService.getByIdentifier(skuId)
        .subscribe((data) => {
          this.skuDetail = data;
          this.isShowSkuDetail = true;
        });
    } else {
      this.skuDetail = [];
    }
  }

  public getObmById(identifier: string): void {
    this.obmService.getByIdentifier(identifier)
      .subscribe((data) => {
        this.selectedObms.push(data);
      });
  }

  public getIbmById(identifier: string): void {
    this.ibmService.getByIdentifier(identifier)
      .subscribe((data) => {
        this.selectedIbms.push(data);
      });
  }
}
