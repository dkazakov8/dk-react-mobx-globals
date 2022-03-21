import { TypeRouteItem } from '../types/TypeRouteItem';

import { constants } from './constants';
import { isDynamic } from './isDynamic';
import { clearDynamic } from './clearDynamic';

export function replaceDynamicValues<TRouteItem extends TypeRouteItem>(args: {
  routesObject: TRouteItem;
  params: TRouteItem['params'];
}): string {
  const { routesObject, params } = args;

  return routesObject.path
    .split(constants.pathPartSeparator)
    .map((paramName: string) => {
      if (!isDynamic(paramName)) return paramName;

      const value = params[clearDynamic(paramName)];

      if (!value) {
        throw new Error(
          `replaceDynamicValues: no param "${paramName}" passed for route ${routesObject.name}`
        );
      }

      return value;
    })
    .join(constants.pathPartSeparator);
}
