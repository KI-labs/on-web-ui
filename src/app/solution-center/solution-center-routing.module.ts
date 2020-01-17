import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SolutionCenterComponent } from './solution-center.component';
import { OsInstallComponent } from '../solution-center/os-install/os-install.component';

const SolutionCenterRoutes: Routes = [
  {
    path: '',
    component: SolutionCenterComponent,
    children: [
      { path: '', redirectTo: 'osInstall' },
      { path: 'osInstall', component: OsInstallComponent },
    ]
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(SolutionCenterRoutes)
  ],
  exports: [
    RouterModule
  ]
})
export class SolutionCenterRoutingModule {
}
