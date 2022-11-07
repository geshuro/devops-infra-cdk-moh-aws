import * as fc from 'fast-check';
import { createLink, createLinkWithSearch, reload, gotoFn } from '../routing';

describe('routing', () => {
  describe('createLink, createLinkWithSearch', () => {
    it('returns an object with pathname and hash, state from location', () => {
      fc.assert(
        fc.property(fc.object(), fc.object(), fc.object(), fc.object(), (pathname, hash, state, search) => {
          const location = { hash, state };
          expect(createLink({ pathname, location, search })).toEqual({ pathname, hash, state });
          expect(createLinkWithSearch({ pathname, location, search })).toEqual({ pathname, hash, state, search });
        }),
      );
    });
  });

  describe('reload', () => {
    it('returns an object with pathname and hash, state from location', () => {
      jest.useFakeTimers();
      reload();
      expect(setTimeout).toHaveBeenCalledTimes(1);
      expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 150);
    });
  });

  describe('gotoFn', () => {
    it('returns the parameter with goto bound', () => {
      fc.assert(
        fc.property(fc.object(), fc.object(), fc.object(), fc.array(fc.object()), (pathname, hash, state, history) => {
          const location = { hash, state };
          const reactComponent = {
            props: {
              location,
              history,
            },
          };
          gotoFn(reactComponent)(pathname);
          expect(reactComponent.props.history).toContainEqual({
            pathname,
            hash,
            state,
          });
        }),
      );
    });
  });
});
