import {
  Component,
  ViewEncapsulation,
  Input,
  Output,
  EventEmitter
} from '@angular/core';

import * as _ from 'lodash';

@Component({
  selector: 'app-confirm-modal',
  templateUrl: './confirm-modal.component.html',
  styleUrls: ['./confirm-modal.component.scss'],
  encapsulation: ViewEncapsulation.None
})

export class GridConfirmModalComponent {
  isPopValue = false;
  @Input() size = 'lg'; // Modal size
  @Input() title: string; // Modal key title
  @Input() data: any; // Data to be shown
  @Input() displayAttr = 'id'; // Attribute of data to be shown
  @Input() action = 'delete'; // Modal action

  @Output() isPopChange = new EventEmitter(); // Modal popup flag output
  @Output() confirm = new EventEmitter(); // Actions output

  @Input() get isPop() { // Modal popup flag input
  return this.isPopValue;
  }

  set isPop(value) {
    this.isPopValue = value;
    this.isPopChange.emit(value);
  }

  constructor() {}

  onReject() {
    this.confirm.emit('reject');
  }

  onAccept() {
    this.confirm.emit('accept');
  }
}
