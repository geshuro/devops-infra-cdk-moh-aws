import _ from 'lodash';
import showdown from 'showdown';
import type { AppContext } from '../app-context/app-context';

const classMap: Record<string, string> = {
  h1: 'ui large header clearfix',
  h2: 'ui medium header clearfix',
  ul: 'ui list undo-line-height',
  li: 'ui item undo-line-height',
  p: 'ui undo-line-height clearfix',
  // img: 'ui fluid image'
  img: 'ui left floated image clearfix mb2 mr2',
};

const bindings = Object.keys(classMap).map((key) => ({
  type: 'output',
  regex: new RegExp(`<${key}(.*)>`, 'g'),
  replace: `<${key} class="${classMap[key]}" $1>`,
}));

// A wrapper around the showdown.js library https://github.com/showdownjs/showdown
export class Showdown {
  private converter: showdown.Converter;

  constructor() {
    // see https://github.com/showdownjs/showdown/wiki/Add-default-classes-for-each-HTML-element
    this.converter = new showdown.Converter({
      extensions: [...bindings],
    });
    // this.converter.setFlavor('github');
    this.converter.setFlavor('vanilla');

    // options are available here https://github.com/showdownjs/showdown/wiki/Showdown-options
    this.converter.setOption('parseImgDimensions', true);
  }

  convert(markdown: string, assets: Record<string, unknown> = {}): string {
    // example of markdown http://demo.showdownjs.com/
    // we will append all the assets as image references (this is not efficient at all), when we
    // have time we can the correct image src mapping in an extension
    let extended = `${markdown}\n\n`;
    _.forEach(assets, (url, name) => {
      extended = `${extended}[${name}]: ${url}\n`;
    });

    return this.converter.makeHtml(extended);
  }
}

export function registerContextItems(appContext: AppContext): void {
  appContext.showdown = new Showdown();
}
