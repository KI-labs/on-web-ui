import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { IBM_URL } from '../../models';
import 'rxjs/add/operator/delay';
import { RackhdHttpService } from '../../utils/rackhd-http';

@Injectable()
export class IbmService extends RackhdHttpService {
  constructor(public http: HttpClient) {
    super(http, IBM_URL);
  }
}
