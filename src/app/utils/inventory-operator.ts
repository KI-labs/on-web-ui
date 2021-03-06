import { ClrDatagridComparatorInterface, ClrDatagridStringFilterInterface } from '@clr/angular';
import { sortBy as sortByLodash, filter, isEmpty, map, findIndex, get, without, keys, forEach } from 'lodash-es';

export class AlphabeticalComparator<T> implements ClrDatagridComparatorInterface<T> {
    sortBy: string;
    constructor(sortBy: string) {
        this.sortBy = sortBy;
    }
    compare(a: T, b: T) {
        const sortedArray = sortByLodash([a, b], [o =>
            (JSON.stringify(o[this.sortBy]))]);
        return findIndex(sortedArray, a) - findIndex(sortedArray, b);
    }
}

export class DateComparator implements ClrDatagridComparatorInterface<Node> {
    sortBy: string;

    constructor(sortBy: string) {
      this.sortBy = sortBy;
    }

    parseTime(time) {
      if (typeof time === 'number') {
        return time;
      }
      return Date.parse(time);
    }

    compare(a: Node, b: Node) {
      return this.parseTime(a[this.sortBy]) - this.parseTime(b[this.sortBy]);
    }
}

export class ObjectFilterByKey<T> implements ClrDatagridStringFilterInterface<T> {
  private _field: string;

  constructor(field: string) {
    this._field = field;
  }

  accepts(obj: T, searchKey: string): boolean {
    let stringValue: string;
    const originValue: any = obj && get(obj, this._field);
    if (typeof originValue === 'undefined') {
      return false;
    }
    stringValue = (typeof originValue === 'object') ? JSON.stringify(originValue) : originValue.toString();
    return stringValue.toLowerCase().indexOf(searchKey) >= 0;
  }
}

export class StringOperator {
  static contain(src: string, term: string): boolean {
    if (!src) {
      return false;
    }
    if (!term) {
      return true;
    }
    return src.toLowerCase().includes(term.toLowerCase());
  }

  static search<T>(term: string, tableData: Array<T>, skipDomain: string[] = []): Array<T> {
    const searchDomain: string[] = without(keys(tableData[0]), ...skipDomain);
    return filter(tableData, data => {
      let flag = false;
      forEach(searchDomain, item => {
        const originValue: any = data && get(data, item);
        if (typeof originValue === 'undefined') {
          return true;
        }
        const stringValue = (typeof data[item] === 'object') ? JSON.stringify(originValue) : originValue.toString();
        if (this.contain(stringValue, term)) {
          flag = true;
          return false;
        }
      });
      return flag;
    });
  }
}

export function createFilters<T>(obj: any, filterKeys: string[], model: T): void {
  map(filterKeys, key => {
    const _key = key + 'Filter';
    obj[_key] = new ObjectFilterByKey<T>(key);
  });
}

export function createComparator<T>(obj: any, comparatorKeys: string[], model: T): void {
  map(comparatorKeys, key => {
    const _key = key + 'Comparator';
    obj[_key] = new AlphabeticalComparator<T>(key);
  });
}

export function isJsonTextValid(input): boolean {
  try {
    if (!isEmpty(input)) {
      JSON.parse(input);
      return true;
    } else {
      return false;
    }
  } catch (e) {
   return  false;
  }
}
