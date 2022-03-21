/* eslint-disable react/no-set-state, @typescript-eslint/naming-convention */

import { observer } from 'mobx-react';
import { createBrowserHistory } from 'history';
import { ReactElement, Component, ComponentClass } from 'react';
import { runInAction } from 'mobx';

import { TypeActionWrapped } from './types/TypeActionWrapped';
import { appendAutorun } from './utils/appendAutorun';
import { TypeRoutesGenerator } from './types/TypeRoutesGenerator';

const Dumb = () => null;

type PropsRouter<TRoutes extends TypeRoutesGenerator<any>> = {
  routes: TRoutes;
  history: ReturnType<typeof createBrowserHistory>;
  redirectTo: TypeActionWrapped;
  routerStore: any;

  wrapperClassName?: string;
  beforeComponentMount?: () => void;
};

export function createRouter<TRoutes extends TypeRoutesGenerator<any>>(): ComponentClass<
  PropsRouter<TRoutes>
> {
  @observer
  class RouterComponent extends Component<PropsRouter<TRoutes>> {
    state: {
      loadedComponent?: ReactElement;
      loadedComponentName?: keyof TRoutes;
    } = {
      loadedComponent: undefined,
      loadedComponentName: undefined,
    };

    componentDidMount() {
      this.redirectOnHistoryPop();
      appendAutorun(this, this.setLoadedComponent);
    }

    redirectOnHistoryPop = () => {
      if (!this.props.history) return;

      const { routerStore, redirectTo } = this.props;

      this.props.history.listen((params) => {
        if (params.action !== 'POP') return;

        if (routerStore.previousRoutePathname === params.location.pathname) {
          runInAction(() => routerStore.routesHistory.pop());
        }

        void redirectTo({ noHistoryPush: true });
      });
    };

    setLoadedComponent = () => {
      const { routerStore, routes, redirectTo, beforeComponentMount } = this.props;

      const currentRouteName = routerStore.currentRoute.name;

      if (redirectTo.state.isExecuting || this.state.loadedComponentName === currentRouteName) {
        return;
      }

      const componentConfig = routes[currentRouteName];
      const props = 'props' in componentConfig ? componentConfig.props : {};

      // trigger componentWillUnmount on previous component to clear executed actions
      this.setState({ loadedComponent: <Dumb /> }, () => {
        beforeComponentMount?.();

        const RouteComponent = componentConfig.component!;

        this.setState({
          loadedComponent: <RouteComponent {...props} />,
          loadedComponentName: currentRouteName,
        });
      });
    };

    render() {
      const { loadedComponent } = this.state;
      const { wrapperClassName } = this.props;

      return <div className={wrapperClassName}>{loadedComponent}</div>;
    }
  }

  return RouterComponent;
}
