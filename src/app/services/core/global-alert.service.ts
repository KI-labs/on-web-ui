import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';

@Injectable()
export class GlobalAlertService {
  public alertQueue: Subject<any>;
  constructor() {
    this.alertQueue = new Subject<any>();
  }

  public putAlertMsg(msg: string, type: string = 'modal'): void {
    this.alertQueue.next({msg, type});
  }

  public getAlertQueue(): Subject<any> {
    return this.alertQueue;
  }

}
