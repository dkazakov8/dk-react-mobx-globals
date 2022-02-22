/* eslint-disable no-restricted-imports */

import isArray from 'lodash/isArray';
import isString from 'lodash/isString';
import unescape from 'lodash/unescape';
import mapValues from 'lodash/mapValues';
import isPlainObject from 'lodash/isPlainObject';

export function unescapeAllStrings(item: Record<string, any> | string | Array<string>): any {
  if (isPlainObject(item)) {
    return mapValues(item as Record<string, any>, unescapeAllStrings);
  } else if (isString(item)) {
    return unescape(item as string);
  } else if (isArray(item)) {
    return (item as Array<string>).map(unescapeAllStrings);
  }

  return item;
}
