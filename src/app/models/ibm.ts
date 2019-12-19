/*
 This defines the data model of Node's OBM.
*/
export class IBM {
    public id: string;
    public node: string;
    public service: string;
    public config: {};
}

export const IBM_URL = {
    ibms: '/ibms',
    ibmsById: '/ibms/',
};
