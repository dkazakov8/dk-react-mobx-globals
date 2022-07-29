import { Request, Response } from 'express';
import { request } from 'dk-request';

type TypeAddParameters<
  TFunction extends (...args: any) => any,
  TParameters extends [...args: any]
> = (...args: [...Parameters<TFunction>, ...TParameters]) => ReturnType<TFunction>;

export type TypeCreateContextParams = {
  req?: Request;
  res?: Response;
  api: any;
  request: TypeAddParameters<typeof request, [globals?: any]>;
  staticStores: any;
  globalActions: any;
  apiValidators: any;
};
