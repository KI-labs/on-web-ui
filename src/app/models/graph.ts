/*
 This defines the data model of Workflow Metadata.
*/
export class Graph {
    public friendlyName: string;
    public injectableName: string;
    public tasks: any;
    public options: any;
}

export const GRAPH_URL = {
    getAllUrl: '/workflows/graphs',
    getByIdentifierUrl: '/workflows/graphs/',
};
