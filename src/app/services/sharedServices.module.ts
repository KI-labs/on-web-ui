//////////////////////////////////////////////////////////////////////
// This file is to share injectable instance across the app
// otherwise, if diff components add the same service into their own providers pool
// there will be multiple instance of this service instead of singleton
// 
//////////////////////////////////////////////////////////////////////
import { NgModule, ModuleWithProviders } from '@angular/core';

import { AppCoreModule } from './core/core.module';
import { ActivityService } from './activity.service';

import { NodeService } from './node.service';
import { CatalogsService } from './catalogs.service';
import { PollersService } from './pollers.service';
import { ObmService } from './obm.service';
import { SkusService } from './sku.service';

@NgModule({
  exports: [
    AppCoreModule,
  ],
  providers: [
    NodeService,
    CatalogsService,
    PollersService,
    ObmService,
    SkusService,
  ]
})
export class SharedServicesModule { }
