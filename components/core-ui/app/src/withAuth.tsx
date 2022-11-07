import React from 'react';
import { observer } from 'mobx-react-lite';
import DefaultLoginScreen from './parts/Login';
import { useApp } from './models/App';

type WrapperProps = {
  loginComp: JSX.Element;
  Comp: React.ComponentType;
};

const Wrapper = observer((props: WrapperProps) => {
  const app = useApp();

  const renderLogin = () => props.loginComp;

  const getWrappedCompProps = (additionalProps: unknown[]) => {
    const p: any = { ...props, ...additionalProps };
    delete p.Comp;
    delete p.loginComp;
    return p;
  };

  const renderAuthenticated = () => {
    const p = getWrappedCompProps({ authenticated: true } as any);
    return <props.Comp {...p} />;
  };

  let content: JSX.Element | null = null;

  if (app.userAuthenticated) {
    content = renderAuthenticated();
  } else {
    content = renderLogin();
  }

  return content;
});

function withAuth(Comp: React.ComponentType, { loginComp } = { loginComp: <DefaultLoginScreen /> }) {
  return function component(props?: unknown): JSX.Element {
    return <Wrapper Comp={Comp} loginComp={loginComp} {...props} />;
  };
}

export default withAuth;
