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
  selector: 'details-modal',
  templateUrl: './details-modal.component.html',
  styleUrls: ['./details-modal.component.scss'],
  encapsulation: ViewEncapsulation.None
})

export class GridDetailsModalComponent {
  public isPopValue: boolean = false;
  @Input() public isJson: boolean = true;
  @Input() public size: string = 'lg';
  @Input() public title: string;
  @Input() public data: any;
  @Input() public dataType: string = 'Details';
  @Input() get isPop() {
    return this.isPopValue;
  }
  @Output() public isPopChange = new EventEmitter();

  set isPop(value) {
    this.isPopValue = value;
    this.isPopChange.emit(value);
  }

  constructor() {}

}
