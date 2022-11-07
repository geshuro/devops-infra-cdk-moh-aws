import * as H from 'history';
import { AppContext } from '../app-context/app-context';

export type RouteRegistrationMethod = (
  routes: RouteMap,
  ctx: { location: H.Location; appContext?: AppContext },
) => RouteMap;

export type DefaultRouteLocatorMethod = (ctx: { location: H.Location; appContext?: AppContext }) => H.Location;

export type RouteRegistrationPlugin = {
  registerRoutes: RouteRegistrationMethod;
};

export type DefaultRouteLocatorPlugin = {
  getDefaultRouteLocation: DefaultRouteLocatorMethod;
};

export type RouteMap = Map<string, RouteTarget>;

export type RouteTarget = any; // TODO

export type RouteEntry = { path: string; page: React.ComponentType };
