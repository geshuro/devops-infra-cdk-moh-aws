// https://stackoverflow.com/a/28226736
export const triggerDownload = (fileName: string, fileUri: string) => {
  const event = new MouseEvent('click', {
    view: window,
    bubbles: false,
    cancelable: true,
  });

  const a = document.createElement('a');
  a.setAttribute('download', fileName);
  a.setAttribute('href', fileUri);
  a.setAttribute('target', '_blank');

  a.dispatchEvent(event);
};
