import _ from 'lodash';
import { types, Instance } from 'mobx-state-tree';

// ====================================================================================================================================
// Step
// ====================================================================================================================================
const Step = types
  .model('Step', {
    key: types.string,
    title: types.string,
    desc: types.optional(types.string, ''),
    isComplete: false,
  })
  .actions((self) => ({
    setComplete(isComplete: boolean) {
      self.isComplete = isComplete;
    },
  }));

type Step = Instance<typeof Step>;

// ====================================================================================================================================
// Wizard
// ====================================================================================================================================
const Wizard = types
  .model('Wizard', {
    steps: types.array(Step),
    currentIdx: 0,
  })
  .views((self) => ({
    get currentStep() {
      return self.steps[self.currentIdx];
    },
    get hasNext() {
      return self.currentIdx < self.steps.length - 1;
    },
    get hasPrevious() {
      return self.currentIdx > 0;
    },

    isStepActive(stepKey: string) {
      return _.findIndex(self.steps, { key: stepKey }) === self.currentIdx;
    },
  }))
  .actions((self) => ({
    next() {
      if (self.hasNext) {
        self.currentIdx += 1;
      }
    },
    previous() {
      if (self.hasPrevious) {
        self.currentIdx -= 1;
      }
    },
    goTo(stepKey: string) {
      const stepIdx = _.findIndex(self.steps, { key: stepKey });
      if (stepIdx >= 0) {
        self.currentIdx = stepIdx;
      }
    },
  }));
function createWizard(steps: Step[], currentIdx = 0) {
  return Wizard.create({
    steps,
    currentIdx,
  });
}

export default Wizard;
export { Wizard, createWizard };
