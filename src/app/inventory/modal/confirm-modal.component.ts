import {
  Component,
  ViewEncapsulation,
  Input,
  Output,
  EventEmitter
} from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl }   from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ClarityModule } from '@clr/angular';

import * as _ from 'lodash';

@Component({
  selector: 'confirm-modal',
  templateUrl: './confirm-modal.component.html',
  styleUrls: ['./confirm-modal.component.scss'],
  encapsulation: ViewEncapsulation.None
})

export class GridConfirmModalComponent {
  public isPopValue: boolean = false;
  @Input() public size: string = 'lg'; // Modal size
  @Input() public title: string; // Modal key title
  @Input() public data: any; // Data to be shown
  @Input() public displayAttr: string = 'id'; // Attribute of data to be shown
  @Input() public action: string = 'delete'; // Modal action
  @Input() get isPop() { // Modal popup flag input
    return this.isPopValue;
  }
  @Output() public isPopChange = new EventEmitter(); // Modal popup flag output
  @Output() public confirm = new EventEmitter(); // Actions output

  set isPop(value) {
    this.isPopValue = value;
    this.isPopChange.emit(value);
  }

  constructor() {}

  public onReject() {
    this.confirm.emit('reject');
  }

  public onAccept() {
    this.confirm.emit('accept');
  }
}
