import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs/Observable';
import { Poller, POLLER_URL } from '../../models';

import { RackhdHttpService } from '../../utils/rackhd-http';

@Injectable()
export class PollersService extends RackhdHttpService {

  constructor(public http: HttpClient) {
    super(http, POLLER_URL);
  }

  public createPoller(payload: object): Observable<Poller> {
    return this.post(payload);
  }

  public getLatestData(id: string): Observable<any> {
    return this.getByIdentifier(id, 'json', POLLER_URL.data);
  }
}
