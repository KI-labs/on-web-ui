/*
 This defines the data model of time serial data.
*/
import { assign } from 'lodash-es';

export class TimeSerialData {
    constructor(d: any) {
        assign(this, d);
    }
    time: Date ;
    value: number;
}

export class MetricData {
    constructor(d: any) {
        assign(this, d);
    }
    name: string; // name of the metrics
    dataArray: TimeSerialData[];
}
