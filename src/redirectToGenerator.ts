import { runInAction } from 'mobx';
import { createBrowserHistory } from 'history';

import { TypeGlobalsAny } from './types/TypeGlobalsAny';
import { TypeActionWrapped } from './types/TypeActionWrapped';
import { TypeRoutesGenerator } from './types/TypeRoutesGenerator';
import { TypeRedirectToParams } from './types/TypeRedirectToParams';
import { getDynamicValues } from './utils/getDynamicValues';
import { setResponseStatus } from './utils/setResponseStatus';
import { findRouteByPathname } from './utils/findRouteByPathname';
import { replaceDynamicValues } from './utils/replaceDynamicValues';
import { loadComponentToConfig } from './utils/loadComponentToConfig';

type TypeParamsGenerator<TRoutes extends TypeRoutesGenerator<any>> = {
  routes: TRoutes;
  history: ReturnType<typeof createBrowserHistory>;
  globals: TypeGlobalsAny;
  isClient: boolean;
  redirectTo: TypeActionWrapped;
  routerStore: any;
  routeError404: TRoutes[keyof TRoutes];
  routeError500: TRoutes[keyof TRoutes];
};

export function redirectToGenerator<TRoutes extends TypeRoutesGenerator<any>>({
  routes,
  globals,
  history,
  isClient,
  redirectTo,
  routerStore,
  routeError404,
  routeError500,
}: TypeParamsGenerator<TRoutes>): (redirectParams: TypeRedirectToParams<TRoutes>) => Promise<void> {
  return ({ route, params = {}, noHistoryPush, pathname }) => {
    if (!route) {
      if (!pathname) throw new Error('redirectToGenerator: pathname should exist when no route');

      const nextRoute = findRouteByPathname({ pathname, routes }) || routeError404;

      return redirectTo({
        route: nextRoute,
        params: getDynamicValues({ routesObject: nextRoute, pathname }),
        noHistoryPush,
      });
    }

    const currentRouteConfig = routes[routerStore.currentRoute?.name];
    const prevPathname = currentRouteConfig
      ? replaceDynamicValues({
          routesObject: currentRouteConfig,
          params: currentRouteConfig.params,
        })
      : null;
    const nextPathname = replaceDynamicValues({ routesObject: route, params });
    const nextParams = getDynamicValues({ routesObject: route, pathname: nextPathname });

    // Prevent redirect to the same route
    if (isClient && prevPathname === nextPathname) {
      return loadComponentToConfig({ componentConfig: routes[routerStore.currentRoute.name] });
    }

    return Promise.resolve()
      .then(() => setResponseStatus({ res: globals.res, routes, route, isClient }))
      .then(() => currentRouteConfig?.beforeLeave?.(globals, route))
      .then(() => route.beforeEnter?.(globals))
      .then((redirectParams?: TypeRedirectToParams<TRoutes>) => {
        if (typeof redirectParams === 'object') {
          const err = new Error(
            replaceDynamicValues({
              params: redirectParams.params || {},
              routesObject: redirectParams.route!,
            })
          );

          err.name = 'REDIRECT';

          // @ts-ignore
          if (isClient) err.data = redirectParams;

          return Promise.reject(err);
        }

        runInAction(() => {
          /**
           * Optimistically update currentRoute and synchronize it with browser's URL field
           *
           * except 500 error - it should be drawn without URL change,
           * so user could fix pathname or refresh the page and maybe get successful result
           *
           */

          routerStore.currentRoute = {
            name: route.name,
            path: route.path,
            params: nextParams,
            beforeLeave: route.beforeLeave,
            beforeEnter: route.beforeEnter,
          };

          const lastPathname = routerStore.routesHistory[routerStore.routesHistory.length - 1];

          if (lastPathname !== nextPathname) routerStore.routesHistory.push(nextPathname);

          if (history && !noHistoryPush) history.push(nextPathname);
        });

        return Promise.resolve();
      })
      .then(() =>
        isClient
          ? loadComponentToConfig({ componentConfig: routes[routerStore.currentRoute.name] })
          : undefined
      )
      .catch((error) => {
        // For preventing redirects in beforeLeave
        if (error?.name === 'SILENT') return Promise.resolve();

        if (isClient && error.data) {
          return redirectTo(error.data);
        }

        /**
         * Log error happened in beforeEnter | beforeLeave and draw error500 page
         * without changing URL
         *
         */

        if (error.name === 'REDIRECT') throw error;

        console.error(error);

        runInAction(() => {
          routerStore.currentRoute = {
            name: routeError500.name,
            path: routeError500.path,
            params: {},
          };
        });

        return Promise.resolve();
      });
  };
}
