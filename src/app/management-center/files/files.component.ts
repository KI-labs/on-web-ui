import { ChangeDetectorRef, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Comparator, StringFilter } from '@clr/angular';
import { Subject } from 'rxjs/Subject';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Observable } from 'rxjs/Observable';
import {
  AlphabeticalComparator,
  StringOperator,
  ObjectFilterByKey,
} from '../../utils/inventory-operator';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl }   from '@angular/forms';
import * as _ from 'lodash';

import { FileService } from '../services/file.service';
import { File, ModalTypes } from '../../models';

@Component({
  selector: 'app-files',
  templateUrl: './files.component.html',
  styleUrls: ['./files.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class FilesComponent implements OnInit {
  public filesStore: File[] = [];
  public allFiles: File[] = [];
  public selectedFiles: File[] = [];
  public selectedFile: File;

  public files: FileList;

  public action: string;
  public isShowModal: boolean;
  public rawData: string;

  public modalTypes: ModalTypes;

  // data grid helper
  public dgDataLoading = false;
  public dgPlaceholder = 'No file found!';

  public versionComparator = new AlphabeticalComparator<File>('version');
  public filenameComparator = new AlphabeticalComparator<File>('filename');
  public basenameComparator = new AlphabeticalComparator<File>('basename');
  public versionFilter = new ObjectFilterByKey<File>('version');
  public filenameFilter = new ObjectFilterByKey<File>('filename');
  public basenameFilter = new ObjectFilterByKey<File>('basename');
  public idFilter = new ObjectFilterByKey<File>('id');

  constructor(private fileService: FileService) { }

  public ngOnInit() {
    this.isShowModal = false;
    this.modalTypes = new ModalTypes();
    this.getAll();
  }

  public getAll(): void {
    this.fileService.getAll()
      .subscribe((data) => {
        this.filesStore = data;
        this.allFiles = data;
        this.dgDataLoading = false;
      });
  }

  public getMetaData(identifier: string): void {
    this.fileService.getMetaByIdentifier(identifier)
    .subscribe((data) => {
      this.rawData = data;
      this.isShowModal = true;
    });
  }

  public getRawData(identifier: string): void {
    this.fileService.getByIdentifier(identifier, 'text')
    .subscribe((data) => {
      this.rawData = data;
      this.isShowModal = true;
    });
  }

  public searchFile(term: string) {
    this.dgDataLoading = true;
    this.filesStore = StringOperator.search(term, this.allFiles);
    this.dgDataLoading = false;
  }

  public create() {
    this.action = 'Upload';
    this.isShowModal = true;
  }

  public batchDelete() {
    if (!_.isEmpty(this.selectedFiles)) {
      this.action = 'Delete';
      this.isShowModal = true;
    }
  }

  public refresh() {
    this.isShowModal = false;
    this.dgDataLoading = true;
    this.getAll();
  }

  public deleteSel() {
    const idList = _.map(this.selectedFiles, (file) => {
      return file.uuid;
    });
    this.isShowModal = false;
    this.fileService.deleteByIdentifiers(idList)
    .subscribe(
      (data) => { this.refresh(); }
    );
  }

  public onConfirm(value) {
    switch (value) {
      case 'reject':
        this.isShowModal = false;
        break;
      case 'accept':
        this.deleteSel();
    }
  }

  public onAction(action) {
    switch (action) {
      case 'Refresh':
        this.refresh();
        break;
      case 'Create':
        this.create();
        break;
      case 'Delete':
        this.batchDelete();
        break;
    }
  }

  public onFilter(filtered) {
    this.filesStore = filtered;
  }

  public onUpdate(file: File) {
    this.selectedFile = file;
    this.action = 'Update';
    this.isShowModal = true;
  }

  public onDelete(file: File) {
    this.selectedFiles = [file];
    this.action = 'Delete';
    this.isShowModal = true;
  }

  public onGetDetails(file: File) {
    this.selectedFile = file;
    this.action = 'Meta';
    this.getMetaData(file.filename);
  }

  public onGetRawData(file: File) {
    this.selectedFile = file;
    this.action = 'Raw';
    this.getRawData(file.filename);
  }

  public onChange(event) {
    this.files =  event.target.files;
  }

  public onCreateSubmit() {
    // existingFilename is used to store filename when updating file
    const existingFilename = this.selectedFile && this.selectedFile.filename;
    const file = this.files[0];
    // TODO: Add more details on progress
    // TODO: And use sync mode instead of async mode
    // TODO: Add support on multiple files upload support
    this.isShowModal = false;
    this.fileService.upload(file, existingFilename || file.name)
    .subscribe(() => {
      this.selectedFile = null;
      this.refresh();
    });
  }
}
