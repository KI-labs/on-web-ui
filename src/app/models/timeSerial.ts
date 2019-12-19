/*
 This defines the data model of time serial data.
*/
import * as _ from 'lodash';

export class TimeSerialData {
    public time: Date ;
    public value: number;
    constructor(d: any) {
        _.assign(this, d);
    }
}

export class MetricData {
    public name: string; // name of the metrics
    public dataArray: TimeSerialData[];
    constructor(d: any) {
        _.assign(this, d);
    }
}
