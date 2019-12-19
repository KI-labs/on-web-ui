import {
  Component,
  OnInit,
  AfterViewInit,
  ChangeDetectorRef,
  Output,
  EventEmitter,
} from '@angular/core';

import {
  FormsModule,
  ReactiveFormsModule ,
  FormBuilder,
  FormGroup,
  FormControl,
  Validators
} from '@angular/forms';

import { API_PATTERN, ADDR_PATTERN } from 'app/models/index';
import { SettingService } from './setting.service';
import { ClarityModule } from '@clr/angular';
import { NodeService } from 'app/services/rackhd/node.service';
import * as _ from 'lodash';

@Component({
  selector: 'app-setting-form',
  templateUrl: './setting-form.component.html',
  styleUrls: ['./setting-form.component.scss']
})

export class SettingComponent implements OnInit, AfterViewInit {
  @Output() public onSave: EventEmitter<boolean> = new EventEmitter<boolean>();

  public defaultDirty: boolean;
  public tokenDirty: boolean;
  public checkboxesDirty: boolean;

  public tokenErrorMsg: string = '';
  public apiErrorMsg: string = '';

  public settingFormGroup: FormGroup;
  public initialConfigs: any;

  constructor(
    public settingService: SettingService,
    public rackhdService: NodeService
  ) {}

  public ngOnInit() {
    this.settingService.loadInitialConfig();
    this.initialConfigs = {
      northboundApi: this.settingService.northboundApi,
      websocketUrl: this.settingService.websocketUrl,
      authEnabled: this.settingService.authEnabled,
      connSecured: this.settingService.connSecured,
      authToken: this.settingService.authToken
    };
    this.createForm();
  }

  public ngAfterViewInit() {
    this.accessRackhdApi();
  }

  public createForm() {
    this.settingFormGroup = new FormGroup({
      rackhdNorthboundApi: new FormControl(
        this.settingService.northboundApi,
        {validators: [Validators.pattern(API_PATTERN), Validators.required]}
      ),
      rackhdWebsocketUrl: new FormControl(
        this.settingService.websocketUrl,
        {validators: [Validators.pattern(ADDR_PATTERN), Validators.required]}
      ),
      rackhdAuth: new FormGroup({
        rackhdPassword: new FormControl(
          {value: '', disabled: !this.settingService.authEnabled},
          {validators: [ Validators.required]}
        ),
        rackhdUsername: new FormControl(
          {value: '', disabled: !this.settingService.authEnabled},
          {validators: [ Validators.required]}
        ),
        rackhdAuthToken: new FormControl(
          {value: this.settingService.authToken, disabled: !this.settingService.authEnabled},
          {validators: [ Validators.required]}
        )
      })
    });
  }

  public resetSettings() {
    const defaultConfig = this.settingService.loadDefaultConfig();
    this.settingFormGroup.reset({
      rackhdNorthboundApi: defaultConfig.northboundApi,
      rackhdWebsocketUrl: defaultConfig.websocketUrl,
      rackhdAuth: {
        rackhdPassword: {value: '', disabled: !defaultConfig.authEnabled},
        rackhdUsername: {value: '', disabled: !defaultConfig.authEnabled},
        rackhdAuthToken: {value: '', disabled: !defaultConfig.authEnabled},
      }
    });
    this.settingService.authEnabled = defaultConfig.authEnabled;
    this.settingService.connSecured = defaultConfig.connSecured;
    this.defaultDirty = true;
  }

  public formClassInvalid(value: string): boolean {
    return this.settingFormGroup.get(value).invalid;
  }

  public generateTokenDisabled(): boolean {
    return this.formClassInvalid('rackhdAuth.rackhdUsername')
      || this.formClassInvalid('rackhdAuth.rackhdPassword')
      || !this.settingService.authEnabled;
  }

  public saveButtonDisabled(): boolean {
    const urlDirty = this.settingFormGroup.dirty && !this.settingFormGroup.get('rackhdAuth').dirty;
    const tokenDirty =  this.settingFormGroup.get('rackhdAuth.rackhdAuthToken').dirty
      || this.tokenDirty; // token updated won't update form .dirty attribute
    const settingDirty = urlDirty || this.checkboxesDirty || tokenDirty;
    const settingInvalid = this.settingFormGroup.invalid;
    return (settingInvalid || !settingDirty ) && !this.defaultDirty;
  }

  public handleAuthChanged(value: boolean) {
    const authItems = ['rackhdPassword', 'rackhdUsername', 'rackhdAuthToken'];
    _.forEach(authItems, (item) => {
      const formItem = this.settingFormGroup.get('rackhdAuth.' + item);
      value ? formItem.enable() : formItem.disable();
    });
    if (!value) {
      this.settingService.authToken = '';
      this.settingFormGroup.patchValue({
        rackhdAuth: {rackhdAuthToken: ''}
      });
    }
    this.checkboxChanged();
  }

  public checkboxChanged() {
    this.accessRackhdApi();
    this.checkboxesDirty = true;
  }

  public accessRackhdApi() {
    if (!this.formClassInvalid('rackhdNorthboundApi')) {
      this.settingService.northboundApi = this.settingFormGroup.get('rackhdNorthboundApi').value;
      return this.rackhdService.apiPing()
      .subscribe(
        (data) => {
          this.apiErrorMsg = '';
        },
        (err) => {
          this.apiErrorMsg = 'RackHD northbound API is inaccessible';
        }
      );
    }
  }

  public generateToken() {
    this.settingService.northboundApi = this.settingFormGroup.get('rackhdNorthboundApi').value;
    this.settingService.generateToken(
      this.settingFormGroup.get('rackhdAuth.rackhdUsername').value,
      this.settingFormGroup.get('rackhdAuth.rackhdPassword').value
    ).subscribe(
      (data) => {
        this.settingService.authToken = data['token'];
        this.settingFormGroup.patchValue({
          rackhdAuth: {
            rackhdAuthToken: data['token'] || ''
          }
        });
        this.tokenDirty = true;
        this.tokenErrorMsg = '';
        this.accessRackhdApi();
      },
      (err) => {
        if (err.status === 404) {
          this.tokenErrorMsg =
            'Get token failed, please check if authenticate is enabled in RackHD.';
        } else {
          this.tokenErrorMsg =
            'Get token failed, please check if RackHD Northbound API is correct.';
        }
        // this.accessRackhdApi();
      }
    );
  }

  public submitFormValues() {
    this.settingService.websocketUrl = this.settingFormGroup.get('rackhdWebsocketUrl').value;
    this.settingService.northboundApi = this.settingFormGroup.get('rackhdNorthboundApi').value;
    this.settingService.authToken = this.settingFormGroup.get('rackhdAuth.rackhdAuthToken').value;
  }

  public onCancel() {
    this.settingFormGroup.patchValue({
      rackhdNorthboundApi: this.initialConfigs.northboundApi,
      rackhdWebsocketUrl: this.initialConfigs.websocketUrl,
      rackhdAuth: {rackhdAuthToken: this.initialConfigs.authToken}
    });
    this.settingService.authEnabled = this.initialConfigs.authEnabled;
    this.settingService.connSecured = this.initialConfigs.connSecured;
    this.onSave.emit(true);
    this.accessRackhdApi();
  }

  public onSubmit() {
    this.submitFormValues();
    this.onSave.emit(true);
    window.location.reload();
  }
}
