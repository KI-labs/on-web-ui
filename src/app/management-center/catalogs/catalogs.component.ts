import { Component, OnInit } from '@angular/core';
import { Catalog } from 'app/models';
import { CatalogsService } from 'app/services/rackhd/catalogs.service';
import { Subject } from 'rxjs/Subject';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

import * as _ from 'lodash';
import { AlphabeticalComparator, ObjectFilterByKey, StringOperator } from 'app/utils/inventory-operator';

@Component({
  selector: 'app-catalogs',
  templateUrl: './catalogs.component.html',
  styleUrls: ['./catalogs.component.scss']
})
export class CatalogsComponent implements OnInit {
  public allCatalogs: Catalog[];
  public catalogsStore: Catalog[];

  public selectedCatalog: Catalog;
  public specCatalog: Catalog;
  public isShowDetail: boolean;
  public isShowData: boolean;

  // data grid helper
  public dgDataLoading = false;
  public dgPlaceholder = 'No catalog found!';

  public idComparator = new AlphabeticalComparator('id');
  public nodeComparator = new AlphabeticalComparator('node');
  public sourceComparator = new AlphabeticalComparator('source');
  public createTimeComparator = new AlphabeticalComparator('createdAt');
  public updateTimeComparator = new AlphabeticalComparator('updatedAt');

  public idFilter = new ObjectFilterByKey('id');
  public nodeFilter = new ObjectFilterByKey('node');
  public sourceFilter = new ObjectFilterByKey('source');

  constructor(public catalogsService: CatalogsService) {
    this.specCatalog = new Catalog();
  }

  public ngOnInit() {
    this.getAllCatalogs();
  }

  public getAllCatalogs(): void {
    this.catalogsService.getAll()
      .subscribe( (data) => {
        this.allCatalogs = data;
        this.catalogsStore = data;
        this.dgDataLoading = false;
      });
  }

  public refresh() {
    this.dgDataLoading = true;
    this.getAllCatalogs();
  }

  public goToDetail(catalog: Catalog) {
    this.selectedCatalog = catalog;
    this.isShowDetail = true;
  }

  public onAction(action) {
    switch (action) {
      case 'Refresh':
        this.refresh();
        break;
    }
  }

  public onFilter(filtered) {
    this.catalogsStore = filtered;
  }
}
