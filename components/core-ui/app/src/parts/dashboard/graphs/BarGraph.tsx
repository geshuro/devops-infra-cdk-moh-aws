import React from 'react';
import { ChartData, HorizontalBar } from 'react-chartjs-2';

import { barOptions } from './graph-options';

type BarGraphProps = {
  className?: string;
  data: ChartData<unknown>;
  title?: string;
  width?: number;
  height?: number;
};

const BarGraph = ({ className, data, title, width = 250, height = 120 }: BarGraphProps): JSX.Element => (
  <div className={className}>
    <div className="fs-9 center mt1 mb1">{title}</div>
    <div className={className}>
      <HorizontalBar data={data} width={width} height={height} options={barOptions} />
    </div>
  </div>
);

export default BarGraph;
