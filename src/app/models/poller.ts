/*
 This defines the data model of Node's poller.
*/
export class Poller {
    public id: string;
    public type: string;
    public pollInterval: number;
    public node: string;
    public config: {};
    public lastStarted: string; // or Date
    public lastFinished: string;
    public paused: boolean;
    public failureCount: number;
    public latestData: string;
}

export const POLLER_URL = {
    getAllUrl: '/pollers',
    getByIdentifierUrl: '/pollers/',
    data: '/data/current'
};

export const POLLER_INTERVAL = [30000, 60000, 120000, 300000, 600000];
