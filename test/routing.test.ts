import { expect } from 'chai';

import { getDynamicValues } from '../src/utils/getDynamicValues';
import { findRouteByPathname } from '../src/utils/findRouteByPathname';
import { replaceDynamicValues } from '../src/utils/replaceDynamicValues';
import { TypeRoutesGenerator } from '../src/types/TypeRoutesGenerator';

const routesObject = {
  dynamicRoute: {
    name: 'dynamicRoute',
    path: '/test/:param',
    validators: {
      param: (value: string) => value.length > 2,
    },
    params: { param: '1' } as { param: string },
    loader: undefined,
  },
  staticRoute: {
    name: 'staticRoute',
    path: '/test/static',
    params: {},
    loader: undefined,
  },
  dynamicRouteNoValidators: {
    name: 'dynamicRoute',
    path: '/test2/:param',
    params: { param: '1' } as { param: string },
    loader: undefined,
  },
};

export const routes = routesObject as TypeRoutesGenerator<typeof routesObject>;

describe('findRouteByPathname', () => {
  it('Get correct static route by path', () => {
    const route = findRouteByPathname({ routes, pathname: '/test/static' });

    expect(route).to.deep.eq(routes.staticRoute);
  });

  it('Get correct dynamic route by path', () => {
    const route = findRouteByPathname({
      routes,
      pathname: '/test/dynamic',
    });

    expect(route).to.deep.eq(routes.dynamicRoute);
  });

  it('Pass empty param to dynamic route (no route found)', () => {
    const route = findRouteByPathname({
      routes,
      pathname: '/test/',
    });

    // eslint-disable-next-line no-unused-expressions
    expect(route).to.be.undefined;
  });

  it('Pass invalid pathname (no route found)', () => {
    const route = findRouteByPathname({
      routes,
      pathname: '/wrongpath',
    });

    // eslint-disable-next-line no-unused-expressions
    expect(route).to.be.undefined;
  });

  it('Param not passed validator (no route found)', () => {
    const route = findRouteByPathname({
      routes,
      pathname: '/test/p',
    });

    // eslint-disable-next-line no-unused-expressions
    expect(route).to.be.undefined;
  });

  it('(error) No validators', () => {
    expect(() =>
      findRouteByPathname({
        routes,
        pathname: '/test2/param',
      })
    ).to.throw('findRoute: missing validator for param ":param"');
  });
});

describe('replaceDynamicValues', () => {
  it('Dynamic params test', () => {
    const pathname = replaceDynamicValues({
      routesObject: routes.dynamicRoute,
      params: { param: 'dynamic' },
    });

    expect(pathname).to.be.eq('/test/dynamic');
  });

  it('(error) No dynamic param value', () => {
    expect(() => {
      replaceDynamicValues({
        routesObject: routes.dynamicRoute,
        // @ts-ignore
        params: {},
      });
    }).to.throw(`replaceDynamicValues: no param ":param" passed for route dynamicRoute`);
  });
});

describe('getDynamicValues', () => {
  it('Should return params from pathname', () => {
    const params = getDynamicValues({
      routesObject: routes.dynamicRoute,
      pathname: '/test/dynamic',
    });

    expect(params).to.deep.equal({ param: 'dynamic' });
  });

  it('Should return empty params', () => {
    const params = getDynamicValues({
      routesObject: routes.staticRoute,
      pathname: '/test/static',
    });

    // eslint-disable-next-line no-unused-expressions
    expect(params).to.be.empty;
  });
});
