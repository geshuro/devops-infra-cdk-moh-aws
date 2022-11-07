import { observer } from 'mobx-react-lite';

type Rendered = React.ReactElement;

type Test = () => Rendered;

type ComponentSwitchProps = { tests: Test[]; fallback?: Rendered | null };

// The tests prop takes an array of functions that may return a component.
// The tests are evaluated in order and the first component is returned.
// If no tests are truthy the fallback component is returned.
const ComponentSwitch = ({ tests, fallback = null }: ComponentSwitchProps) =>
  tests.reduce<Rendered>((result, aTest) => result || aTest(), null as any) || fallback;

export default observer(ComponentSwitch);
