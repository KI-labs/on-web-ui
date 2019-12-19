/*
 This defines the data model of Node's workflow.
*/
import { Task } from './task';

export class Workflow {
    public node: string;
    public status: string;
    public context: {};
    public definition: string;
    public domain: string;
    public id: string;
    public injectableName: string;
    public instanceId: string;
    public logContext: {};
    public name: string;
    public serviceGraph: string;
    public tasks: Task[];
}

export const WORKFLOW_URL = {
  getAllUrl: '/workflows',
  getByIdentifierUrl: '/workflows/',
};

export const HISTORY_WORKFLOW_STATUS = ['succeeded', 'failed', 'cancelled'];
