import { autorun, runInAction } from 'mobx';

import { TypeActionLog } from './types/TypeActionLog';
import { TypeGlobalsAny } from './types/TypeGlobalsAny';

export function getActionsFinished({
  globals,
  isClient,
  enableLogs,
  actionsLogs,
  routerStore,
}: {
  globals: TypeGlobalsAny;
  isClient: boolean;
  enableLogs: boolean;
  actionsLogs: Array<Array<TypeActionLog>>;
  routerStore: any;
}) {
  const { actions, api } = globals;

  /**
   * Frontend does not need to track actions and detect it's completion
   * unless logs are enabled
   *
   */

  const noTracking = isClient && !enableLogs;

  if (noTracking) return;

  let firstAutorunPassed = false;

  autorun(() => {
    const actionsFirstCompleted = routerStore.actionsFirstCompleted;

    if (actionsFirstCompleted && !isClient) return;

    /**
     * Actions are extendable, so have to loop every time
     *
     */

    let someActionIsExecuting = false;

    // eslint-disable-next-line guard-for-in
    for (const actionGroupName in actions) {
      let actionGroup = actions[actionGroupName];

      const isModular = Object.values(actionGroup).some(
        (groupOrFunction) => typeof groupOrFunction !== 'function'
      );

      if (isModular) {
        actionGroup = Object.entries(actionGroup).reduce((acc, [group, groupActions]) => {
          Object.entries(groupActions).forEach(([actionName, actionFn]) => {
            acc[`${group}-${actionName}`] = actionFn;
          });

          return acc;
        }, {} as Record<string, any>);
      }
      // eslint-disable-next-line guard-for-in
      for (const actionName in actionGroup) {
        const actionFn = actionGroup[actionName];

        if (actionFn.state.isExecuting) {
          someActionIsExecuting = true;
          break;
        }
      }
    }

    /**
     * At first actions are executed in two ways:
     * - before rendering of React app to collect some useful data
     * - in componentWillMount lifecycle
     *
     * This actionsFirstCompleted param means that React app was already rendered and all async
     * logic in componentWillMount has been completed=
     *
     */

    if (!firstAutorunPassed) {
      firstAutorunPassed = true;

      return;
    }

    if (!someActionIsExecuting && !actionsFirstCompleted) {
      runInAction(() => (routerStore.actionsFirstCompleted = true));
    }

    if (enableLogs) {
      const currentRouteName = routerStore.currentRoute?.name || 'INITIAL';

      const lastItem = routerStore.lastActionsLog;

      const executingOrFinishedApi: Array<{ type: 'API'; actionFn: any; routeName: string }> = [];
      const executingOrFinishedActions: Array<{
        type: 'ACTION';
        actionFn: any;
        routeName: string;
      }> = [];

      // eslint-disable-next-line guard-for-in
      for (const actionGroupName in actions) {
        let actionGroup = actions[actionGroupName];

        const isModular = Object.values(actionGroup).some(
          (groupOrFunction) => typeof groupOrFunction !== 'function'
        );

        if (isModular) {
          actionGroup = Object.entries(actionGroup).reduce((acc, [group, groupActions]) => {
            Object.entries(groupActions).forEach(([actionName, actionFn]) => {
              acc[`${group}-${actionName}`] = actionFn;
            });

            return acc;
          }, {} as Record<string, any>);
        }

        // eslint-disable-next-line guard-for-in
        for (const actionName in actionGroup) {
          const actionFn = actionGroup[actionName];

          // @ts-ignore
          if (actionFn.state.isExecuting || lastItem?.find(({ name }) => actionFn.name === name))
            executingOrFinishedActions.push({
              actionFn,
              type: 'ACTION',
              routeName: currentRouteName,
            });
        }
      }

      // eslint-disable-next-line guard-for-in
      for (const apiName in api) {
        const actionFn = api[apiName];

        // @ts-ignore
        if (
          actionFn.state.isExecuting ||
          lastItem?.find(({ name }: any) => name === `API ${actionFn.name}`)
        ) {
          executingOrFinishedApi.push({ actionFn, type: 'API', routeName: currentRouteName });
        }
      }

      const logItemActions = executingOrFinishedActions
        .filter(({ actionFn }) => {
          // If action has not finished, include
          if (!actionFn.state.executionTime) return true;

          const actionIndex = lastItem?.findIndex(({ name }: any) => name === actionFn.name);

          /**
           * If action has finished, update previous column with it's execution time
           *
           */

          runInAction(() => {
            lastItem[actionIndex].executionTime = actionFn.state.executionTime;
          });

          return false;
        })
        .sort((a, b) => a.actionFn.state.timeStart - b.actionFn.state.timeStart)
        .map(({ actionFn, type, routeName }) => ({ name: actionFn.name, type, routeName }));

      const logItemApi = executingOrFinishedApi
        .filter(({ actionFn }) => {
          // If action has not finished, include
          if (!actionFn.state.executionTime) return true;

          const actionIndex = lastItem?.findIndex(
            ({ name }: any) => name === `API ${actionFn.name}`
          );

          /**
           * If action has finished, update previous column with it's execution time
           *
           */

          runInAction(() => {
            lastItem[actionIndex].executionTime = actionFn.state.executionTime;
          });

          return false;
        })
        .sort((a, b) => a.actionFn.state.timeStart - b.actionFn.state.timeStart)
        .map(({ actionFn, type, routeName }) => ({
          name: `API ${actionFn.name}`,
          type,
          routeName,
        }));

      const finalItem = [...logItemActions, ...logItemApi];

      if (finalItem.length > 0 && JSON.stringify(lastItem) !== JSON.stringify(finalItem)) {
        runInAction(() => actionsLogs.push(finalItem));
      }
    }
  });
}
