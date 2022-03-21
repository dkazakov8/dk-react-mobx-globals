import { TypeRoutesGenerator } from '../types/TypeRoutesGenerator';

import { findRoute } from './findRoute';
import { constants } from './constants';

function getDynamicRoutes<TRoutes extends TypeRoutesGenerator<any>>(routes: TRoutes): TRoutes {
  return Object.keys(routes)
    .filter((key) => routes[key].path.includes(constants.dynamicSeparator))
    .reduce((acc, key) => ({ ...acc, [key]: routes[key] }), {} as typeof routes);
}

function getStaticRoutes<TRoutes extends TypeRoutesGenerator<any>>(routes: TRoutes): TRoutes {
  return Object.keys(routes)
    .filter((key) => !routes[key].path.includes(constants.dynamicSeparator))
    .reduce((acc, key) => ({ ...acc, [key]: routes[key] }), {} as typeof routes);
}

export function findRouteByPathname<TRoutes extends TypeRoutesGenerator<any>>({
  pathname,
  routes,
}: {
  pathname: string;
  routes: TRoutes;
}): TRoutes[keyof TRoutes] | undefined {
  /**
   * route /test/edit should take precedence over /test/:someParam
   *
   */

  return (
    findRoute({ routes: getStaticRoutes(routes), pathname }) ||
    findRoute({ routes: getDynamicRoutes(routes), pathname })
  );
}
