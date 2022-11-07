import { sessionStore } from '../SessionStore';

type UiStateModel<T> = { name: string; create: () => T };

/**
 * A function that returns component's state (as MST model).
 * The function creates the component's state MST model if it doesn't exist in the SessionStore.
 *
 * @param uiStateModel The MST model containing the component's UI state
 * @param id The identifier string for the model
 * @param componentStateCreatorFn The function to create the component's state MST model if it doesn't exist in the SessionStore.
 * The default "componentStateCreatorFn" just uses the "create()" method of the given model to create initial state.
 */
function getComponentSessionState<T = unknown>(
  uiStateModel: UiStateModel<T>,
  id: string,
  componentStateCreatorFn: (model: UiStateModel<T>) => T = (model) => model.create(),
): T {
  const stateId = `${uiStateModel.name}-${id}`;
  const entry = (sessionStore.get(stateId) as T) || componentStateCreatorFn(uiStateModel);
  sessionStore.set(stateId, entry);
  return entry;
}

export default getComponentSessionState;
