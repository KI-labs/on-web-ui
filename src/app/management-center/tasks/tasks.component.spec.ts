import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomTaskComponent } from './tasks.component';

describe('CustomTaskComponent', () => {
  let component: CustomTaskComponent;
  let fixture: ComponentFixture<CustomTaskComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CustomTaskComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomTaskComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
