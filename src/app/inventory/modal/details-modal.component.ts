import {
  Component,
  ViewEncapsulation,
  Input,
  Output,
  EventEmitter
} from '@angular/core';

import * as _ from 'lodash';

@Component({
  selector: 'app-details-modal',
  templateUrl: './details-modal.component.html',
  styleUrls: ['./details-modal.component.scss'],
  encapsulation: ViewEncapsulation.None
})

export class GridDetailsModalComponent {
  isPopValue = false;
  @Input() isJson = true;
  @Input() size = 'lg';
  @Input() title: string;
  @Input() data: any;
  @Input() dataType = 'Details';
  @Input() get isPop() {
    return this.isPopValue;
  }
  @Output() isPopChange = new EventEmitter();

  set isPop(value) {
    this.isPopValue = value;
    this.isPopChange.emit(value);
  }

  constructor() {}

}
