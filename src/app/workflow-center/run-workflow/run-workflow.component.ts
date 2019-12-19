import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs/Rx';
import { JSONEditor } from 'app/utils/json-editor';

import { NodeService } from 'app/services/rackhd/node.service';
import { GraphService } from 'app/services/rackhd/graph.service';
import { WorkflowService } from 'app/services/rackhd/workflow.service';
import { CatalogsService } from 'app/services/rackhd/catalogs.service';
import { ObmService } from 'app/services/rackhd/obm.service';
import { SkusService } from 'app/services/rackhd/sku.service';
import { TagService } from 'app/services/rackhd/tag.service';

import { Observable } from 'rxjs/Observable';
import { forkJoin } from 'rxjs/observable/forkJoin';
import { of } from 'rxjs/observable/of';
import { map, catchError } from 'rxjs/operators';

import * as _ from 'lodash';

@Component({
  selector: 'app-run-workflow',
  templateUrl: './run-workflow.component.html',
  styleUrls: ['./run-workflow.component.scss']
})
export class RunWorkflowComponent implements OnInit, AfterViewInit {
  @ViewChild('jsoneditor') public jsoneditor: ElementRef;
  public editor: any;
  public modalInformation = {
    title: '',
    note: '',
    type: 1
  };
  public showModal: boolean;

  public graphId: string;
  public graphStore: any[] = [];
  public allGraphs: any[] = [];
  public selectedGraph: any;

  public allNodes: any[] = [];
  public nodeStore: any[] = [];
  public selNodeStore: any [] = [];
  public selectedNode: any;

  public filterFields = ['type', 'name', 'sku', 'id', 'obms', 'tags'];
  public filterLabels = ['Node Type', 'Node Name', 'SKU Name', 'Node ID', 'OBM Host', 'Tag Name'];
  public filterColumns = [4, 4, 4, 4, 4, 4];

  constructor(
    public nodeService: NodeService,
    public graphService: GraphService,
    private activatedRoute: ActivatedRoute,
    private workflowService: WorkflowService,
    private catalogsService: CatalogsService,
    private obmService: ObmService,
    public skuService: SkusService,
    public tagService: TagService,
    private router: Router
  ) {}

  public ngOnInit() {
    this.activatedRoute.queryParams.subscribe((queryParams) => {
      this.graphId = queryParams.injectableName;
    });
    this.showModal = false;
    const container = this.jsoneditor.nativeElement;
    const options = {mode: 'code'};
    this.editor = new JSONEditor(container, options);
    this.getAllWorkflows();
  }

  public ngAfterViewInit() {
    if (this.graphId) {
      this.selWorkflowById(this.graphId);
    }
    this.getAllNodes();
  }

  public resetModalInfo() {
    this.modalInformation = {
      title: '',
      note: '',
      type: 1
    };
  }

  public selWorkflowById(id) {
    this.graphService.getByIdentifier(id)
    .subscribe((data) => {
      this.selectedGraph = (data instanceof Array) ? data[0] : data;
      this.graphStore = [this.selectedGraph];
      this.updateEditor(data.options);
    });
  }

  public getAllWorkflows() {
    this.graphService.getAll()
    .subscribe((graphs) => {
      this.allGraphs = graphs;
      this.graphStore = _.cloneDeep(graphs);
    });
  }

  public updateEditor(options: any) {
    if (options) {
      this.editor.set(options);
    } else {
      this.editor.set({});
    }
  }

  public getAllNodes() {
    this.nodeService.getAll()
    .subscribe((data) => {
      this.renderNodeInfo(data);
    });
  }

  public getNodeSku(node): Observable<string> {
    const hasSkuId = !!node.sku;
    const isComputeWithoutSku = (node.sku === null) && node.type === 'compute';
    if (hasSkuId) {
      return this.skuService.getByIdentifier(node.sku.split('/').pop())
      .pipe(map((data) => data.name));
    } else if (isComputeWithoutSku) {
      return this.catalogsService.getSource(node.id, 'ohai')
      .pipe(map((data) => data.data.dmi.base_board.product_name));
    } else {
      return of(null);
    }
  }

  public getNodeObm(node): Observable<string> {
    if (!_.isEmpty(node.obms)) {
      const obmId = node.obms[0].ref.split('/').pop();
      return this.obmService.getByIdentifier(obmId)
      .pipe(map((data) => data.config.host));
    } else {
      return of(null);
    }
  }

  public getNodeTag(node): Observable<string> {
    if (!_.isEmpty(node.tags)) {
      return this.tagService.getTagByNodeId(node.id)
      .pipe(
        map((data) => {
          if (_.isEmpty(data)) { return null; }
          return data.attributes.name;
        })
      );
    } else {
      return of(null);
    }
  }

  public renderNodeInfo(nodes) {
    const list = _.map(nodes, (node) => {
      return forkJoin(
        this.getNodeSku(node).pipe(catchError( () => of(null))),
        this.getNodeObm(node).pipe(catchError( () => of(null))),
        this.getNodeTag(node).pipe(catchError( () => of(null)))
      ).pipe(
          map((results) => {
            node['sku'] = results[0];
            node['obms'] = results[1];
            node['tags'] = results[2];
          })
      );
    });

    forkJoin(list)
    .subscribe((data) => {
      this.allNodes = _.cloneDeep(nodes);
      this.nodeStore = _.cloneDeep(nodes);
      this.selNodeStore = _.cloneDeep(nodes);
    });
  }

  public goToRunWorkflow() {
    this.showModal = true;
    const selectedNodeId = this.selectedNode && this.selectedNode.id;
    this.graphId = this.graphId || this.selectedGraph.injectableName;
    let subNote;
    if (selectedNodeId) {
      subNote = `with ${selectedNodeId}`;
    } else {
      subNote = `without node`;
    }
    this.modalInformation = {
      title: 'Reminder',
      note: `Are you sure to run workflow ${this.graphId} ${subNote}`,
      type: 1
    };
  }

  public postWorkflow() {
    const payload = this.editor.get();
    const selectedNodeId = this.selectedNode && this.selectedNode.id;
    this.graphId = this.graphId || this.selectedGraph.injectableName;
    this.workflowService.runWorkflow(selectedNodeId, this.graphId, payload)
    .subscribe(
      (data) => {
        this.graphId = data.instanceId;
        this.modalInformation = {
          title: 'Post Workflow Successfully!',
          note: 'The workflow has post successfully! Do you want to check the status of the running workflow?',
          type: 2
        };
      },
      (err) => { this.showModal = false; }
    );
   }

  public goToViewer() {
    this.resetModalInfo();
    this.showModal = false;
    this.router.navigate(['workflowCenter/workflowViewer'], {
      queryParams: {graphId: this.graphId}
    });
  }

  public onGraphSelect(graph) {
    this.selectedGraph = graph;
    this.updateEditor(this.selectedGraph.options);
  }

  public onGraphRefresh() {
    this.selectedGraph = null;
    this.graphStore = _.cloneDeep(this.allGraphs);
    this.updateEditor({});
    this.router.navigateByUrl('workflowCenter/runWorkflow');
  }

  public onFilterSelect(node) {
    this.selectedNode = node;
    if (this.selNodeStore.length === 1 && _.isEqual(this.selNodeStore[0], node)) { return; }
    setTimeout( () => this.selNodeStore = [node]);
  }

  public onFilterRefresh(item: string) {
    this.selNodeStore = [];
    setTimeout(() => {
      this.nodeStore = _.cloneDeep(this.allNodes);
      this.selNodeStore = _.cloneDeep(this.allNodes);
    });
  }

  public onNodeSelect(node) {
    this.selectedNode = node;
    if (this.nodeStore.length === 1 && _.isEqual(this.nodeStore[0], node)) { return; }
    setTimeout( () => this.nodeStore = [node]);
  }

  public onReset() {
    this.selNodeStore = [];
    this.nodeStore = [];
    setTimeout(() => {
      this.nodeStore = _.cloneDeep(this.allNodes);
      this.selNodeStore = _.cloneDeep(this.allNodes);
    });
  }
}
