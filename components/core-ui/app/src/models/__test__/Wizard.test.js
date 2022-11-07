import _ from 'lodash/fp';
import { itProp, fc } from 'jest-fast-check';
import { createWizard } from '../Wizard';

describe('Wizard', () => {
  const key1 = 'key1';
  const title1 = 'title1';
  const key2 = 'key2';
  const title2 = 'title2';
  const wizard = createWizard([
    {
      key: key1,
      title: title1,
    },
    {
      key: key2,
      title: title2,
    },
  ]);

  const expectWizard = isAtStart => {
    expect(wizard.currentStep.key).toEqual(isAtStart ? key1 : key2);
    expect(wizard.isStepActive(key1)).toBe(isAtStart);
    expect(wizard.hasNext).toBe(isAtStart);
    expect(wizard.isStepActive(key2)).toBe(!isAtStart);
    expect(wizard.hasPrevious).toBe(!isAtStart);
  };

  it('initializes to be at first step', () => expectWizard(true));

  it('can move using next, previous and goTo', () => {
    wizard.next();
    expectWizard(false);
    wizard.previous();
    expectWizard(true);
    wizard.goTo(key2);
    expectWizard(false);
  });

  itProp('sets step using isComplete', fc.boolean(), isComplete => {
    const step = _.head(wizard.steps);
    step.setComplete(isComplete);
    expect(step.isComplete).toBe(isComplete);
  });
});
