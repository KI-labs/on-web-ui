import { Injectable } from '@angular/core';
import { GRAPHTASK_URL } from '../../models';
import { RackhdHttpService } from '../../utils/rackhd-http';

import {
  HttpClient,
} from '@angular/common/http';

@Injectable()
export class GraphTaskService extends RackhdHttpService {
  constructor(
    public http: HttpClient
  ) {
    super(http, GRAPHTASK_URL);
  }
}
