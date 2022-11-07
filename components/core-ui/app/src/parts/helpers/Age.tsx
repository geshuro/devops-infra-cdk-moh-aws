import _ from 'lodash';
import React from 'react';
import { observer } from 'mobx-react-lite';
import c from 'classnames';
import TimeAgo from 'react-timeago';

type AgeProps = {
  date: string | number | Date;
  className: string;
  emptyMessage?: string;
};

// expected props
// - date (via props)
// - emptyMessage (via props) (a message to display when the date is empty)
// - className (via props)
const Component = observer(({ date, className, emptyMessage = 'Not Provided' }: AgeProps) => {
  if (_.isEmpty(date)) {
    return <span className={c(className)}>{emptyMessage}</span>;
  }

  const formatter: TimeAgo.Formatter = (_value, _unit, _suffix, _epochSeconds, nextFormatter: any) =>
    (nextFormatter?.() || '').replace(/ago$/, 'old');

  return (
    <span className={c(className)}>
      <TimeAgo date={date} formatter={formatter} />
    </span>
  );
});

export default Component;
