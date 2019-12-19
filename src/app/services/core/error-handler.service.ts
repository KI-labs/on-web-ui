import {HttpErrorResponse} from '@angular/common/http';
import {catchError} from 'rxjs/operators';
import {GlobalAlertService} from './global-alert.service';
import {Injectable} from '@angular/core';
import { throwError } from 'rxjs';
@Injectable()
export class ErrorHandlerService {

  constructor(
    public globalAlertService: GlobalAlertService
  ) {}

  handleError(error: HttpErrorResponse) {
    if (error instanceof  ErrorEvent) {
      // return a common client side error
      console.error('An error occurred:', error.message);
      return throwError(new Error('common error' + error.message));
    } else {
      // if the backend return the unsuccessful code
      console.error( `Backend returned code ${error.status}, ` +
        `body was: ${error.status}`);
      if (+error.status === 0) {
        this.globalAlertService.putAlertMsg(
          'Can\'t access RackHD services, please confirm if configurations are correct.',
          'bar'
        );
      } else {
        this.globalAlertService.putAlertMsg(error.message);
      }
    }

    return throwError(new Error('backend error'));
  }
}

export function  ErrorHanlder() {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value; // save a reference to the original method
    const  newMethod = {
        value(...args: any[]) {
           const result = originalMethod.apply(this, args)
             .pipe(
                catchError(error => this.errorHandlerService.handleError(error))
             );
           return result;
        }
     };
    return newMethod;
  };
}
