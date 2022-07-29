import { TypeGlobalsAny } from './types/TypeGlobalsAny';
import { getCreateWrappedApi } from './actions/getCreateWrappedApi';
import { getCreateWrappedAction } from './actions/getCreateWrappedAction';
import { TypeCreateContextParams } from './types/TypeCreateContextParams';

export function createContextProps<TGlobals extends TypeGlobalsAny>({
  req,
  res,
  api,
  request,
  staticStores,
  globalActions,
  apiValidators,
}: TypeCreateContextParams): TGlobals {
  class StoreRoot {
    constructor() {
      Object.entries(staticStores).forEach(
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/naming-convention
        ([storeName, StoreClass]) => (this[storeName] = new StoreClass())
      );
    }
  }

  const globals: TGlobals = {
    req,
    res,
    api: {},
    getLn: () => false,
    store: new StoreRoot(),
    actions: {},
    createWrappedAction: () => false,
  } as any;

  globals.createWrappedAction = getCreateWrappedAction.bind(null, globals);

  // eslint-disable-next-line guard-for-in
  for (const actionGroupName in globalActions) {
    if (!globals.actions[actionGroupName]) globals.actions[actionGroupName] = {};

    const actionGroup = globalActions[actionGroupName];

    // eslint-disable-next-line guard-for-in
    for (const actionName in actionGroup) {
      const action = actionGroup[actionName];

      // @ts-ignore
      globals.actions[actionGroupName][actionName] = globals.createWrappedAction(action);
    }
  }

  // eslint-disable-next-line guard-for-in
  for (const apiName in api) {
    const { url, headers, omitResponseValidation, method, disableCredentials } = api[apiName];

    globals.api[apiName] = getCreateWrappedApi(
      {
        url,
        method,
        apiName,
        request,
        headers,
        validatorRequest: apiValidators[apiName]?.TypeRequest,
        validatorResponse: apiValidators[apiName]?.TypeResponse,
        disableCredentials,
        omitResponseValidation,
      },
      globals
    );
  }

  return globals;
}
