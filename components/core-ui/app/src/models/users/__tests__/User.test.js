import { itProp, fc } from 'jest-fast-check';
import { getPrincipalObjFromPrincipalStr, getPrincipalStrFromPrincipalObj } from '../User';

describe('User', () => {
  describe('getPrincipalObjFromPrincipalStr', () => {
    itProp('should return parameter parsed as JSON', [fc.json()], a =>
      expect(getPrincipalObjFromPrincipalStr(a)).toEqual(JSON.parse(a)),
    );
  });

  describe('getPrincipalStrFromPrincipalObj', () => {
    itProp('should return parameter parsed as JSON', [fc.string(), fc.string()], (username, ns) => {
      expect(getPrincipalStrFromPrincipalObj({ username, ns })).toEqual(JSON.stringify({ username, ns }));
    });
  });
});
