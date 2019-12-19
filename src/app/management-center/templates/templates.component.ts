import { ChangeDetectorRef, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Comparator, StringFilter } from '@clr/angular';
import { Subject } from 'rxjs/Subject';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Observable } from 'rxjs/Observable';
import { AlphabeticalComparator, StringOperator, ObjectFilterByKey } from '../../utils/inventory-operator';
import * as _ from 'lodash';

import { TemplateService } from '../services/template.service';
import { Template, ModalTypes } from '../../models';

@Component({
  selector: 'app-templates',
  templateUrl: './templates.component.html',
  styleUrls: ['./templates.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class TemplatesComponent implements OnInit {
  public templatesStore: Template[] = [];
  public allTemplates: Template[] = [];
  public selectedTemplate: Template;

  public files: FileList;

  public action: string;
  public isShowModal: boolean;
  public rawData: string;

  public dgDataLoading = false;
  public dgPlaceholder = 'No template found!';

  public modalTypes: ModalTypes;

  public scopeComparator = new AlphabeticalComparator<Template>('scope');
  public nameComparator = new AlphabeticalComparator<Template>('name');
  public scopeFilter = new ObjectFilterByKey<Template>('scope');
  public nameFilter = new ObjectFilterByKey<Template>('name');
  public idFilter = new ObjectFilterByKey<Template>('id');

  constructor(private templateService: TemplateService) { }

  public ngOnInit() {
    this.modalTypes = new ModalTypes();
    this.getAll();
  }

  public getAll(): void {
    this.templateService.getAll()
      .subscribe((data) => {
        this.templatesStore = data;
        this.allTemplates = data;
        this.dgDataLoading = false;
      });
  }

  public getMetaData(identifier: string) {
    this.templateService.getMetaByIdentifier(identifier)
    .subscribe((data) => {
      this.rawData = data;
      this.isShowModal = true;
    });
  }

  public getRawData(identifier: string) {
    this.templateService.getByIdentifier(identifier, 'text')
    .subscribe((data) => {
      this.rawData = data;
      this.isShowModal = true;
    });
  }

  public onFilter(filtered: Template[]) {
    this.templatesStore = filtered;
  }

  public refresh() {
    this.dgDataLoading = true;
    this.getAll();
  }

  public onAction(action) {
    switch (action) {
      case 'Refresh':
        this.refresh();
        break;
      case 'Create':
        this.create();
        break;
    }
  }

  public create() {
    this.action = 'Upload';
    this.isShowModal = true;
  }

  public onUpdate(template: Template) {
    this.selectedTemplate = template;
    this.action = 'Update';
    this.isShowModal = true;
  }

  public onGetDetails(template: Template) {
    this.selectedTemplate = template;
    this.action = 'Meta';
    this.getMetaData(template.name);
  }

  public onGetRawData(template: Template) {
    this.selectedTemplate = template;
    this.action = 'Raw';
    this.getRawData(template.name);
  }

  public onChange(event) {
    this.files =  event.target.files;
  }

  public onCreateSubmit() {
    // existingFilename is used to store filename when updating file
    const existingFilename = this.selectedTemplate && this.selectedTemplate.name;
    const file = this.files[0];
    // TODO: Add more details on progress
    // TODO: And use sync mode instead of async mode
    // TODO: Add support on multiple files upload support
    this.isShowModal = false;
    this.templateService.upload(file, existingFilename || file.name)
    .subscribe(() => {
      this.selectedTemplate = null;
      this.refresh();
    });
  }

}
