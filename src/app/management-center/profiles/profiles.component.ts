import { ChangeDetectorRef, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Comparator, StringFilter } from '@clr/angular';
import { Subject } from 'rxjs/Subject';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Observable } from 'rxjs/Observable';
import { AlphabeticalComparator, StringOperator, ObjectFilterByKey } from 'app/utils/inventory-operator';
import * as _ from 'lodash';

import { ProfileService } from 'app/management-center/services/profile.service';
import { Profile, ModalTypes } from 'app/models';

@Component({
  selector: 'app-profiles',
  templateUrl: './profiles.component.html',
  styleUrls: ['./profiles.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ProfilesComponent implements OnInit {
  public profilesStore: Profile[] = [];
  public allProfiles: Profile[] = [];
  public selectedProfile: Profile;

  public files: FileList;

  public action: string;
  public isShowModal: boolean;
  public rawData: string;

  public modalTypes: ModalTypes;

  // data grid helper
  public dgDataLoading = false;
  public dgPlaceholder = 'No profile found!';

  public scopeComparator = new AlphabeticalComparator<Profile>('scope');
  public nameComparator = new AlphabeticalComparator<Profile>('name');
  public scopeFilter = new ObjectFilterByKey<Profile>('scope');
  public nameFilter = new ObjectFilterByKey<Profile>('name');
  public idFilter = new ObjectFilterByKey<Profile>('id');

  constructor(private profileService: ProfileService) { }

  public ngOnInit() {
    this.getAll();
    this.modalTypes = new ModalTypes();
  }

  public getAll(): void {
    this.profileService.getAll()
      .subscribe((data) => {
        this.profilesStore = data;
        this.allProfiles = data;
        this.dgDataLoading = false;
      });
  }

  public getMetaData(identifier: string) {
    this.profileService.getMetaByIdentifier(identifier)
    .subscribe((data) => {
      this.rawData = data;
      this.isShowModal = true;
    });
  }

  public getRawData(identifier: string) {
    this.profileService.getByIdentifier(identifier, 'text')
    .subscribe((data) => {
      this.rawData = data;
      this.isShowModal = true;
    });
  }

  public onFilter(filtered) {
    this.profilesStore = filtered;
  }

  public refresh() {
    this.dgDataLoading = true;
    this.getAll();
  }

  public create() {
    this.action = 'Upload';
    this.isShowModal = true;
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

  public onUpdate(profile: Profile) {
    this.selectedProfile = profile;
    this.action = 'Update';
    this.isShowModal = true;
  }

  public onGetDetails(profile: Profile) {
    this.selectedProfile = profile;
    this.action = 'Meta';
    this.getMetaData(profile.name);
  }

  public onGetRawData(profile: Profile) {
    this.selectedProfile = profile;
    this.action = 'Raw';
    this.getRawData(profile.name);
  }

  public onChange(event) {
    this.files =  event.target.files;
  }

  public onCreateSubmit() {
    // existingFilename is used to store filename when updating file
    const existingFilename = this.selectedProfile && this.selectedProfile.name;
    const file = this.files[0];
    // TODO: Add more details on progress
    // TODO: And use sync mode instead of async mode
    // TODO: Add support on multiple files upload support
    this.isShowModal = false;
    this.profileService.upload(file, existingFilename || file.name)
    .subscribe(() => {
      this.selectedProfile = null;
      this.refresh();
    });
  }

}
