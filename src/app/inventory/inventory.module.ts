import { ClarityModule } from '@clr/angular';
import { NgModule, ModuleWithProviders } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

// import { InventoryFooterComponent } from './footer/footer.component';
import { InventoryHeaderComponent } from './header/header.component';
import { GridDetailsModalComponent } from './modal/details-modal.component';
import { GridConfirmModalComponent } from './modal/confirm-modal.component';
import { DropdownGroupComponent } from './dropdown-group/dropdown-group.component';

@NgModule({
  imports: [
    ClarityModule.forChild(),
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    ClarityModule,
  ],
  exports: [
    InventoryHeaderComponent,
    GridDetailsModalComponent,
    GridConfirmModalComponent,
    DropdownGroupComponent,
  ],
  declarations: [
    InventoryHeaderComponent,
    GridDetailsModalComponent,
    GridConfirmModalComponent,
    DropdownGroupComponent,
  ]
})
export class InventoryModule {}
