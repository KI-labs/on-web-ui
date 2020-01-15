import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ClarityModule } from '@clr/angular';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HeaderComponent } from './header';
import { GlobalAlertComponent } from './global-alert/global-alert.component';
import { FormsModule } from '@angular/forms';
import { SharedServicesModule } from './services/sharedServices.module';
import { NoContentModule } from './no-content';
import { SettingModule } from './settings/setting.module';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    GlobalAlertComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ClarityModule,
    BrowserAnimationsModule,
    FormsModule,
    SharedServicesModule,
    NoContentModule,
    SettingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
