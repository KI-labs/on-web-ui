import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs/Observable';
import { SKU, SKU_URL} from '../../models/sku';

import { RackhdHttpService } from '../../utils/rackhd-http';

@Injectable()
export class SkusService extends RackhdHttpService {

  constructor(public http: HttpClient) {
    super(http, SKU_URL);
  }

  public createSku(jsonData: any): Observable<SKU> {
    return this.post(jsonData);
  }

  public uploadByPost(file, identifier?: string): Observable<any> {
    return this.upload(file, identifier, 'post');
  }

  public updateSku(jsonData: any): Observable<SKU> {
    return this.put(jsonData);
  }
}
