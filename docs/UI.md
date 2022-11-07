# Developing UI

React with a UI library like SemanticUI or Chakra already take some time to learn.
The difficulty is to also learn the role of React Context, React Hooks, mobx, mobx-react / mobx-react-lite, mobx-state-tree, and how they interact with each other.

Useful links:

- sample component `components/core-ui/app/src/parts/users/AddSingleCognitoUser.tsx`
- EE internal presentation about **UI design and libraries choice** https://amazon.awsapps.com/workdocs/index.html#/document/fa414c838c4b491ddae23bf2cb4d7da093df025bc041938ad8f569c1a8a3b1ef
- **React Hooks** https://reactjs.org/docs/hooks-overview.html
  - if you ever wondered how invoking `useState` function "remembers" which component it belongs to https://www.netlify.com/blog/2019/03/11/deep-dive-how-do-react-hooks-really-work/
- **Mobx** is what allows for reactiveness (tracking changes to objects and notifying observers when they change) https://mobx.js.org
- **Mobx-React** https://mobx.js.org/react-integration.html

  - our use case is mostly `observer(FunctionalComponent)` with `useXStore` (which internally uses `useContext(MobXProviderContext)` as a global map for stores) inside the component

    - Migrating from mobx-react <7 to mobx-react 7 which allows to get rid of `inject` in favor of the hook `useContext(MobXProviderContext)` https://mobx-react.js.org/recipes-migration
      - React Context (isn't particularly applicable on its own, but helps to understand how mobx stores are supplied to React components) https://reactjs.org/docs/context.html

  - **mobx-react-lite** is a stripped down version that doesn't support classes

- **Mobx-State-Tree** https://mobx-state-tree.js.org
  - why `runInAction` is needed https://stackoverflow.com/questions/57271153/mobx-runinaction-usage-why-do-we-need-it


---
---


Let's have a look at some of the elements each of `mobx`, `mobx-react`, `mobx-state-tree` export.

```typescript
import { 
  observable,
  action,
  decorate,
  runInAction,
  computed
} from 'mobx';

import {
  observer,
  inject,
  MobXProviderContext
} from 'mobx-react';

import {
  applySnapshot,
  detach,
  getSnapshot,
  types,
  Instance
} from 'mobx-state-tree';
```

That's a lot and they don't seem particularly self explanatory.
Let's start to use them 1 by 1.

TODO: add step-by-step path of adding imports:
- React state only
- Extract state to store
- Add MobXProviderContext

================

## A full working code
```typescript
import 
  React,
  {
    useContext // hook to use context, instead of wrapping a component with <ContextX.Consumer>
  } from 'react';
import { 
  runInAction, // while this is required at times, it's bugged for async functions
  values
} from 'mobx';

import {
  observer, // wrap a React component to get updates to mobx elements changes
  inject, // don't use, instead read values from MobXProviderContext
  MobXProviderContext // this is needed for backward compatibility, as old stores/properties were injected via `inject` the `MobXProviderContext` has access to them.
} from 'mobx-react';

import {
  types, // the self-contained core of Mobx-State-Tree (MST), which under the hood utilizes `mobx`'s reactivity, although enforces a special separation to props/actions/views.
  Instance // typescript type helper
} from 'mobx-state-tree';


const Todo = types.model({
  name: types.optional(types.string, ""),
  done: types.optional(types.boolean, false),
}).actions(self => ({
  toggle() {
    self.done = !self.done
  }
}));

const BaseStore = types
  .model('BaseStore')
  .actions(self => ({
    // can't use `import { runInAction } from 'mobx'`
    // https://github.com/mobxjs/mobx-state-tree/issues/915
    runInAction<T>(fn: () => T) {
      return fn();
    },
  }));

const TodoStore = BaseStore.named('TodoStore') // extend from BaseStore just to get access to `runInAction`
.props({
  todos: types.map(Todo)
}).actions(self => ({
  addTodoSync(id: number, name: string) {
    self.todos.set("" + id, Todo.create({ name }));
  },

  async addTodo(id: number, name: string) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    self.runInAction(() => self.todos.set("" + id, Todo.create({ name })));
  }
}));


const todoStore = TodoStore.create({
  todos: {
    "1": Todo.create({ name: "First task", done: false }),
    "2": Todo.create({ name: "Second task", done: true }),
  }
});

const TodoView = observer((props: any) => (
  <div>
      <input type="checkbox" checked={props.todo.done} onChange={e => props.todo.toggle()} />
      <input
          type="text"
          value={props.todo.name}
          onChange={e => props.todo.setName(e.target.value)}
      />
  </div>
));

const getRandomId = () => Math.floor(Math.random() * 10 ** 6);

const TodosView = observer(() => {
  const todoStore = useTodosStore();
  return (
    <div>
        <button onClick={e => todoStore.addTodo(getRandomId(), "New Task")}>Add Task</button>
        {values(todoStore.todos).map(todo => (
            <TodoView todo={todo} />
        ))}
    </div>
  )
});

type TodosStoreInstance = Instance<typeof TodoStore>;

function useTodosStore(): TodosStoreInstance {
  const ctx = useContext(MobXProviderContext);
  return ctx[TodoStore.name];
}

function AppView() {
  return (
    // note how we add `todoStore` instance to a map
    <MobXProviderContext.Provider value={{ [TodoStore.name]: todoStore }}>
      <TodosView />
    </MobXProviderContext.Provider>
  );
};

export default AppView;

```