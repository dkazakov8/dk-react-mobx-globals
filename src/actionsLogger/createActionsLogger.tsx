/* eslint-disable react/jsx-no-literals */
import { observer } from 'mobx-react';
import { observable, runInAction } from 'mobx';
import { Component, ComponentClass } from 'react';

import { TypeActionLog } from '../types/TypeActionLog';

const STYLE_PREFIX = 'ActionsLogger_';

export function createActionsLogger(): ComponentClass<{
  actionsLogs: Array<Array<TypeActionLog>>;
}> {
  const COLOR_FADER = 10;

  @observer
  class ActionsLoggerColumnItem extends Component<{ text: string; background: string }> {
    render() {
      const { text, background } = this.props;

      return (
        <div className={`${STYLE_PREFIX}child`} style={{ background }}>
          <span>{text}</span>
        </div>
      );
    }
  }

  @observer
  class ActionsLoggerColumn extends Component<{
    logItem: Array<TypeActionLog> | null;
  }> {
    render() {
      const { logItem } = this.props;

      if (!logItem) return null;

      const logsActions = logItem.filter(({ type }) => type === 'ACTION');
      const logsApi = logItem.filter(({ type }) => type === 'API');

      const childrenFinished = logsActions.filter(({ executionTime }) => executionTime != null);
      const childrenExecuting = logsActions.filter(({ executionTime }) => executionTime == null);

      const childrenFinishedApi = logsApi.filter(({ executionTime }) => executionTime != null);
      const childrenExecutingApi = logsApi.filter(({ executionTime }) => executionTime == null);

      return (
        <>
          {childrenFinished.map(({ name, executionTime }, childIndex) => (
            <ActionsLoggerColumnItem
              key={childIndex}
              text={executionTime ? `${name} (${executionTime}ms)` : name}
              background={`rgba(120, 14, 0, ${(childIndex + 1) / COLOR_FADER})`}
            />
          ))}
          {childrenExecuting.map(({ name, executionTime }, childIndex) => (
            <ActionsLoggerColumnItem
              key={childIndex}
              text={executionTime ? `${name} (${executionTime}ms)` : name}
              background={`rgba(31, 93, 25, ${(childIndex + 1) / COLOR_FADER})`}
            />
          ))}
          {childrenFinishedApi.map(({ name, executionTime }, childIndex) => (
            <ActionsLoggerColumnItem
              key={childIndex}
              text={executionTime ? `${name} (${executionTime}ms)` : name}
              background={`rgba(130, 74, 0, ${(childIndex + 1) / COLOR_FADER})`}
            />
          ))}
          {childrenExecutingApi.map(({ name, executionTime }, childIndex) => (
            <ActionsLoggerColumnItem
              key={childIndex}
              text={executionTime ? `${name} (${executionTime}ms)` : name}
              background={`rgba(5, 76, 158, ${(childIndex + 1) / COLOR_FADER})`}
            />
          ))}
        </>
      );
    }
  }

  @observer
  class ActionsLogger extends Component<{ actionsLogs: Array<Array<TypeActionLog>> }> {
    localState: { highlightedLog: Array<TypeActionLog> } = observable({
      highlightedLog: [],
    });

    handleClearData = () => {
      const { actionsLogs } = this.props;

      runInAction(() => {
        actionsLogs.splice(0, actionsLogs.length);
        this.localState.highlightedLog = [];
      });
    };

    handleSetHighlightedLogIndex = (highlightedLog: Array<TypeActionLog>) => () => {
      runInAction(() => (this.localState.highlightedLog = highlightedLog));
    };

    render() {
      const { actionsLogs } = this.props;

      const groupsByRoute = actionsLogs.reduce((acc, items) => {
        const routeName = items[0].routeName;
        if (!acc[routeName]) acc[routeName] = [items];
        else acc[routeName].push(items);

        return acc;
      }, {} as Record<string, Array<Array<TypeActionLog>>>);

      return (
        <div className={`${STYLE_PREFIX}wrapper`}>
          {this.localState.highlightedLog.length > 0 && (
            <div className={`${STYLE_PREFIX}bar`}>
              <ActionsLoggerColumn logItem={this.localState.highlightedLog} />
            </div>
          )}
          <div className={`${STYLE_PREFIX}clear`} onClick={this.handleClearData}>
            Clear
          </div>
          {Object.entries(groupsByRoute).map(([routeName, logs], groupIndex) => {
            return (
              <div className={`${STYLE_PREFIX}group`} key={groupIndex}>
                <div className={`${STYLE_PREFIX}groupItems`}>
                  {logs.map((actionLog, index) => (
                    <div
                      key={index}
                      className={`${STYLE_PREFIX}item`}
                      onMouseEnter={this.handleSetHighlightedLogIndex(actionLog)}
                    >
                      <ActionsLoggerColumn logItem={actionLog} />
                    </div>
                  ))}
                </div>
                <div className={`${STYLE_PREFIX}groupTitle`}>{routeName}</div>
              </div>
            );
          })}
        </div>
      );
    }
  }

  return ActionsLogger;
}
