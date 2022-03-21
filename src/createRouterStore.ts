import { TypeActionLog } from './types/TypeActionLog';
import { findRouteByPathname } from './utils/findRouteByPathname';
import { TypeRoutesGenerator } from './types/TypeRoutesGenerator';

export function createRouterStore<TRoutes extends TypeRoutesGenerator<any>>({
  routes,
}: {
  routes: TRoutes;
}) {
  return class StoreRouter {
    actionsLogs: Array<Array<TypeActionLog>> = [];
    actionsFirstCompleted = false;

    routesHistory: Array<string> = [];
    // @ts-ignore
    currentRoute: Omit<TRoutes[keyof TRoutes], 'loader' | 'component'> = {};

    get lastActionsLog() {
      return this.actionsLogs[this.actionsLogs.length - 1];
    }

    get previousRoutePathname() {
      return this.routesHistory[this.routesHistory.length - 2];
    }

    get previousRoute() {
      if (!this.previousRoutePathname) return null;

      return findRouteByPathname({ pathname: this.previousRoutePathname, routes });
    }
  };
}
