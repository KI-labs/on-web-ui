import { Injectable } from '@angular/core';
import { CONSTS } from '../../config/consts';
// import once to inject this script to window.
const global = (window as any);

@Injectable()
export class NodeExtensionService {
  initialized = false;

  // inject customized login into node hooks
  init(connectCb, disconnectCb, clickCb) {
    if (this.initialized) { return; }
    // inject hook actions
    TaskNode.prototype.onConnectionsChange = function(connection, slot, connected, linkInfo) {
      if (connection === global.LiteGraph.OUTPUT) {
      }
      if (connection === global.LiteGraph.INPUT) {
        const targetNode = this.graph.getNodeById(linkInfo.target_id);
        const originNode = this.graph.getNodeById(linkInfo.origin_id);
        const originOutput = originNode.outputs[linkInfo.origin_slot];
        const originOutputName = originOutput.name;
        const task = targetNode.properties.task;
        const pretask = originNode.properties.task;

        if (!task) {
          console.log('error, please put task into node properties when init');
        }
        if (connected) {
          connectCb(task, pretask, originOutputName);
        } else {
          disconnectCb(task, pretask, originOutputName);
        }
      }
    };

    // set customized view, for example: show error log
    TaskNode.prototype.onDrawForeground = function(ctx) {
      if (this.flags.collapsed) {
        return;
      }
      if (this.state !== 'failed' && this.state !== 'error') {
        return;
      }

      // ctx.font = "40px Arial";
      // ctx.textAlign = "center";
      ctx.fillStyle = 'black';
      ctx.fillRect(1, this.size[1] / 2, this.size[0] / 2 - 3, this.size[1] / 2 - 3);
      ctx.fillStyle = '#AAF';
      ctx.fillRect(0, this.size[1] / 2 - 1, this.size[0] / 2 - 3, this.size[1] / 2 - 3);
      ctx.fillStyle = this.clicked ? 'white' : (this.mouseOver ? '#e6d7cb' : '#dfbda3');
      ctx.fillRect(1, this.size[1] / 2, this.size[0] / 2 - 4, this.size[1] / 2 - 4);

      ctx.textAlign = 'center';
      ctx.fillStyle = this.clicked ? 'black' : '#c25400';
      if (this.properties.font) {
        ctx.font = this.properties.font;
      }
      ctx.fillText('error log', this.size[0] * 0.25, this.size[1] * 0.8);
    };

    TaskNode.prototype.onMouseDown = function(e, localPos) {
      if (
        localPos[0] > 1 &&
        localPos[1] > this.size[1] / 2 &&
        localPos[0] < (this.size[0] / 2 - 2) &&
        localPos[1] < (this.size[1] - 2)
      ) {
        this.clicked = true;
        this.trigger('clicked', this.properties.message);
        clickCb(e, this);
        return true;
      }
    };

    TaskNode.prototype.onMouseUp = function(e) {
      this.clicked = false;
    };

    // Krein Peng: (TODO) better solution is to let node accept multiple input
    // However this requires to change the node model source code
    // Below code won't support graphs have more than 3 waitOns
    global.LiteGraph.registerNodeType('rackhd/task_0', TaskNode0);
    global.LiteGraph.registerNodeType('rackhd/task_1', TaskNode1);
    global.LiteGraph.registerNodeType('rackhd/task_2', TaskNode2);
    global.LiteGraph.registerNodeType('rackhd/task_3', TaskNode3);
    this.initialized = true;
  }
}



// node classes
class TaskNode {
  onDrawForeground: any;
  onConnectionsChange: any;
  onMouseDown: any;
  onMouseUp: any;
  title = 'TaskNode';
  state: string;
  addInput?: any;
  addProperty: any;
  addOutput: any;

  constructor() {
    this.addProperty('task', {});
    this.addProperty('log', {});
    this.addOutput(CONSTS.taskResult.failed, global.LiteGraph.EVENT);
    this.addOutput(CONSTS.taskResult.succeeded, global.LiteGraph.EVENT);
    this.addOutput(CONSTS.taskResult.finished, global.LiteGraph.EVENT);
  }
}

class TaskNode0 extends TaskNode {
  constructor() {
    super();
  }
}

class TaskNode1 extends TaskNode {
  constructor() {
    super();
    this.addInput('waitOn', global.LiteGraph.EVENT);
  }
}

class TaskNode2 extends TaskNode1 {
  constructor() {
    super();
    this.addInput('waitOn', global.LiteGraph.EVENT);
  }
}

class TaskNode3 extends TaskNode2 {
  constructor() {
    super();
    this.addInput('waitOn', global.LiteGraph.EVENT);
  }
}
