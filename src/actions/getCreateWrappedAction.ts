import { TypeActionAny } from '../types/TypeActionAny';
import { TypeGlobalsAny } from '../types/TypeGlobalsAny';
import { TypeActionWrapped } from '../types/TypeActionWrapped';

import { wrapAction } from './wrapAction';
import { errorActionCanceledName } from './errorActionCanceledName';

export function getCreateWrappedAction(
  globals: TypeGlobalsAny,
  fn: TypeActionAny
): TypeActionWrapped {
  return wrapAction({
    fn: fn.bind(null, globals),
    name: fn.name,
    onError: (error) => {
      if (error.name !== errorActionCanceledName) {
        console.error(`Error happened in action ${fn.name}`, error);
      }
    },
  });
}
