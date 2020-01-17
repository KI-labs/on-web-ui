import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ClarityModule } from '@clr/angular';

import { SolutionCenterComponent } from './solution-center.component';
import { SolutionCenterRoutingModule } from './solution-center-routing.module';
import { OsInstallComponent } from '../solution-center/os-install/os-install.component';
import { InventoryModule } from '../inventory/inventory.module';

@NgModule({
  imports: [
    ClarityModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    InventoryModule,
    SolutionCenterRoutingModule
  ],
  declarations: [SolutionCenterComponent, OsInstallComponent]
})

export class SolutionCenterModule { }
