import React from 'react';
import { observer } from 'mobx-react-lite';
import c from 'classnames';

import { useUserDisplayName } from '../../models/users/UserDisplayName';

type ByProps = {
  uid: string;
  className?: string;
};

const By = observer(({ uid, className }: ByProps) => {
  const userDisplayName = useUserDisplayName();
  const isSystem = userDisplayName.isSystem({ uid });
  return isSystem ? <></> : <span className={c(className)}>by {userDisplayName.getDisplayName({ uid })}</span>;
});

export default By;
