/* eslint-disable no-restricted-imports */

import isPlainObject from 'lodash/isPlainObject';
import { observable, runInAction } from 'mobx';

export function mergeObservableDeep(target: Record<string, any>, source: Record<string, any>) {
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (isPlainObject(source[key])) {
        if (!target[key]) {
          runInAction(() => (target[key] = observable({})));
        }

        mergeObservableDeep(target[key] as Record<string, any>, source[key] as Record<string, any>);
      } else {
        runInAction(() => (target[key] = source[key]));
      }
    }
  }

  return target;
}
