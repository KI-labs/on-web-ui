import {
  HttpClient,
} from '@angular/common/http';

import { Observable } from 'rxjs/Observable';
import { forkJoin } from 'rxjs/observable/forkJoin';
import { _throw } from 'rxjs/observable/throw';
import { timeout } from 'rxjs/operators/timeout';
import { RackhdLocalStorage as RackHD } from './globals-util';
import * as _ from 'lodash';

export class RackhdHttpService {



  constructor(public http: HttpClient, public urlConfig: any) {
  }

  static createOptions(responseType?: string, query?: any, header?: any) {
    const token: string = RackHD.getToken();
    const options: any = {};
    if (token) {
      header = header || {};
      header.authorization = 'JWT ' + token;
    }
    if (!_.isEmpty(query)) {
      options.params = query;
    }
    if (responseType) {
      options.responseType = responseType as 'json';
    }
    if (header) {
      options.headers = header;
    }
    return options;
  }

  public apiPing(): Observable<any>  {
    const url = RackHD.getBaseUrl() + '/nodes';
    const options = RackhdHttpService.createOptions();
    return this.http.get<any>(url, options)
    .pipe(
      timeout(500)
    );
  }

  public getAll(query?: any, responseType?: string): Observable<any>  {
    const url = RackHD.getBaseUrl() + this.urlConfig.getAllUrl;
    const options = RackhdHttpService.createOptions(responseType, query);
    return this.http.get<any>(url, options);
  }

  public getByIdentifier(identifier: string, responseType?: string, param?: string): Observable<any> {
    const options = RackhdHttpService.createOptions(responseType);
    const url = RackHD.getBaseUrl() +
      this.urlConfig.getByIdentifierUrl + identifier +
      (param ? param : '');
    return this.http.get<any>(url, options);
  }

  public patch(body: object, responseType?: string): Observable<any> {
    const options = RackhdHttpService.createOptions(responseType);
    const url = RackHD.getBaseUrl() + this.urlConfig.getAllUrl;
    return this.http.patch<any>(url, body, options);
  }

  public patchByIdentifier(identifier: string, body: any, responseType?: string): Observable<any> {
    const options = RackhdHttpService.createOptions(responseType);
    const url = RackHD.getBaseUrl() + this.urlConfig.getByIdentifierUrl + identifier;
    return this.http.patch<any>(url, body, options);
  }

  public put(body: any, responseType?: string): Observable<any> {
    const options = RackhdHttpService.createOptions(responseType);
    const url = RackHD.getBaseUrl() + this.urlConfig.getAllUrl;
    return this.http.put<any>(url, body, options);
  }

  public putByIdentifier(identifier: string, body: object, param?: any, responseType?: string): Observable<any> {
    const options = RackhdHttpService.createOptions(responseType);
    const url = RackHD.getBaseUrl() +
      this.urlConfig.getByIdentifierUrl + identifier +
      (param ? param : '');
    return this.http.put<any>(url, body, options);
  }

  public post(body: object, responseType?: string): Observable<any> {
    const options = RackhdHttpService.createOptions(responseType);
    const url = RackHD.getBaseUrl() + this.urlConfig.getAllUrl;
    return this.http.post<any>(url, body, options);
  }

  public postByIdentifier(identifier: string, body: object, param?: any, responseType?: string): Observable<any> {
    const options = RackhdHttpService.createOptions(responseType);
    const url = RackHD.getBaseUrl() +
      this.urlConfig.getByIdentifierUrl + identifier +
      (param ? param : '');
    return this.http.post<any>(url, body, options);
  }

  public delete(identifier: string, responseType?: string): Observable<any> {
    const options = RackhdHttpService.createOptions(responseType);
    const url = RackHD.getBaseUrl() + this.urlConfig.getByIdentifierUrl + identifier;
    return this.http.delete<any>(url, options);
  }

  public deleteByIdentifiers(idList: string [], responseType?: string): Observable<any> {
    const list = [];
    _.forEach(idList, id => {
      list.push(this.delete(id, responseType));
    });
    return forkJoin(list);
  }

  public upload(file: File, identifier?: string, method?: string): any {
    // Angular doesn't support upload formData with 'application/x-www-form-urlencoded'
    // RackHD files API only supports 'application/x-www-form-urlencoded' till now
    // Thus XMLHttpRequest() is used instead of HttpClient POST/PUT methods.
    return Observable.create( observer => {
      const xhr = new XMLHttpRequest();
      try {
        let url = this.urlConfig.uploadSuffix ? this.urlConfig.uploadSuffix : '';
        const token = RackHD.getToken();
        if (identifier) {
          url = RackHD.getBaseUrl() + this.urlConfig.getByIdentifierUrl + identifier + url;
        } else {
          url = RackHD.getBaseUrl() + this.urlConfig.uploadUrl;
        }
        xhr.open(method ? method : 'PUT', url, true);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.setRequestHeader('Accept', 'application/json');
        if (token) {
          xhr.setRequestHeader('authorization', 'JWT ' + token);
        }
      } catch (err) {
        observer.error(err);
      }

      xhr.onload = () => {
        if (xhr.status > 199 && xhr.status < 205 ) {
          observer.next(xhr.response);
          observer.complete();
        } else {
          observer.error(xhr.response);
        }
      };

      // xhr.onprogress = (event) => {
        // if (event.lengthComputable) {
          // var percentComplete = event.loaded / event.total;
        // }
      // }

      xhr.onerror = () => {
        observer.error(xhr.response || 'Error happend during uploading file');
      };

      xhr.send(file);
    });
  }

  public getMetaByIdentifier(identifier: string, responseType?: string): any  {
    const options = RackhdHttpService.createOptions(responseType);
    let url = RackHD.getBaseUrl() + this.urlConfig.getMetadataUrl + identifier;
    if (url.search('metadata') === -1) {
      url += '/metadata';
    }
    return this.http.get<any>(url, options);
  }
}
