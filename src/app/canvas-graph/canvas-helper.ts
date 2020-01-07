import * as _ from 'lodash';
import { CONSTS } from '../../config/consts';

const global = (window as any);

export class DrawUtils {

    constructor(idKey: string, waitOnKey: string, tasks: any[]) {
      this.idKey = idKey;
      this.waitOnKey = waitOnKey;
      this.tasks = tasks;
    }

    private idKey: string;
    private waitOnKey: string;
    private tasks: any [];

  /*
   * drawBackCanvas is used to override default method to delete the border of canvas
   */
  public static drawBackCanvas() {
    return function() {
      const canvas = this.bgcanvas;
      if (canvas.width !== this.canvas.width ||
        canvas.height !== this.canvas.height) {
        canvas.width = this.canvas.width;
        canvas.height = this.canvas.height;
      }
      if (!this.bgctx) {
        this.bgctx = this.bgcanvas.getContext('2d');
      }
      const ctx = this.bgctx;
      if (ctx.start) {
        ctx.start();
      }

      // clear
      if (this.clear_background) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      // reset in case of error
      ctx.restore();
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      if (this.graph) {
        // apply transformations
        ctx.save();
        ctx.scale(this.scale, this.scale);
        // render BG
        if (this.background_image && this.scale > 0.5) {
          ctx.globalAlpha = (1.0 - 0.5 / this.scale) * this.editor_alpha;
          ctx.imageSmoothingEnabled = ctx.mozImageSmoothingEnabled = ctx.imageSmoothingEnabled = false;
          if (!this._bg_img || this._bg_img.name !== this.background_image) {
            this._bg_img = new Image();
            this._bg_img.name = this.background_image;
            this._bg_img.src = this.background_image;
            const that = this;
            this._bg_img.onload = () => {
              that.draw(true, true);
            };
          }

          let pattern = null;
          if (this._pattern == null && this._bg_img.width > 0) {
            pattern = ctx.createPattern(this._bg_img, 'repeat');
            this._pattern_img = this._bg_img;
            this._pattern = pattern;
          } else {
            pattern = this._pattern;
          }
          if (pattern) {
            ctx.fillStyle = pattern;
            ctx.fillRect(
              this.visible_area[0],
              this.visible_area[1],
              this.visible_area[2] - this.visible_area[0],
              this.visible_area[3] - this.visible_area[1]
              );
            ctx.fillStyle = 'transparent';
          }

          ctx.globalAlpha = 1.0;
          ctx.imageSmoothingEnabled = ctx.mozImageSmoothingEnabled = ctx.imageSmoothingEnabled = true;
        }

        if (this.onBackgroundRender) {
          this.onBackgroundRender(canvas, ctx);
        }

        // DEBUG: show clipping area
        // ctx.fillStyle = "red";
        // ctx.fillRect(
        // this.visible_area[0] + 10,
        // this.visible_area[1] + 10,
        // this.visible_area[2] - this.visible_area[0] - 20,
        //  this.visible_area[3] - this.visible_area[1] - 20
        //  );
        // bg
        ctx.strokeStyle = 'transparent'; // change border to white
        ctx.strokeRect(0, 0, canvas.width, canvas.height);

        if (this.render_connections_shadows) {
          ctx.shadowColor = '#000';
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
          ctx.shadowBlur = 6;
        } else {
          ctx.shadowColor = 'rgba(0,0,0,0)';
        }

        // draw connections
        if (!this.live_mode) {
          this.drawConnections(ctx);
        }

        ctx.shadowColor = 'rgba(0,0,0,0)';

        // restore state
        ctx.restore();
      }

      if (ctx.finish) {
        ctx.finish();
      }

      this.dirty_bgcanvas = false;
      this.dirty_canvas = true; // to force to repaint the front canvas with the bgcanvas
    };
  }

    /*
     * Put positioned taskIds into an array in flipped "N" position sequence
     * (Top-down in each column then left-right for all columns)
     */
    public sortTaskIdsByPos(colMatrix: any, rowMatrix: any, skipLastCol: boolean): string[] {
      const locatedTaskIds: string[][] = [];
      _.forEach(colMatrix, (col, taskId) => {
        const row = rowMatrix[taskId];
        locatedTaskIds[col] = locatedTaskIds[col] || [];
        locatedTaskIds[col][row] = taskId;
      });

      if (skipLastCol) { locatedTaskIds.pop(); }

      return _.compact(_.flatten(locatedTaskIds));
    }

    /*
     * Retrieve task-task waited-by relations from workflow task list
     * WaitedBy is the reversed description for waitedOn
     */
    public getWaitedBysMatrix(tasks: any[]): any {
      const waitedBys = {};
      _.forEach(tasks, task => {
        _.forEach(task[this.waitOnKey], (states, key) => {
          let state: string;
          waitedBys[key] = waitedBys[key] || {};
          if (states as any instanceof Array) {
            state = states.length > 1 ? CONSTS.taskResult.finished : states[0];
          } else {
            state = states;
          }
          waitedBys[key][task[this.idKey]] = state;
        });
      });
      return waitedBys;
    }

    /*
     * Create canvas node object for task
     */
    public createTaskNode(task: any, position): any {
      const waitOnLength = _.keys(task[this.waitOnKey]).length;
      const taskNodeName = 'rackhd/task_' + waitOnLength;
      const taskNode = global.LiteGraph.createNode(taskNodeName);
      taskNode.title = task.label;
      taskNode.properties.task = task;
      taskNode.state = task.state;
      taskNode.pos = [position[0], position[1]];

      if (task.state) {
        const colors = CONSTS.colors;
        const state = task.state;
        const fgColor = colors[state].color;
        const bgColor = colors[state].bgColor;
        if (fgColor) { taskNode.color = fgColor; }
        if (bgColor) { taskNode.bgcolor = bgColor; }
      }

      // get error log of invalid tasks
      if (task.state === 'failed' || task.state === 'error' ||
        task.state === 'cancelled' || task.state === 'timeout') {
        taskNode.properties.log = task.error;
      }
      return taskNode;
    }

    /*
     * Connect task nodes by column
     */
    public connectNodes(allTaskIds, taskNodeMatrix, inputSlotIndexes) {
      const waitedBysMatrix = this.getWaitedBysMatrix(this.tasks);
      _.forEach(allTaskIds, (taskId) => {
        const curNode = taskNodeMatrix[taskId];
        const waitedByTasks = waitedBysMatrix[taskId];
        _.forEach(waitedByTasks, (state, waitedTaskId) => {
          const curNodeOutputSlot = CONSTS.outputSlots[state];
          const nextNodeInputSlot = inputSlotIndexes[waitedTaskId];
          const nextNode = taskNodeMatrix[waitedTaskId];
          curNode.connect(curNodeOutputSlot, nextNode, nextNodeInputSlot);
          inputSlotIndexes[waitedTaskId] += 1;
        });
      });
    }

}

export class PositionUtils {

    private tasks: any [];
    private idKey: string;
    private waitOnKey: string;

    constructor(tasks, idKey, waitOnKey) {
      this.tasks = tasks;
      this.idKey = idKey;
      this.waitOnKey = waitOnKey;
    }

    /*
     * Retrieve only taskId-waitOns from workflow task list
     */
    public getWaitOnsMatrix(): any {
      return _.transform(this.tasks, (result, value, key) => {
        result[value[this.idKey]] = value[this.waitOnKey];
      }, {});
    }

    /*
     * Generate column positions for all tasks based on waitOn level depth
     * That is:
     *  if task has no waitOn, its depth is 0;
     *  if task waitOn task has depth 0, its depth is 1;
     *  if task waits on tasks, its depth is max depth it waits on plus 1
     */
    public generateColPos(waitOnsList: any): {[propName: string]: number} {
      const colPosMatrix = {};
      _.forEach(waitOnsList, (waitOns, taskId) => {
        this.generateColPosForTask(taskId, colPosMatrix, waitOnsList);
      });
      return colPosMatrix;
    }

    /*
     * Get task column position by taskId
     */
    private generateColPosForTask(taskId: string, colPosMatrix: any, waitOnsList: any): number {
      const waitOns = waitOnsList[taskId];
      let colPos: number;
      if (_.isEmpty(waitOns)) {
        colPos = 0;
      } else {
        // Each task will be placed after all tasks it waits on.
        colPos = _.max(this.getWaitOnsColPositions(waitOns, colPosMatrix, waitOnsList)) + 1;
      }

      // Task column position is assigned once identified to save iterations/recursions
      colPosMatrix[taskId] = colPos;

      return colPos;
    }

    /*
     * Get all waitOn tasks's column positions
     */
    private getWaitOnsColPositions(waitOns: any, colPosMatrix: any, waitOnsList): number[] {
      const colIndexes = [];
      _.forEach(waitOns, (waitOn, waitOnTask) => {
        if (!_.isUndefined(colPosMatrix[waitOnTask])) {
          colIndexes.push(colPosMatrix[waitOnTask]);
        } else {
          colIndexes.push(this.generateColPosForTask(waitOnTask, colPosMatrix, waitOnsList));
        }
      });
      return colIndexes;
    }

    /*
     * Retrieve tasksId-waitedBys from workflow task list
     */
    public getWaitedBysMatrix(tasks: any[]): any {
      const waitedBys = {};
      _.forEach(tasks, task => {
        _.forEach(task[this.waitOnKey], (states, key) => {
          let state: string;
          waitedBys[key] = waitedBys[key] || {};
          if (states as any instanceof Array) {
            state = states.length > 1 ? CONSTS.taskResult.finished : states[0];
          } else {
            state = states;
          }
          waitedBys[key][task[this.idKey]] = state;
        });
      });
      return waitedBys;
    }

    /*
     * Generate row position for all tasks that have already had column positions
     * Row position is decided by two things:
     *  1. Row position of tasks it waits-on.
     *  Tasks in a column will be queued following there waitOn tasks row position
     *  before generating row position. Row position is then assigned by the queue
     *  index by default. However if row position of a task is smaller than its
     *  waits-on tasks, this task will be shift to a new index in the queue
     *  to make sure the new generated task row position (and its index in the queue)
     *  is no smaller than its waitOn tasks row positions.
     *  All tasks in the queue after current task will be shifted as well.
     *  2. Wait-on status.
     *  Task will have increasing row sequence as 'failed=>succeeded=>finished' to
     *  align status position on task nodes
     *
     */
    public generateRowPos(colPosMatrix: any, waitOnsList: any): {[propName: string]: number} {
      const rowPosMatrix = {};
      const tasksSortedByCol = this.sortTaskByCol(colPosMatrix);
      const waitedBysMatrix = this.getWaitedBysMatrix(this.tasks);

      // First column task's row position is decided by its appearing sequence
      let rowIndex = 0;
      const firstColumnTasks = tasksSortedByCol[0];
      _.forEach(firstColumnTasks, task => {
        rowPosMatrix[task] = rowIndex;
        rowIndex += 1;
      });

      let curColTasks = firstColumnTasks;
      let curColumn = 0;
      while (!_.isEmpty(curColTasks)) {
        if (curColumn === tasksSortedByCol.length - 1) { break; } // Skip last column

        let startRowPos = 0;
        const nextColTasks = tasksSortedByCol[curColumn + 1];
        // Generate row position for next column tasks via waited-by relations
        let nextSortedColTasks = [];
        _.forEach(curColTasks, curTaskId => {
          const waitedByTasks = waitedBysMatrix[curTaskId];
          if (_.isEmpty(waitedByTasks)) { return true; } // Skip task is not waited by any task
          let curRowPos = startRowPos;
          const tasksSortedByOut = this.sortTaskByWaitOnState(waitedByTasks, nextColTasks);

          _.forEach(tasksSortedByOut, taskId => {
            rowPosMatrix[taskId] = curRowPos;
            // Row number will be no small than task row number it waits on
            if (rowPosMatrix[taskId] < rowPosMatrix[curTaskId]) {
              rowPosMatrix[taskId] = rowPosMatrix[curTaskId];
            }
            curRowPos = rowPosMatrix[taskId] + 1;
          });
          startRowPos = curRowPos;
          nextSortedColTasks = nextSortedColTasks.concat(tasksSortedByOut);
        });
        curColTasks = nextSortedColTasks;
        curColumn += 1;
      }

      return rowPosMatrix;
    }

    /*
     * Sort tasks in a task's waitOn list by waitOn status
     */
    private sortTaskByWaitOnState(waitedByTasks, nextColTasks) {
      const failedWaitedBys = [];
      const succeededWaitedBys = [];
      const finishedWaitedBys = [];
      _.forEach(waitedByTasks, (state, taskId) => {
        if (!_.includes(nextColTasks, taskId)) { return true; } // Prevent jumping columns
        switch (state) {
          case CONSTS.waitOn.failed:
            failedWaitedBys.push(taskId);
            break;
          case CONSTS.waitOn.succeeded:
            succeededWaitedBys.push(taskId);
            break;
          case CONSTS.waitOn.finished:
            finishedWaitedBys.push(taskId);
            break;
        }
      });
      return _.concat(failedWaitedBys, succeededWaitedBys, finishedWaitedBys);
    }

    /*
     * Sort tasks by column index
     */
    private sortTaskByCol(colPosMatrix: any): any[] {
      const taskMatrix = [];
      _.forEach(colPosMatrix, (colIndex, taskId) => {
        if (taskMatrix[colIndex]) {
          taskMatrix[colIndex].push(taskId);
        } else {
          taskMatrix[colIndex] = [taskId];
        }
      });
      return taskMatrix;
    }
}
