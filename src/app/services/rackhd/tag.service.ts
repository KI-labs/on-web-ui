import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs/Observable';
import { TAG_URL } from '../../models';

import { RackhdHttpService } from '../../utils/rackhd-http';
import { NodeService } from './node.service';

@Injectable()
export class TagService extends RackhdHttpService {

  constructor(
    public http: HttpClient,
    public nodeService: NodeService
  ) {
    super(http, TAG_URL);
  }

  public getTagByNodeId(nodeId: string): Observable<any> {
    const param = TAG_URL.getAllUrl;
    return this.nodeService.getByIdentifier(nodeId, 'json', param);
  }

}
