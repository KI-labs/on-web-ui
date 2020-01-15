import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { GRAPH_URL } from '../../models';
import { RackhdHttpService } from '../../utils/rackhd-http';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class GraphService extends RackhdHttpService {

  constructor(public http: HttpClient) {
    super(http, GRAPH_URL);
  }

  public createGraph(payload: any): Observable<any[]> {
    return this.put(payload, 'text');
  }

  public getInitGraph(): any {
    return {
      friendlyName: '',
      injectableName: '',
      tasks: []
    };
  }

}
