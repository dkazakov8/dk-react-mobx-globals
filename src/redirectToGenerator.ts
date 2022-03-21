import _ from 'lodash';
import { runInAction } from 'mobx';
import { ComponentClass } from 'react';
import { createBrowserHistory } from 'history';

import { TypeGlobalsAny } from './types/TypeGlobalsAny';
import { TypeActionWrapped } from './types/TypeActionWrapped';
import { TypeRoutesGenerator } from './types/TypeRoutesGenerator';
import { TypeRedirectToParams } from './types/TypeRedirectToParams';
import { getDynamicValues } from './utils/getDynamicValues';
import { findRouteByPathname } from './utils/findRouteByPathname';
import { replaceDynamicValues } from './utils/replaceDynamicValues';

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
}: TypeParamsGenerator<TRoutes>): (params: TypeRedirectToParams<TRoutes>) => Promise<void> {
  return ({ route, params = {}, noHistoryPush }) => {
    const pathname = history.location.pathname;

    /**
     * IS_SERVER ? This is initial call from server, we should extract url from req
     * IS_CLIENT ? This is expected to be browser's back/forward event, we should extract url from location
     *
     */

    if (!route) {
      const nextRoute = findRouteByPathname({ pathname, routes });

      if (!nextRoute) {
        return redirectTo({
          route: routeError404,
          noHistoryPush,
        });
      }

      /**
       * Extract params from pathname & redirect with all necessary data
       *
       */

      const nextParams = getDynamicValues({ routesObject: nextRoute, pathname });

      return redirectTo({
        route: nextRoute,
        params: nextParams,
        noHistoryPush,
      });
    }

    const prevRoute = routerStore.currentRoute ? routes[routerStore.currentRoute.name] : null;
    const prevPathname = prevRoute
      ? replaceDynamicValues({ routesObject: prevRoute, params: prevRoute.params })
      : null;
    const nextPathname = replaceDynamicValues({ routesObject: route, params });
    const nextParams = getDynamicValues({ routesObject: route, pathname: nextPathname });

    // Prevent redirect to the same route
    if (isClient && prevPathname === nextPathname) return Promise.resolve();

    return Promise.resolve()
      .then(() => (prevRoute?.beforeLeave || _.stubTrue)(globals, route))
      .then(() => (route.beforeEnter || _.stubTrue)(globals))
      .then((redirectParams?: TypeRedirectToParams<TRoutes>) => {
        if (typeof redirectParams === 'object') return redirectTo(redirectParams);

        runInAction(() => {
          /**
           * Optimistically update currentRoute and synchronize it with browser's URL field
           *
           * except 500 error - it should be drawn without URL change,
           * so user could fix pathname or refresh the page and maybe get successful result
           *
           */

          routerStore.currentRoute = { name: route.name, path: route.path, params: nextParams };

          const lastPathname = routerStore.routesHistory[routerStore.routesHistory.length - 1];

          if (lastPathname !== nextPathname) routerStore.routesHistory.push(nextPathname);

          if (history && !noHistoryPush) history.push(nextPathname);
        });

        return Promise.resolve();
      })
      .then(() => {
        const currentRouteName = routerStore.currentRoute.name;
        const componentConfig = routes[currentRouteName];

        if (!componentConfig.component) {
          return componentConfig
            .loader()
            .then(
              (module: { default: ComponentClass }) => (componentConfig.component = module.default)
            )
            .then(() => undefined);
        }

        return Promise.resolve();
      })
      .catch((error) => {
        // For preventing redirects in beforeLeave
        if (error?.name === 'SILENT') return;

        /**
         * Log error happened in beforeEnter | beforeLeave and draw error500 page
         * without changing URL
         *
         */
        console.error(error);

        const nextRoute = routeError500;

        runInAction(() => {
          routerStore.currentRoute = { name: nextRoute.name, path: nextRoute.path, params: {} };
        });
      });
  };
}
