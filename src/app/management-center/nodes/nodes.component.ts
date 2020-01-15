import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';

import { NodeService } from '../../services/rackhd/node.service';
import { Node, NODE_TYPE_MAP, NodeType, OBM } from '../../models';

import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ObmService } from '../../services/rackhd/obm.service';
import { SkusService } from '../../services/rackhd/sku.service';
import { IbmService } from '../services/ibm.service';
import {
  AlphabeticalComparator,
  DateComparator,
  ObjectFilterByKey
} from '../../utils/inventory-operator';

import { validateJSON } from '../shared/validation-rules';

@Component({
  selector: 'app-nodes',
  templateUrl: './nodes.component.html',
  styleUrls: ['./nodes.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class NodesComponent implements OnInit {
  nodeStore: Node[] = [];
  allNodes: Node[] = [];

  nodeTypes: NodeType[];
  nodesTypeCountMatrix = {};

  selectedType: string;
  selectedSku: string;
  selectedNode: Node;
  selectedNodes: Node[];
  isShowDetail: boolean;

  isShowObmDetail: boolean;
  selectedObms: OBM[];

  isShowIbmDetail: boolean;
  selectedIbms: OBM[];

  isShowSkuDetail: boolean;
  skuDetail: any;

  isCreateNode: boolean;
  isDelete: boolean;
  isClean: boolean;
  nodeForm: FormGroup;

  selectableNodeTypes: string[];

  dgDataLoading = false;
  dgPlaceholder = 'No node found!';

  jsonValid = true;

  public nameComparator = new AlphabeticalComparator('name');
  public idComparator = new AlphabeticalComparator('id');
  public typeComparator = new AlphabeticalComparator('type');
  public skuComparator = new AlphabeticalComparator('sku');
  public autoDiscoverComparator = new AlphabeticalComparator('autoDiscover');
  public identifiersComparator = new AlphabeticalComparator('identifiers');
  public discoveredTimeComparator = new DateComparator('discoveredTime');
  public typeFilter = new ObjectFilterByKey('type');
  public skuFilter = new ObjectFilterByKey('sku');
  typeFilterValue: string = this.selectedType;

  shapeMap = {
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
    private fb: FormBuilder) {}

  ngOnInit() {
    this.selectableNodeTypes = _.values(NODE_TYPE_MAP);
    this.nodeService.getNodeTypes().subscribe(
      data => {
        this.nodeTypes = _.transform(
          data,
          (result, item) => {
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

  afterGetNodes() {
    this.nodesTypeCountMatrix = _.transform(this.nodeStore, (result, item) => {
      let type = item.type;
      if (!_.has(NODE_TYPE_MAP, type)) {
        type = 'other';
      }
      result[type] ? result[type] += 1 : result[type] = 1;
    }, []);
  }

  getAllNodes(): void {
    this.nodeService.getAll()
      .subscribe(data => {
        this.nodeStore = data;
        this.allNodes = data;
        this.dgDataLoading = false;
        this.afterGetNodes();
      });
  }

  create(): void {
    this.isCreateNode = true;
  }

  batchDelete(node?: Node): void {
    if (!_.isEmpty(this.selectedNodes)) {
      this.isDelete = true;
    }
  }

  batchClean(node?: Node): void {
    if (!_.isEmpty(this.selectedNodes)) {
      this.isClean = true;
    }
  }

  willDelete(node: Node): void {
    this.selectedNodes = [node];
    this.isDelete = true;
  }

  willClean(node: Node): void {
    this.selectedNodes = [node];
    this.isClean = true;
  }

  refresh() {
    this.dgDataLoading = true;
    this.getAllNodes();
  }

  createForm() {
    this.nodeForm = this.fb.group({
      name: ['', Validators.required],
      type: ['', Validators.required],
      autoDiscover: [''],
      otherConfig: ['', validateJSON],
    });
  }

  createNode(): void {
    const value = this.nodeForm.value;
    if (this.nodeForm.valid) {
      const jsonData = value.otherConfig ? JSON.parse(value.otherConfig) : {};

      // data transform
      jsonData.name = value.name;
      jsonData.type = value.type;
      jsonData.autoDiscover = value.autoDiscover === 'true' ? true : false;
      this.isCreateNode = false;

      this.nodeService.post(jsonData)
        .subscribe(data => {
          this.refresh();
        });
    }
  }

  deleteSel(): void {
    const list = _.map(this.selectedNodes, node => {
      return node.id;
    });

    this.nodeService.deleteByIdentifiers(list)
      .subscribe(results => {
        this.refresh();
      });
  }

  cleanSel(): void {
    const listObms = [];
    const listNodes = _.map(this.selectedNodes, node => {
       if (node.obms.length > 0) {
         for (const entry of node.obms) {
           const obmId = entry.ref.split('/').pop();
           listObms.push(obmId);
          }
        }
       return node.id;
    });

    this.obmService.deleteByIdentifiers(listObms).subscribe(result => {
      this.nodeService.deleteByIdentifiers(listNodes)
        .subscribe(results => {
          this.refresh();
        });
    });


  }

  onConfirm(value) {
    switch (value) {
      case 'reject':
        this.isDelete = false;
        this.isClean = false;
        break;
      case 'accept':
        if (this.isDelete) {
          this.isDelete = false;
          this.deleteSel();
        } else if (this.isClean) {
          this.isClean = false;
          this.cleanSel();
        }

    }
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
      case 'Clean':
        this.batchClean();
        break;
    }
  }

  onFilter(filtered) {
    this.nodeStore = filtered;
    this.afterGetNodes();
  }

  selectType(type: NodeType) {
    if (this.selectedType === type.displayName) {
      this.selectedType = '';
    } else {
      this.selectedType = type.displayName;
    }
    this.typeFilterValue = this.selectedType;
  }

  goToDetail(node: Node) {
    this.selectedNode = node;
    this.isShowDetail = true;
  }

  goToShowObmDetail(node: Node) {
    this.selectedNode = node;
    this.selectedObms = [];
    if (node.obms.length > 0) {
      for (const entry of node.obms) {
        const obmId = entry.ref.split('/').pop();
        this.getObmById(obmId);
      }
      this.isShowObmDetail = true;
    }

  }

  goToShowIbmDetail(node: Node) {
    this.selectedNode = node;
    this.selectedObms = [];
    if (node.ibms.length > 0) {
      for (const entry of node.ibms) {
        const ibmId = entry.ref.split('/').pop();
        this.getIbmById(ibmId);
      }
      this.isShowIbmDetail = true;
    }
  }

  goToShowSkuDetail(node: Node) {
    this.selectedNode = node;
    const skuId = node.sku ? node.sku.split('/')[4] : '';
    if (skuId) {
      this.skuService.getByIdentifier(skuId)
        .subscribe(data => {
          this.skuDetail = data;
          this.isShowSkuDetail = true;
        });
    } else {
      this.skuDetail = [];
    }
  }

  getObmById(identifier: string): void {
    this.obmService.getByIdentifier(identifier)
      .subscribe(data => {
        this.selectedObms.push(data);
      });
  }

  getIbmById(identifier: string): void {
    this.ibmService.getByIdentifier(identifier)
      .subscribe(data => {
        this.selectedIbms.push(data);
      });
  }
}
