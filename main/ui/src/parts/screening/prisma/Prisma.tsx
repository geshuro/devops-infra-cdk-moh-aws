import _ from 'lodash';
import React from 'react';
import { Button } from '@chakra-ui/react';
import { PrismaDiagramTemplate } from './PrismaDiagramTemplate';
import { triggerDownload } from '../../../helpers/triggerDownload';
import { useScreeningSummary } from '../ScreeningSummary';

const ReplacementKeys = {
  $REG$: 0,
  $SCR1$: 0,
  $EXA1$: 0,
  $EXH1$: 0,
  $SCR2$: 0,
  $EXA2$: 0,
  $EXH2$: 0,
  $TTL$: 0,
};

export const Prisma = (props: { screeningId: string }) => {
  const summary1 = useScreeningSummary(props.screeningId, 'first');
  const summary2 = useScreeningSummary(props.screeningId, 'second');

  React.useEffect(() => {
    const svg = document.getElementById('prismaSvg')!;

    const metrics = (() => {
      const obj = { ...ReplacementKeys };
      if (summary1 && summary2) {
        const totalArticles = _.sum(
          // eslint-disable-next-line you-dont-need-lodash-underscore/flatten
          _.flatten([
            Object.values(summary1.manualReview),
            Object.values(summary1.autoApproved),
            Object.values(summary1.autoRejected),
          ]),
        );
        obj.$REG$ = totalArticles;

        obj.$SCR1$ = totalArticles;
        obj.$EXA1$ = _.sum(Object.values(summary1.autoRejected));
        obj.$EXH1$ = summary1.manualReview.rejected + summary1.autoApproved.rejected + summary1.autoRejected.rejected;

        obj.$SCR2$ = _.sum(
          // eslint-disable-next-line you-dont-need-lodash-underscore/flatten
          _.flatten([
            Object.values(summary2.manualReview),
            Object.values(summary2.autoApproved),
            Object.values(summary2.autoRejected),
          ]),
        );
        obj.$EXA2$ = _.sum(Object.values(summary2.autoRejected));
        obj.$EXH2$ = summary2.manualReview.rejected + summary2.autoApproved.rejected + summary2.autoRejected.rejected;

        obj.$TTL$ = summary2.manualReview.approved + summary2.autoApproved.approved + summary2.autoRejected.approved;
      }
      return obj;
    })();

    let newPrismaTemplate = PrismaDiagramTemplate;
    for (const [toFind, replaceWith] of Object.entries(metrics)) {
      newPrismaTemplate = newPrismaTemplate.replace(toFind, `${replaceWith}`);
    }

    svg.innerHTML = newPrismaTemplate;
  });

  const onButtonClick = () => {
    const canvas = document.getElementById('prismaCanvas') as HTMLCanvasElement;
    const svg = document.querySelector('#prismaSvg');
    const ctx = canvas.getContext('2d')!;
    const data = new XMLSerializer().serializeToString(svg as any);
    const URL = window.URL || window.webkitURL || window;

    const img = new Image();
    const svgBlob = new Blob([data], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      const imgURI = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');

      triggerDownload(`Screening_${props.screeningId}_PRISMA.png`, imgURI);
    };

    img.src = url;
  };

  return (
    <div>
      <Button colorScheme="blue" onClick={onButtonClick} mb={20}>
        Download PRISMA
      </Button>
      <canvas id="prismaCanvas" width="1920" height="1080" style={{ display: 'none' }}></canvas>
      <svg id="prismaSvg" width="1920" height="1080"></svg>
    </div>
  );
};
