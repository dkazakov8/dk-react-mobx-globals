import { TypeRoutesGenerator } from './TypeRoutesGenerator';

export type TypeRedirectToParams<TRoutes extends TypeRoutesGenerator<any>> = {
  route?: TRoutes[keyof TRoutes];
  params?: TRoutes[keyof TRoutes]['params'];
  noHistoryPush?: boolean;
};
