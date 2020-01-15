import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs/Observable';
import { OBM, OBM_URL } from '../../models';

import { RackhdHttpService } from '../../utils/rackhd-http';

@Injectable()
export class ObmService extends RackhdHttpService {

  constructor(public http: HttpClient) {
    super(http, OBM_URL);
  }

  public creatObm(jsonData: object): Observable<OBM> {
    return this.put(jsonData);
  }
}
