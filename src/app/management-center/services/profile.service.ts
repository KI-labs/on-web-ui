import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {PROFILE_URL } from '../../models';
import { RackhdHttpService } from '../../utils/rackhd-http';

@Injectable()
export class ProfileService extends RackhdHttpService {

  constructor(public http: HttpClient) {
    super(http, PROFILE_URL);
  }
}
