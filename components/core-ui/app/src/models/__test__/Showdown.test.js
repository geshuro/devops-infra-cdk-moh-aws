import { registerContextItems } from '../Showdown';

describe('Showdown', () => {
  it('converts markdown to html', async () => {
    const appContext = {};
    await registerContextItems(appContext);
    const heading = 'heading';
    expect(appContext.showdown.convert(`# ${heading}`, ['url'])).toEqual(
      `<h1 class="ui large header clearfix"  id="${heading}">${heading}</h1>`,
    );
  });
});
