import { Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { StringOperator } from '../../utils/inventory-operator';

@Component({
  selector: 'app-inventory-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  encapsulation: ViewEncapsulation.None
})

export class InventoryHeaderComponent implements OnInit {
  @Input() allItems: any;
  @Input() name: string;
  @Input() isSearchRequired = true;
  @Input() isRefreshRequired = true;
  @Input() isDeleteRequired = true;
  @Input() isCreateRequired = true;
  @Input() isCancelRequired = false;
  @Input() isCleanRequired = false;

  @Output() filter = new EventEmitter();
  @Output() action = new EventEmitter();

  searchValue = '';
  filteredItems: any[];
  searchTerms = new Subject<string>();

  constructor() {
  }

  ngOnInit() {
    const searchTrigger = this.searchTerms.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((term: string) => {
        this.search(term);
        return 'whatever';
      })
    );
    searchTrigger.subscribe();
  }

  search(term: string) {
    this.filteredItems = StringOperator.search(term, this.allItems);
    this.filter.emit(this.filteredItems);
  }

  onSearch(term) {
    this.searchTerms.next(term);
  }

  onClear() {
    this.searchTerms.next('');
  }

  onCreate() {
    this.action.emit('Create');
  }

  onRefresh() {
    this.action.emit('Refresh');
  }

  onBatchDelete() {
    this.action.emit('Delete');
  }

  onBatchClean() {
    this.action.emit('Clean');
  }

  onBatchCancel() {
    this.action.emit('Cancel');
  }
}
