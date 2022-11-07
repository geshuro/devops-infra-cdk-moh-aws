import { types } from 'mobx-state-tree';

// A sample model using mobx state tree
const Hello = types
  .model('Hello', {
    message: '',
  })
  .actions((self) => ({})) // eslint-disable-line no-unused-vars
  .views((self) => ({})); // eslint-disable-line no-unused-vars

export { Hello };
