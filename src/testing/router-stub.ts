import { Component, Directive, Injectable, Input } from '@angular/core';
import { NavigationExtras } from '@angular/router';

@Directive({
  selector: '[routerLink]',
  host: {
    '(click)': 'onClick()'
  }
})
export class RouterLinkStubDirective {
  @Input('routerLink') public linkParams: any;
  public navigatedTo: any = null;

  public onClick() {
    this.navigatedTo = this.linkParams;
  }
}

@Component({selector: 'router-outlet', template: ''})
export class RouterOutletStubComponent { }

@Injectable()
export class RouterStub {
  public navigate(commands: any[], extras?: NavigationExtras) { }
}

// Only implements params and part of snapshot.paramMap
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { convertToParamMap, ParamMap } from '@angular/router';

/*
 *  Stub Test Class for ActivatedRoute
 *
 *  Usage:
 *  1. define var:
 *     let x : ActivatedRouteStub;
 *  2. useValue in providers:
 *    { provide: ActivatedRoute, useValue: x }
 *  3. Before component created. by TestBed.createComponent(),
 *     initialize the var x:
 *    x = new ActivatedRouteStub();
 *    x.testParams = { id: '123' };
 *
 */

@Injectable()
export class ActivatedRouteStub {
    get testParams() { return this._testParams; }
    set testParams(params: {}) {
        this._testParams = params;
        this.subject.next(params);
    }

    // ActivatedRoute.snapshot.params
    get snapshot() {
        return { params: this.testParams };
    }
    public params = this.subject.asObservable();
    // ActivatedRoute.params is Observable
    private subject = new BehaviorSubject(this.testParams);

    // Test parameters
    private _testParams: {};

}
