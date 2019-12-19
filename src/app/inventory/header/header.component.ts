import { Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { StringOperator } from '../../utils/inventory-operator';

@Component({
  selector: 'inventory-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  encapsulation: ViewEncapsulation.None
})

export class InventoryHeaderComponent implements OnInit {
  @Input() public allItems: any;
  @Input() public name: string;
  @Input() public isSearchRequired: boolean = true;
  @Input() public isRefreshRequired: boolean = true;
  @Input() public isDeleteRequired: boolean = true;
  @Input() public isCreateRequired: boolean = true;
  @Input() public isCancelRequired: boolean = false;

  @Output() public filter = new EventEmitter();
  @Output() public action = new EventEmitter();

  public searchValue: string = '';
  public filteredItems: any[];
  public searchTerms = new Subject<string>();

  constructor() {
  }

  public ngOnInit() {
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

  public search(term: string) {
    this.filteredItems = StringOperator.search(term, this.allItems);
    this.filter.emit(this.filteredItems);
  }

  public onSearch(term) {
    this.searchTerms.next(term);
  }

  public onClear() {
    this.searchTerms.next('');
  }

  public onCreate() {
    this.action.emit('Create');
  }

  public onRefresh() {
    this.action.emit('Refresh');
  }

  public onBatchDelete() {
    this.action.emit('Delete');
  }

  public onBatchCancel() {
    this.action.emit('Cancel');
  }
}
