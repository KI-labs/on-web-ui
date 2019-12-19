/*
 This defines the data model of Node's task.
*/
export class Task {
    public lable: string;
    public instanceId: string;
    public options?: {};
    public runJob: string;
    public state: string;
    public taskStartTime: string;
    public terminalOnStates: string[];
    public waitingOn: {};
}
