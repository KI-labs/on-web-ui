import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {CONFIG_URL } from '../../models';
import { RackhdHttpService } from '../../utils/rackhd-http';


@Injectable()
export class ConfigService extends RackhdHttpService {
  constructor(public http: HttpClient) {
    super(http, CONFIG_URL);
  }
}
