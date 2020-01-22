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

import { isEqual, remove, cloneDeep, assign, max, forEach, filter, toLower, values as valuesLodash } from 'lodash-es';
import { uuid } from 'uuid/v4';

import { NodeExtensionService } from './node-extension.service';
import { CONSTS } from '../../config/consts';
import { WorkflowService } from '../services/rackhd/workflow.service';
import { GraphTaskService } from '../services/rackhd/task.service';

const global = (window as any);

@Component({
  selector: 'app-canvas-graph',
  templateUrl: './canvas-graph.component.html',
  styleUrls: ['./canvas-graph.component.css']
})

export class CanvasGraphComponent implements OnInit {
  @ViewChild('mycanvas', { static: false }) editorCanvas: any;
  @Input() onWorkflowInput: any;
  @Input() editable = true;
  @Output() workflowChanged = new EventEmitter();

  workflow: any;
  canvas: any;
  graph: any;
  initSize: any;
  taskInjectableNames: any;

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

  ngOnInit() {
    if (this.editable) {
      this.graphTaskService.getAll()
      .subscribe(allTasks => {
        this.taskInjectableNames = allTasks.map(item => {
          return item.injectableName;
        });
      });
    }

    this.onWorkflowInput.subscribe(
      workflow => {
        if (!isEqual(this.workflow, workflow)) {
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

  setupCanvas() {
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
  afterWorkflowUpdate(reRender = false) {
    this.workflowChanged.emit(cloneDeep(this.workflow));
    if (reRender) {
      this.drawNodes();
    }
  }

  // workflow operations
  addTaskForWorkflow(task: any) {
    this.workflow.tasks.push(task);
    this.afterWorkflowUpdate();
  }

  delTaskForWorkflow(task: any) {
    remove(this.workflow.tasks, (t) => isEqual(task, t));
    this.afterWorkflowUpdate();
  }

  /* connect/disconnect callbacks */
  afterInputConnect(taskToBeChanged, preTask, preTaskResult) {
    if (preTaskResult === CONSTS.taskResult.failed) {
      this.changeTaskWaitOn(taskToBeChanged, preTask, CONSTS.waitOn.failed);
    } else if (preTaskResult === CONSTS.taskResult.succeeded) {
      this.changeTaskWaitOn(taskToBeChanged, preTask, CONSTS.waitOn.succeeded);
    } else if (preTaskResult === CONSTS.taskResult.finished) {
      this.changeTaskWaitOn(taskToBeChanged, preTask, CONSTS.waitOn.finished);
    }
  }

  afterInputDisconnect(taskToBeChanged, preTask, preTaskResult) {
    this.changeTaskWaitOn(taskToBeChanged, preTask, preTaskResult);
  }

  afterClick(e, node) {
    if (!node || !node.properties) {
      return;
    }

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

    return false;
  }

  // helpers
  changeTaskWaitOn(taskToBeChanged, preTask?, waitOnText?) {
    if (!preTask && !waitOnText) {
      forEach(this.workflow && this.workflow.tasks, (task) => {
        if (isEqual(task, taskToBeChanged)) {
          delete task.waitOn[preTask];
        }
      });
    } else {
      // this.workflow may be undefined.
      forEach(this.workflow && this.workflow.tasks, (task) => {
        if (isEqual(task, taskToBeChanged)) {
          task.waitOn = assign(task.waitOn || {}, {[preTask.label]: waitOnText});
        }
      });
    }
    this.afterWorkflowUpdate();
  }

  /* rewrite lib class prototype functions */
  getCanvasMenuOptions() {
    const self = this;
    return () => {
      if (!self.editable) { return []; }
      const options = [
        {content: 'Add Task', has_submenu: true, callback: self.addNode()}
      ];
      return options;
    };
  }

  addNode() {
    // mothod 1 for keep current context
    const self = this;

    // this function is referenced from lightgraph src.
    return (node, options, e, preMenu) => {
      const canvas = global.LGraphCanvas.active_canvas;
      const refWindow = canvas.getCanvasWindow();
      const filterInputHtml = '<input id=\'graphNodeTypeFilter\' placeholder=\'filter\'>';

      const taskNames = self.taskInjectableNames.slice(0, 9);
      const values = [];
      values.push({content: filterInputHtml});
      forEach(taskNames, name => {
        values.push({content: name});
      });

      let taskMenu = new global.LiteGraph.ContextMenu(values, {
        event: e,
        callback: innerCreate,
        parentMenu: preMenu,
        allow_html: true
      }, refWindow);

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
        const newValues = [];
        newValues.push({content: filterInputHtml});
        const filteredTaskNames = filter(self.taskInjectableNames, (type) => {
          return toLower(type).includes(toLower(term));
        });
        for (const injectableName of filteredTaskNames.slice(0, 9)) {
          newValues.push({content: injectableName});
        }
        taskMenu = new global.LiteGraph.ContextMenu(newValues, {
          event: e,
          callback: innerCreate,
          parentMenu: preMenu,
          allow_html: true
        }, refWindow);
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
      function innerCreate(v, event) {
        // keep menu after click input bar
        if (v.content === filterInputHtml) {
          return true;
        }

        const firstEvent = preMenu.getFirstEvent();
        const createdNode = global.LiteGraph.createNode('rackhd/task_1');
        if (createdNode) {
          // update node position
          createdNode.pos = canvas.convertEventToCanvasOffset(firstEvent);
          // update node data
          const injectName = v.content;
          self.graphTaskService.getByIdentifier(injectName)
          .subscribe(task => {
            const data = {};
            const label = 'new-task-' + uuid().substr(0, 10);
            assign(data, {label});
            assign(data, {taskDefinition: task});
            createdNode.properties.task = data;
            createdNode.title = createdNode.properties.task.label;
            canvas.graph.add(createdNode);
            self.addTaskForWorkflow(createdNode.properties.task);
          });
        }
      }

      return false;
    };
  }

  getNodeMenuOptions() {
    const self = this;
    return (node) => {
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

  removeNode(value, options, e, menu, node) {
    this.delTaskForWorkflow(node.properties.task);
    global.LGraphCanvas.onMenuNodeRemove(value, options, e, menu, node);
  }

  addInput(value, options, e, menu, node) {
    node.addInput('waitOn', global.LiteGraph.EVENT);
    // this.afterWorkflowUpdate();
  }

  drawNodes() {
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
    forEach(this.workflow.tasks, (task) => {
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
  distributePosition(taskWaitOnKey: string, taskIdKeyName: string) {
    const xOffset = 30;
    const yOffset = 60;
    const xGridSizeMin = 200; // Avoid overlap between adjacent task blocks
    const yGridSizeMin = 100;
    const positionMatrix = {};
    const utils = new PositionUtils(this.workflow.tasks, taskIdKeyName, taskWaitOnKey);

    const canvasWidth = parseInt(this.editorCanvas.nativeElement.offsetWidth, 10);
    const canvasHeight = parseInt(this.editorCanvas.nativeElement.offsetHeight, 10);

    const waitOnsMatrix = utils.getWaitOnsMatrix();
    const colPosMatrix = utils.generateColPos(waitOnsMatrix);
    const rowPosMatrix = utils.generateRowPos(colPosMatrix, waitOnsMatrix);

    const colCount = max(valuesLodash(colPosMatrix)) + 1;
    const rowCount = max(valuesLodash(rowPosMatrix)) + 1;
    const xGridSize = max([canvasWidth / colCount, xGridSizeMin]);
    const yGridSize = max([canvasHeight / rowCount, yGridSizeMin]);

    forEach(this.workflow.tasks, task => {
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

