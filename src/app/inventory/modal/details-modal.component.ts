import {
  Component,
  ViewEncapsulation,
  Input,
  Output,
  EventEmitter
} from '@angular/core';

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

  @Output() isPopChange = new EventEmitter();

  @Input() get isPop() {
    return this.isPopValue;
  }
  set isPop(value) {
    this.isPopValue = value;
    this.isPopChange.emit(value);
  }

  constructor() {}

}
