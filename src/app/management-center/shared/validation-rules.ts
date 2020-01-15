import { FormControl } from '@angular/forms';

import { isJsonTextValid } from '../../utils/inventory-operator';


export function validateJSON(c: FormControl) {
    if (c.value === '') { return null; }
    return isJsonTextValid(c.value) ? null : {
        validateJSON: {
            valid: false
        }
    };
}
