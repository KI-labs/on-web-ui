import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs/Observable';
import { CATALOG_URL } from '../../models';
import { RackhdHttpService } from '../../utils/rackhd-http';
import { NodeService } from './node.service';

@Injectable()
export class CatalogsService extends RackhdHttpService {

  constructor(
    public http: HttpClient,
    private nodeService: NodeService
  ) {
    super(http, CATALOG_URL);
  }

  public getSource(nodeId: string, source: string): Observable<any> {
    const param = CATALOG_URL.getByIdentifierUrl + source;
    return this.nodeService.getByIdentifier(nodeId, 'json', param);
  }
}
