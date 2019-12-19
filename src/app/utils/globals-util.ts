import * as _ from 'lodash';

export class RackhdLocalStorage {

  public static isSecured(): boolean {
    return window.localStorage.getItem('rackhd.connSecured') === 'true' ? true : false;
  }

  public static getBaseUrl(): string {
      return (RackhdLocalStorage.isSecured() ? 'https://' : 'http://') +
        window.localStorage.getItem('rackhd.northboundApi');
  }

  public static getToken(): string {
    return window.localStorage.getItem('rackhd.authToken');
  }

}
