import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { DrawUtils, PositionUtils } from './canvas-helper';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

import * as _ from 'lodash';
import * as uuid from 'uuid/v4';

import { NodeExtensionService } from './node-extension.service';
import { CONSTS } from '../../config/consts';
import { Task } from '../models';
import { WorkflowService } from 'app/services/rackhd/workflow.service';
import { GraphTaskService } from 'app/services/rackhd/task.service';

const global = (window as any);

@Component({
  selector: 'app-canvas-graph',
  templateUrl: './canvas-graph.component.html',
  styleUrls: ['./canvas-graph.component.css']
})

export class CanvasGraphComponent implements OnInit {
  @ViewChild('mycanvas') public editorCanvas: any;
  @Input() public onWorkflowInput: any;
  @Input() public editable = true;
  @Output() public onWorkflowChanged = new EventEmitter();

  public workflow: any;
  public canvas: any;
  public graph: any;
  public initSize: any;
  public taskInjectableNames: any;

  constructor(
    public element: ElementRef,
    public nodeExtensionService: NodeExtensionService,
    public graphTaskService: GraphTaskService,
    public workflowService: WorkflowService
  ) {
    this.nodeExtensionService.init(
      this.afterInputConnect.bind(this),
      this.afterInputDisconnect.bind(this),
      this.afterClick.bind(this)
    );
  }

  public ngOnInit() {
    if (this.editable) {
      this.graphTaskService.getAll()
      .subscribe((allTasks) => {
        this.taskInjectableNames = allTasks.map(function(item) {
          return item.injectableName;
        });
      });
    }

    this.onWorkflowInput.subscribe(
      (workflow) => {
        if (!_.isEqual(this.workflow, workflow)) {
          this.workflow = workflow;
          this.afterWorkflowUpdate(true);
        }
      }
    );
    this.graph = new global.LGraph();
    this.canvas = new global.LGraphCanvas(
      this.element.nativeElement.querySelector('canvas'),
      this.graph
    );
    this.setupCanvas();
    this.canvas.clear();
    this.canvas.getNodeMenuOptions = this.getNodeMenuOptions();

    // Overwrite default drawBackCanvas method to delete border of back canvas
    this.canvas.drawBackCanvas = DrawUtils.drawBackCanvas();

    this.canvas.getCanvasMenuOptions = this.getCanvasMenuOptions();
    this.graph.start();
    this.drawNodes();
  }

  public setupCanvas() {
    // this.canvas.default_link_color =  "#FFF"; //Connection color
    // this.canvas.highquality_render = true; //Render color, curve and arrow
    // this.canvas.render_curved_connections = false; //Use straight line
    // this.canvas.render_connection_arrows = false; //No arrows for line
    this.canvas.always_render_background = false;
    this.canvas.background_image = ''; // Don't use background
    this.canvas.title_text_font = 'bold 12px Arial';
    this.canvas.inner_text_font = 'normal 10px Arial';
    this.canvas.render_shadows = false; // Node shadow
    this.canvas.render_connections_border = false;
    this.canvas.show_info = false; // Hide info on left-top corner

    this.initSize = {
      height: this.element.nativeElement.parentNode.offsetHeight,
      width: this.element.nativeElement.parentNode.offsetWidth
    };
  }

  // refresh graph
  public afterWorkflowUpdate(reRender = false) {
    this.onWorkflowChanged.emit(_.cloneDeep(this.workflow));
    if (reRender) {
      this.drawNodes();
    }
  }

  // workflow operations
  public addTaskForWorkflow(task: any) {
    this.workflow.tasks.push(task);
    this.afterWorkflowUpdate();
  }

  public delTaskForWorkflow(task: any) {
    _.remove(this.workflow.tasks, (t) => _.isEqual(task, t));
    this.afterWorkflowUpdate();
  }

  /* connect/disconnect callbacks */
  public afterInputConnect(taskToBeChanged, preTask, preTaskResult) {
    if (preTaskResult === CONSTS.taskResult.failed) {
      this.changeTaskWaitOn(taskToBeChanged, preTask, CONSTS.waitOn.failed);
    } else if (preTaskResult === CONSTS.taskResult.succeeded) {
      this.changeTaskWaitOn(taskToBeChanged, preTask, CONSTS.waitOn.succeeded);
    } else if (preTaskResult === CONSTS.taskResult.finished) {
      this.changeTaskWaitOn(taskToBeChanged, preTask, CONSTS.waitOn.finished);
    }
  }

  public afterInputDisconnect(taskToBeChanged, preTask, preTaskResult) {
    this.changeTaskWaitOn(taskToBeChanged, preTask, preTaskResult);
  }

  public afterClick(e, node) {
    if (!node || !node.properties) {
      return;
    }

    const self = this;
    const canvas = global.LGraphCanvas.active_canvas;
    const ref_window = canvas.getCanvasWindow();

    const entries = [];
    const value = node.properties.log;
    // if value could contain invalid html characters, clean that
    // value = global.LGraphCanvas.decodeHTML(value);
    // for better view, please
    //   ****value.replace(/\n/g, "<br>"); !important****

    entries.push({
      content: '<span id="errorLogText">' + value + '</span><h4>click to clipboard</h4>',
      value
    });
    if (!entries.length) {
      return;
    }

    const menu = new global.LiteGraph.ContextMenu(entries, {
      event: e,
      callback: copyToClipboard,
      parentMenu: null,
      allow_html: true,
      node
    }, ref_window);

    function copyToClipboard() {
      const inp = document.createElement('input');
      document.body.appendChild(inp);
      // for better view, if you replace \n with <br>, please recover them here
      inp.value = document.getElementById('errorLogText').textContent;
      inp.select();
      document.execCommand('copy', false);
      inp.remove();
    }

    return false;
  }

  // helpers
  public changeTaskWaitOn(taskToBeChanged, preTask?, waitOnText?) {
    if (!preTask && !waitOnText) {
      _.forEach(this.workflow && this.workflow.tasks, (task) => {
        if (_.isEqual(task, taskToBeChanged)) {
          delete task['waitOn'][preTask];
        }
      });
    } else {
      // this.workflow may be undefined.
      _.forEach(this.workflow && this.workflow.tasks, (task) => {
        if (_.isEqual(task, taskToBeChanged)) {
          task['waitOn'] = _.assign(task['waitOn'] || {}, {[preTask.label]: waitOnText});
        }
      });
    }
    this.afterWorkflowUpdate();
  }

  /* rewrite lib class prototype functions */
  public getCanvasMenuOptions() {
    const self = this;
    return function() {
      if (!self.editable) { return []; }
      const options = [
        {content: 'Add Task', has_submenu: true, callback: self.addNode()}
      ];
      return options;
    };
  }

  public addNode() {
    // mothod 1 for keep current context
    const self = this;

    // this function is referenced from lightgraph src.
    return function(node, options, e, preMenu) {
      const preE = e;
      const canvas = global.LGraphCanvas.active_canvas;
      const ref_window = canvas.getCanvasWindow();
      const filterInputHtml = '<input id=\'graphNodeTypeFilter\' placeholder=\'filter\'>';

      const taskNames = self.taskInjectableNames.slice(0, 9);
      const values = [];
      values.push({content: filterInputHtml});
      _.forEach(taskNames, (name) => {
        values.push({content: name});
      });

      let taskMenu = new global.LiteGraph.ContextMenu(values, {
        event: e,
        callback: innerCreate,
        parentMenu: preMenu,
        allow_html: true
      }, ref_window);

      const taskFilter = new Subject();

      function inputTerm(term: string) {
        taskFilter.next(term);
      }

      bindInput();
      const filterTrigger = taskFilter.pipe(
        debounceTime(1000),
        distinctUntilChanged(),
        switchMap((term: string) => {
          reGenerateMenu(term);
          return 'whatever';
        })
      );
      filterTrigger.subscribe();

      // helpers
      function reGenerateMenu(term: string) {
        // close old task list menu and add a new one;
        taskMenu.close(undefined, true);
        const values = [];
        values.push({content: filterInputHtml});
        const filteredTaskNames = _.filter(self.taskInjectableNames, (type) => {
          return _.toLower(type).includes(_.toLower(term));
        });
        for (const injectableName of filteredTaskNames.slice(0, 9)) {
          values.push({content: injectableName});
        }
        taskMenu = new global.LiteGraph.ContextMenu(values, {
          event: e,
          callback: innerCreate,
          parentMenu: preMenu,
          allow_html: true
        }, ref_window);
        // remember to bind new input again, because the old one is destroyed when menu close.
        // remember to add fill the new input with current term, make it more proper.
        bindInput(term);
      }

      function bindInput(initValue = '') {
        const input = document.getElementById('graphNodeTypeFilter');
        if (initValue) {
          (input as HTMLInputElement).value = initValue;
        }
        input.addEventListener('input', () => inputTerm((input as HTMLInputElement).value));
      }

      // click actions of task list menu
      function innerCreate(v, e) {
        // keep menu after click input bar
        if (v.content === filterInputHtml) {
          return true;
        }

        const firstEvent = preMenu.getFirstEvent();
        const node = global.LiteGraph.createNode('rackhd/task_1');
        if (node) {
          // update node position
          node.pos = canvas.convertEventToCanvas(firstEvent);
          // update node data
          const injectName = v.content;
          self.graphTaskService.getByIdentifier(injectName)
          .subscribe((task) => {
            const data = {};
            const label = 'new-task-' + uuid().substr(0, 10);
            _.assign(data, {label});
            _.assign(data, {taskDefinition: task});
            node.properties.task = data;
            node.title = node.properties.task.label;
            canvas.graph.add(node);
            self.addTaskForWorkflow(node.properties.task);
          });
        }
      }

      return false;
    };
  }

  public getNodeMenuOptions() {
    const self = this;
    return function(node) {
      const options = [];
      if (!self.editable) { return options; }
      if (node.removable !== false) {
        options.push(
          null,
          {content: 'Remove', callback: self.removeNode.bind(self)},
          {content: 'AddInput', callback: self.addInput.bind(self)}
        );
      }
      if (node.graph && node.graph.onGetNodeMenuOptions) {
        node.graph.onGetNodeMenuOptions(options, node);
      }
      return options;
    };
  }

  public removeNode(value, options, e, menu, node) {
    this.delTaskForWorkflow(node.properties.task);
    global.LGraphCanvas.onMenuNodeRemove(value, options, e, menu, node);
  }

  public addInput(value, options, e, menu, node) {
    node.addInput('waitOn', global.LiteGraph.EVENT);
    // this.afterWorkflowUpdate();
  }

  public drawNodes() {
    if (!this.workflow) { return; }

    this.graph.clear();

    // For graph object
    let taskWaitOnKey = 'waitingOn';
    let taskIdentifierKey = 'instanceId';

    // For graph definition
    if (!this.workflow.instanceId) {
      taskWaitOnKey = 'waitOn';
      taskIdentifierKey = 'label';
    }

    let positionMatrix: any;
    let colMatrix: {[propName: string]: number};
    let rowMatrix: {[propName: string]: number};
    [positionMatrix, colMatrix, rowMatrix] = this.distributePosition(taskWaitOnKey, taskIdentifierKey);

    const taskNodeMatrix = {};
    const nodeInputSlotIndexes = {};
    const drawUtils = new DrawUtils(taskIdentifierKey, taskWaitOnKey, this.workflow.tasks);
    _.forEach(this.workflow.tasks, (task) => {
      if ( task.taskStartTime && task.state === 'pending') {
        task.state = 'running';
      }
      const position = positionMatrix[task[taskIdentifierKey]];
      const node = drawUtils.createTaskNode(task, position);
      this.graph.add(node);
      taskNodeMatrix[task[taskIdentifierKey]] = node;
      nodeInputSlotIndexes[task[taskIdentifierKey]] = 0;
    });

    // Remove taskIds in last column
    // Last column connection is covered by its previous columns
    const sortedTaskIds = drawUtils.sortTaskIdsByPos(colMatrix, rowMatrix, true);
    drawUtils.connectNodes(sortedTaskIds, taskNodeMatrix, nodeInputSlotIndexes);
  }

  /*
   * @param {String}: taskWaitOnKey: key used for link, should be "waitingOn" or "waitOn"
   * @param {String}: taskIdKeyName: key used to identify tasks, should be "instacneId" or "label"
   *
   */
  public distributePosition(taskWaitOnKey: string, taskIdKeyName: string) {
    const xOffset = 30;
    const yOffset = 60;
    const xGridSizeMin = 200; // Avoid overlap between adjacent task blocks
    const yGridSizeMin = 100;
    const positionMatrix = {};
    const utils = new PositionUtils(this.workflow.tasks, taskIdKeyName, taskWaitOnKey);

    const canvasWidth = parseInt(this.editorCanvas.nativeElement.offsetWidth);
    const canvasHeight = parseInt(this.editorCanvas.nativeElement.offsetHeight);

    const waitOnsMatrix = utils.getWaitOnsMatrix();
    const colPosMatrix = utils.generateColPos(waitOnsMatrix);
    const rowPosMatrix = utils.generateRowPos(colPosMatrix, waitOnsMatrix);

    const colCount = _.max(_.values(colPosMatrix)) + 1;
    const rowCount = _.max(_.values(rowPosMatrix)) + 1;
    const xGridSize = _.max([canvasWidth / colCount, xGridSizeMin]);
    const yGridSize = _.max([canvasHeight / rowCount, yGridSizeMin]);

    _.forEach(this.workflow.tasks, (task) => {
      const taskId = task[taskIdKeyName];
      let x = colPosMatrix[taskId];
      let y = rowPosMatrix[taskId];
      x = xGridSize * x + xOffset;
      y = yGridSize * y + yOffset;
      positionMatrix[taskId] = [Math.floor(x), Math.floor(y)];
    });
    return [positionMatrix, colPosMatrix, rowPosMatrix];
  }
}
