import { TypeRouteItem } from '../types/TypeRouteItem';

import { constants } from './constants';
import { isDynamic } from './isDynamic';
import { clearDynamic } from './clearDynamic';

export function getDynamicValues<TRouteItem extends TypeRouteItem>(params: {
  routesObject: TRouteItem;
  pathname: string;
}): TRouteItem['params'] {
  const { routesObject, pathname } = params;

  const pathnameArray: Array<string> = pathname.split(constants.pathPartSeparator).filter(Boolean);
  const routePathnameArray: Array<keyof TRouteItem['params']> = routesObject.path
    .split(constants.pathPartSeparator)
    .filter(Boolean);
  const dynamicParams: TRouteItem['params'] = {};

  for (let i = 0; i < routePathnameArray.length; i++) {
    const paramNameDirty = routePathnameArray[i];

    if (!isDynamic(paramNameDirty)) continue;

    const paramName: keyof TRouteItem['params'] = clearDynamic(paramNameDirty);
    const paramValueFromUrl: any = pathnameArray[i];

    dynamicParams[paramName] = paramValueFromUrl;
  }

  return dynamicParams;
}
