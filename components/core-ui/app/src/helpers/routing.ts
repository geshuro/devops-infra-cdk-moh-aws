import type { Location, History } from 'history';

export function createLinkWithSearch({
  location,
  pathname,
  search,
}: {
  location: Location;
  pathname: string;
  search: string;
}): Partial<Location> {
  return {
    pathname,
    search: search || location.search,
    hash: location.hash,
    state: location.state,
  };
}

export function createLink({ location, pathname }: { location: Location; pathname: string }): Partial<Location> {
  return {
    pathname,
    hash: location.hash,
    state: location.state,
  };
}

export function reload(): void {
  setTimeout(() => {
    window.location.reload();
  }, 150);
}

/**
 * A generic goto function. Pass in the history and location objects a the router returns them from `useHistory` and `useLocation`
 *
 * See below snippet as an example for using this function from within some react component
 * containing "location" and "history" props.
 *
 * const navigate = navigateFn({ location: useLocation(), history: useHistory() });
 * navigate('/some-path');
 *
 * @param props
 */
export function navigateFn(props: { history: History; location: Location }): (pathname: string) => void {
  return (pathname: string) => {
    const link = createLink({ location: props.location, pathname });
    props.history.push(link);
  };
}
