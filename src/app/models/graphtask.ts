/*
 This defines the data model of  Graph Tasks
*/
export class GraphTask {
    public friendlyName: string;
    public injectableName: string;
    public options: any;
    public implementsTask: string;
    public optionsSchema?: string;
    public properties?: any;
}

export const GRAPHTASK_URL = {
    getAllUrl: '/workflows/tasks',
    getByIdentifierUrl: '/workflows/tasks/',
};
