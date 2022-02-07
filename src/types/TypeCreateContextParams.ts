import { request } from 'dk-request';

export type TypeCreateContextParams = {
  api: any;
  request: typeof request;
  staticStores: any;
  globalActions: any;
  apiValidators: any;
};
