// eslint-disable-next-line no-restricted-imports
import get from 'lodash/get';
// eslint-disable-next-line no-restricted-imports
import find from 'lodash/find';

import { TypeRoutesGenerator } from '../types/TypeRoutesGenerator';

import { constants } from './constants';
import { isDynamic } from './isDynamic';
import { clearDynamic } from './clearDynamic';

export function findRoute<TRoutes extends TypeRoutesGenerator<any>>(params: {
  routes: TRoutes;
  pathname: string;
}): TRoutes[keyof TRoutes] | undefined {
  const { routes, pathname } = params;

  const pathnameArray = pathname.split(constants.pathPartSeparator).filter(Boolean);

  return find(routes, ({ path, validators }) => {
    const routePathnameArray = path.split(constants.pathPartSeparator).filter(Boolean);

    if (routePathnameArray.length !== pathnameArray.length) return false;

    /**
     * Dynamic params must have functional validators
     *
     */

    for (let i = 0; i < routePathnameArray.length; i++) {
      const paramName = routePathnameArray[i];
      const paramNameFromUrl = pathnameArray[i];

      // Static params must match
      if (!isDynamic(paramName)) {
        if (paramName !== paramNameFromUrl) return false;
      } else {
        const validator = get(validators, clearDynamic(paramName));

        if (typeof validator !== 'function') {
          throw new Error(`findRoute: missing validator for param "${paramName}"`);
        }

        // Dynamic params must match validator
        if (!validator(paramNameFromUrl)) return false;
      }
    }

    return true;
  });
}
