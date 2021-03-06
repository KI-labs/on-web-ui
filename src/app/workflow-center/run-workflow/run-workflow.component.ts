import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import JSONEditor from 'jsoneditor';

import { NodeService } from '../../services/rackhd/node.service';
import { GraphService } from '../../services/rackhd/graph.service';
import { WorkflowService } from '../../services/rackhd/workflow.service';
import { CatalogsService } from '../../services/rackhd/catalogs.service';
import { ObmService } from '../../services/rackhd/obm.service';
import { SkusService } from '../../services/rackhd/sku.service';
import { TagService } from '../../services/rackhd/tag.service';

import { Observable } from 'rxjs/Observable';
import { forkJoin } from 'rxjs/observable/forkJoin';
import { of } from 'rxjs/observable/of';
import { map, catchError } from 'rxjs/operators';

import { map as mapLodash, isEmpty,  cloneDeep, isEqual } from 'lodash-es';
import { JSONEditorOptions } from 'jsoneditor';

@Component({
  selector: 'app-run-workflow',
  templateUrl: './run-workflow.component.html',
  styleUrls: ['./run-workflow.component.scss']
})
export class RunWorkflowComponent implements OnInit, AfterViewInit {
  @ViewChild('jsoneditor', { static: true }) jsoneditor: ElementRef;
  editor: any;
  modalInformation = {
    title: '',
    note: '',
    type: 1,
    isLoading: false
  };
  showModal: boolean;

  graphId: string;
  graphStore: any[] = [];
  allGraphs: any[] = [];
  selectedGraph: any;

  allNodes: Array<any> = [];
  nodeStore: Array<any> = [];
  selNodeStore: any[] = [];
  selectedNode: any;

  totalRetries = 1;
  retries = 0;

  filterFields = ['type', 'name', 'sku', 'id', 'obms', 'tags'];
  filterLabels = ['Node Type', 'Node Name', 'SKU Name', 'Node ID', 'OBM Host', 'Tag Name'];
  filterColumns = [4, 4, 4, 4, 4, 4];


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
  ) { }



  ngOnInit() {
    this.activatedRoute.queryParams.subscribe(queryParams => {
      this.graphId = queryParams.injectableName;
    });
    this.showModal = false;
    const container = this.jsoneditor.nativeElement;
    const options: JSONEditorOptions = { mode: 'code' };
    this.editor = new JSONEditor(container, options);
    this.getAllWorkflows();
  }

  ngAfterViewInit() {
    if (this.graphId) {
      this.selWorkflowById(this.graphId);
    }
    this.getAllNodes();
  }

  resetModalInfo() {
    this.modalInformation = {
      title: '',
      note: '',
      type: 1,
      isLoading: false
    };
  }

  selWorkflowById(id) {
    this.graphService.getByIdentifier(id)
      .subscribe(data => {
        this.selectedGraph = (data instanceof Array) ? data[0] : data;
        this.graphStore = [this.selectedGraph];
        this.updateEditor(data.options);
      });
  }

  getAllWorkflows() {
    this.graphService.getAll()
    .subscribe(graphs => {
      this.allGraphs = graphs;
      this.graphStore = cloneDeep(graphs);
    });
  }

  updateEditor(options: any) {
    if (options) {
      this.editor.set(options);
    } else {
      this.editor.set({});
    }
  }

  getAllNodes() {
    this.nodeService.getAll()
      .subscribe(data => {
        this.renderNodeInfo(data);
      });
  }

  getNodeSku(node): Observable<string> {
    const hasSkuId = !!node.sku;
    const isComputeWithoutSku = (node.sku === null) && node.type === 'compute';
    if (hasSkuId) {
      return this.skuService.getByIdentifier(node.sku.split('/').pop())
        .pipe(map(data => data.name));
    } else if (isComputeWithoutSku) {
      return this.catalogsService.getSource(node.id, 'ohai')
        .pipe(map(data => data.data.dmi.base_board.product_name));
    } else {
      return of(null);
    }
  }

  getNodeObm(node): Observable<string> {
    if (!isEmpty(node.obms)) {
      const obmId = node.obms[0].ref.split('/').pop();
      return this.obmService.getByIdentifier(obmId)
        .pipe(map(data => data.config.host));
    } else {
      return of(null);
    }
  }

  getNodeTag(node): Observable<string> {
    if (!isEmpty(node.tags)) {
      return this.tagService.getTagByNodeId(node.id)
      .pipe(
        map(data => {
          if (isEmpty(data)) { return null; }
          return data.attributes.name;
        })
      );
    } else {
      return of(null);
    }
  }

  renderNodeInfo(nodes) {
    const list = mapLodash(nodes, node => {
      return forkJoin([
        this.getNodeSku(node).pipe(catchError(() => of(null))),
        this.getNodeObm(node).pipe(catchError(() => of(null))),
        this.getNodeTag(node).pipe(catchError(() => of(null)))
      ]).pipe(
        map(results => {
          node.sku = results[0];
          node.obms = results[1];
          node.tags = results[2];
        })
      );
    });

    forkJoin(list)
    .subscribe((data) => {
      this.allNodes = cloneDeep(nodes);
      this.nodeStore = cloneDeep(nodes);
      this.selNodeStore = cloneDeep(nodes);
    });
  }

  goToRunWorkflow() {
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
      type: 1,
      isLoading: false
    };
  }

  postWorkflow() {
    const payload = this.editor.get();
    const selectedNodeId = this.selectedNode && this.selectedNode.id;
    this.graphId = this.graphId || this.selectedGraph.injectableName;
    this.modalInformation.isLoading = true;
    this.workflowService.runWorkflow(selectedNodeId, this.graphId, payload)
      .subscribe(
        data => {
          this.graphId = data.instanceId;
          this.retries = 0;
          this.totalRetries = 1;
          this.modalInformation = {
            title: 'Post Workflow Successfully!',
            note: 'The workflow has post successfully! Do you want to check the status of the running workflow?',
            type: 2,
            isLoading: false
          };
        },
        err => {
          this.retries += 1;
          console.error(err);

          if (this.retries <= this.totalRetries) {
            this.postWorkflow();
          } else {
            this.showModal = false;
          }
        },

      );

  }

  goToViewer() {
    this.resetModalInfo();
    this.showModal = false;
    this.router.navigate(['workflowCenter/workflowViewer'], {
      queryParams: { graphId: this.graphId }
    });
  }

  onGraphSelect(graph) {
    this.selectedGraph = graph;
    this.updateEditor(this.selectedGraph.options);
  }

  onGraphRefresh() {
    this.selectedGraph = null;
    this.graphStore = cloneDeep(this.allGraphs);
    this.updateEditor({});
    this.router.navigateByUrl('workflowCenter/runWorkflow');
  }

  onFilterSelect(node) {
    this.selectedNode = node;
    if (this.selNodeStore.length === 1 && isEqual(this.selNodeStore[0], node)) { return; }
    setTimeout( () => this.selNodeStore = [node]);
  }

  onFilterRefresh(item: string) {
    this.selNodeStore = [];
    setTimeout(() => {
      this.nodeStore = cloneDeep(this.allNodes);
      this.selNodeStore = cloneDeep(this.allNodes);
    });
  }

  onNodeSelect(node) {
    this.selectedNode = node;
    if (this.nodeStore.length === 1 && isEqual(this.nodeStore[0], node)) { return; }
    setTimeout( () => this.nodeStore = [node]);
  }

  onReset() {
    this.selNodeStore = [];
    this.nodeStore = [];
    setTimeout(() => {
      this.nodeStore = cloneDeep(this.allNodes);
      this.selNodeStore = cloneDeep(this.allNodes);
    });
  }
}

