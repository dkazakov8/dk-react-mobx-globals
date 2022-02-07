import { action, observable, runInAction } from 'mobx';

import { TypeActionBound } from '../types/TypeActionBound';
import { TypeActionWrapped } from '../types/TypeActionWrapped';

import { afterExecution } from './afterExecution';
import { beforeExecution } from './beforeExecution';
import { defaultActionData } from './defaultActionData';

export const wrapAction = (params: {
  fn: TypeActionBound;
  name: string;
  onError: (error: any) => void;
}): TypeActionWrapped => {
  const fnAction = action(params.fn);
  const afterExecutionBound = afterExecution.bind(null, wrappedAction);
  const beforeExecutionBound = beforeExecution.bind(null, wrappedAction);

  function wrappedAction(arg: any) {
    try {
      beforeExecutionBound();

      return fnAction(arg)
        .then(afterExecutionBound)
        .catch((error) => {
          afterExecutionBound(null);

          runInAction(() => ((wrappedAction as TypeActionWrapped).state.error = error.message));

          return Promise.reject(error);
        });
    } catch (error: any) {
      afterExecutionBound(null);

      runInAction(() => ((wrappedAction as TypeActionWrapped).state.error = error.message));

      params.onError(error);

      return Promise.reject(error);
    }
  }

  Object.assign(wrappedAction, observable(defaultActionData));

  Object.defineProperty(wrappedAction, 'name', { value: params.name, writable: false });

  return wrappedAction as TypeActionWrapped;
};
