import { Component, OnInit } from '@angular/core';
import { findIndex, remove } from 'lodash-es';
import {GlobalAlertService} from '../services/core/global-alert.service';

@Component({
  selector: 'app-global-alert',
  templateUrl: './global-alert.component.html',
  styleUrls: ['./global-alert.component.css']
})
export class GlobalAlertComponent implements OnInit {
  modalErrorMsges = [];
  barErrorMsges = [];
  msgId = 0;
  showErrors = false;
  constructor(
    public globalAlertService: GlobalAlertService
  ) {}

  ngOnInit() {
    this.globalAlertService.getAlertQueue().subscribe(
      alertObj => {
        const msg = alertObj.msg;
        if (alertObj.type === 'modal') {
          if (findIndex(this.modalErrorMsges, (cMsg) => cMsg.text === msg) === -1) {
            let errorContent;
            try {
              errorContent = JSON.parse(msg);
            } catch (e) {
              errorContent = msg;
            }
            this.modalErrorMsges.push({id: this.msgId, text: errorContent});
            this.modalErrorMsges = [].concat(this.modalErrorMsges);
            this.showErrors = true;
            this.msgId += 1;
          }
        } else if (alertObj.type === 'bar') {
          if (findIndex(this.barErrorMsges, (cMsg) => cMsg.text === msg) === -1) {
            this.barErrorMsges.push({id: this.msgId, text: msg});
            this.barErrorMsges = [].concat(this.barErrorMsges);
            this.msgId += 1;
          }
        }
      }
    );
  }

  closeModalAlert() {
    remove(this.modalErrorMsges);
    this.showErrors = false;
  }

  closeBarAlert(msgId: string) {
    remove(this.barErrorMsges, (msg) => msg.id === msgId);
  }

}
