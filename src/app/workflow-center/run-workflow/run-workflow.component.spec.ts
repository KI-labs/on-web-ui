import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core'

import { RackhdLocalStorage } from '../../utils/globals-util'

import { RunWorkflowComponent } from './run-workflow.component';
import { InventoryModule } from '../../inventory/inventory.module';
import { RackhdCommonServicesModule } from '../../services/rackhd/rackhd.module'
import { SharedServicesModule } from '../../services/sharedServices.module';
import { AppModule } from '../../../app/app.module'

import { standardConfig } from '../../../miragejs/server.js'
import { Server, Response } from 'miragejs'


function makeTestServer() {

  return new Server({
    environment: 'test',

    ...standardConfig,

    timing: 0,
    urlPrefix: "http://0.0.0.0",
    namespace: "/api/2.0",

  });
}

describe('RunWorkflowComponent', () => {
  let component: RunWorkflowComponent;
  let fixture: ComponentFixture<RunWorkflowComponent>;
  let server: any;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [SharedServicesModule, RackhdCommonServicesModule, AppModule],
      declarations: [RunWorkflowComponent],
      schemas: [NO_ERRORS_SCHEMA]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    server = makeTestServer();

    fixture = TestBed.createComponent(RunWorkflowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  })

  it('retries 2 times and then success', async (done: DoneFn) => {

    let counter = 1;

    server.post('/nodes/:id/workflows', (schema, request) => {
      if (counter === 3) {
        return {
          "injectableName": "Graph.Service.Docker",
          "instanceId": "a44e7b50-5bd9-40f2-b9a1-8ee5e6faeaa0"
        }
      } else {
        counter = counter + 1;
        return new Response(501);
      }

    });

    window.localStorage.getItem = () => {
      return '0.0.0.0/api/2.0';
    }

    component.editor.get = () => ({});
    component.selectedNode = { id: '1d23456789' };
    component.selectedGraph = { injectableName: 'Graph.Service.Docker' };
    component.totalRetries = 3;
    const postWorkflowSpied = spyOn(component, 'postWorkflow').and.callThrough().bind(component)
    postWorkflowSpied()


   


    if (counter === 1) {
      console.log('1',component.modalInformation.isLoading)
      console.log('1',component.retries)
      expect(component.modalInformation.isLoading).toBeTruthy()
      expect(component.retries).toBe(2)
    } else if (counter === 2) {
      console.log('2',component.modalInformation.isLoading)
      console.log('2',component.retries)
      expect(component.modalInformation.isLoading).toBeTruthy()
      expect(component.retries).toBe(1)
    } else if (counter === 3) {
      console.log('3',component.modalInformation)
      expect(component.modalInformation).toEqual({
        title: 'Post Workflow Successfully!',
        note: 'The workflow has post successfully! Do you want to check the status of the running workflow?',
        type: 2,
        isLoading: false
      });
    }

    
    expect(component.postWorkflow).toHaveBeenCalledTimes(3)
    
    done();
    console.log('end')

  });
});
