//////////////////////////////////////////////////////////////////////
// This file is to share injectable instance across the app
// otherwise, if diff components add the same service into their own providers pool
// there will be multiple instance of this service instead of singleton
//
//////////////////////////////////////////////////////////////////////
import { NgModule } from '@angular/core';

import { AppCoreModule } from './core/core.module';

import { RackhdCommonServicesModule } from './rackhd/rackhd.module';


@NgModule({
  exports: [
    AppCoreModule,
    RackhdCommonServicesModule
  ],
  providers: []
})
export class SharedServicesModule { }
