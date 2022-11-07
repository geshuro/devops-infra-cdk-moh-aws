import * as H from 'history';
import type { IconType } from 'react-icons';
import type { AppContext } from '../app-context/app-context';

export type MenuItem = {
  url: string;
  icon: IconType;
  title: string;
  shouldShow: ShouldShow;
  body?: JSX.Element;
};

type ShouldShow = boolean | (() => boolean);

export const shouldShow = (item: MenuItem): boolean =>
  typeof item.shouldShow === 'function' ? item.shouldShow() : item.shouldShow;

export type MenuMap = Map<string, Omit<MenuItem, 'url'>>;

export type MenuRegistrationFunction = (
  items: MenuMap,
  ctx: { location: H.Location; appContext: AppContext },
) => MenuMap;

export type MenuRegistrationPlugin = {
  registerMenuItems: MenuRegistrationFunction;
};
