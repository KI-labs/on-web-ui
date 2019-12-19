import { NgModule } from '@angular/core';
import { Routes, RouterModule, PreloadAllModules } from '@angular/router';
import { NoContentComponent } from './no-content/no-content.component';

const routes: Routes = [
  { path: '', redirectTo: '/managementCenter/nodes', pathMatch: 'full' },
  {
    path: 'managementCenter',
    loadChildren: () => import('./management-center/management-center.module').then(m => m.ManagementCenterModule)
  },
  {
    path: 'workflowCenter',
    loadChildren: () => import('./workflow-center/workflow-center.module').then(m => m.WorkflowCenterModule)
  },
  {
    path: 'solutionCenter',
    loadChildren: () => import('./solution-center/solution-center.module').then(m => m.SolutionCenterModule)
  },
  // 404 page, page with ** can not be lazily loaded.
  { path: '**', component: NoContentComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    // If we don't want to use hash mode, we need to change RackHD
    // useHash: Boolean(history.pushState) === true,
    useHash: true,
    preloadingStrategy: PreloadAllModules
    // enableTracing: true
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
