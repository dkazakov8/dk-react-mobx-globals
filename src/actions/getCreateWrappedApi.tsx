import { TypeRequestParams } from 'dk-request';

import { TypeCreateContextParams } from '../types/TypeCreateContextParams';

import { wrapAction } from './wrapAction';
import { errorActionCanceledName } from './errorActionCanceledName';

export function getCreateWrappedApi(
  {
    request,
    ...configParams
  }: Omit<TypeRequestParams, 'requestParams'> & Pick<TypeCreateContextParams, 'request'>,
  globals: any
) {
  const action = wrapAction({
    fn: (requestParams: TypeRequestParams['requestParams'] = {}) =>
      request({ ...configParams, mock: action.state.mock, requestParams }, globals),
    name: configParams.apiName,
    onError: (error) => {
      if (error.name !== errorActionCanceledName) {
        console.error(
          `Error happened in API action ${configParams.apiName}`,
          error,
          JSON.stringify(error.response?.data || {})
        );
      }
    },
  });

  return action;
}
