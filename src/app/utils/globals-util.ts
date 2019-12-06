import * as _ from 'lodash';
import { isDevMode } from '@angular/core';

export class RackhdLocalStorage {
  constructor () {}

  static isSecured(): boolean {
    return window.localStorage.getItem('rackhd.connSecured') === 'true' ? true : false;
  }

  static getBaseUrl(): string {

      return isDevMode()? 'http://localhost:4000': (RackhdLocalStorage.isSecured() ? 'https://' : 'http://') + 
        window.localStorage.getItem('rackhd.northboundApi');

  }

  static getToken(): string {
    return window.localStorage.getItem('rackhd.authToken');
  }
}
