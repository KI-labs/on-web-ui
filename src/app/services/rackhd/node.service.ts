import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/delay';
import 'rxjs/add/observable/of';

import { NODE_TYPES, NODE_URL } from '../../models';
import { RackhdHttpService } from '../../utils/rackhd-http';


@Injectable()
export class NodeService extends RackhdHttpService {

  constructor(public http: HttpClient) {
    super(http, NODE_URL);
  }

  public getNodeTypes(): Observable<string[]> {
    return Observable.of(NODE_TYPES).delay(5);
  }
}
