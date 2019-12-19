import * as _ from 'lodash';
/*
 This defines the data model of Node.
*/
export class Node {
    public autoDiscover: boolean;
    public catalogs: string;
    public id: string;
    public identifiers: string[];
    public name: string;
    public obms: string[];
    public tags: string;
    public pollers: string;
    public relations: string[];
    public sku?: string;
    public type: string;
    public workflows: string;
    public ibms: string[];

    public discoveredTime: string;
    public manufacturer?: string;
    public model: string;
    constructor(data: any) {
        _.assign(this, data);
    }
}

export class NodeType {
    public identifier: string;
    public displayName: string;
}

export class NodeStatus {
    public identifier: string;
    public displayName: string;
}

export const NODE_TYPES = [
    'compute',
    'enclosure',
    'switch',
    'pdu',
    'mgmt',
    'others',
];

export const NODE_URL = {
    getAllUrl: '/nodes',
    getByIdentifierUrl: '/nodes/',
};

export const NODE_TYPE_MAP = {
  compute: 'Compute',
  enclosure: 'Enclosure',
  switch: 'Switch',
  pdu: 'PDU',
  mgmt: 'MGMT',
  others: 'Others',
};
