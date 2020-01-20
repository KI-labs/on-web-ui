import { async, ComponentFixture, TestBed, fakeAsync, flush } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';


import { RunWorkflowComponent } from './run-workflow.component';
import { RackhdCommonServicesModule } from '../../services/rackhd/rackhd.module';
import { SharedServicesModule } from '../../services/sharedServices.module';
import { AppModule } from '../../../app/app.module';

import { standardConfig } from '../../../miragejs/server.js';
import { Server, Response } from 'miragejs';
import { InventoryModule } from 'src/app/inventory/inventory.module';


function makeTestServer() {

  return new Server({
    environment: 'test',

    ...standardConfig,

    timing: 0,
    urlPrefix: 'http://0.0.0.0',
    namespace: '/api/2.0',

  });
}

describe('RunWorkflowComponent', () => {
  let component: RunWorkflowComponent;
  let fixture: ComponentFixture<RunWorkflowComponent>;
  let server: any;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [SharedServicesModule, RackhdCommonServicesModule, AppModule, InventoryModule],
      declarations: [RunWorkflowComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    server = makeTestServer();

    fixture = TestBed.createComponent(RunWorkflowComponent);
    component = fixture.componentInstance;

    spyOn(component, 'getAllWorkflows').and.callFake(() => []);
    spyOn(component, 'getAllNodes').and.callFake(() => []);

    window.localStorage.getItem = () => {
      return '0.0.0.0/api/2.0';
    };

    fixture.detectChanges();
  });

  it('retries 2 times and then success', fakeAsync(() => {

    let counter = 1;

    server.post('/nodes/:id/workflows', () => {
      if (counter === 3) {
        return {
          injectableName: 'Graph.Service.Docker',
          instanceId: 'a44e7b50-5bd9-40f2-b9a1-8ee5e6faeaa0'
        };
      } else {
        counter = counter + 1;
        return new Response(501);
      }

    });

    window.localStorage.getItem = () => {
      return '0.0.0.0/api/2.0';
    };

    component.editor.get = () => ({});
    component.selectedNode = { id: '1d23456789' };
    component.selectedGraph = { injectableName: 'Graph.Service.Docker' };
    component.totalRetries = 3;

    spyOn(console, 'error').and.callThrough();
    spyOn(component, 'postWorkflow').and.callThrough();
    component.postWorkflow();

    flush(27);

    expect(component.modalInformation).toEqual({
      title: 'Post Workflow Successfully!',
      note: 'The workflow has post successfully! Do you want to check the status of the running workflow?',
      type: 2,
      isLoading: false
    });
    expect(console.error).toHaveBeenCalledTimes(2);
    expect(component.postWorkflow).toHaveBeenCalledTimes(3);

  }));

  it('retries 2 times and then fail', fakeAsync(() => {

    server.post('/nodes/:id/workflows', () =>  new Response(501) );

    component.editor.get = () => ({});
    component.selectedNode = { id: '1d23456789' };
    component.selectedGraph = { injectableName: 'Graph.Service.Docker' };
    component.totalRetries = 3;

    spyOn(console, 'error').and.callThrough();
    spyOn(component, 'postWorkflow').and.callThrough();
    component.postWorkflow();

    flush(36);

    expect(component.showModal).toBeFalsy();
    expect(console.error).toHaveBeenCalledTimes(4);
    expect(component.postWorkflow).toHaveBeenCalledTimes(4);

  }));
});
