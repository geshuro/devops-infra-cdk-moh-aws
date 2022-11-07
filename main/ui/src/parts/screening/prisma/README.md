# PRISMA

#### String replacement

The whole idea is to have a fixed SVG (declared as XML markup text) diagram in which we can replace strings and it's
achieved by injecting template placeholders like `$name$` which are later substitued with actual values in code, as the
whole SVG is just a string.

#### Making changes

To make changes to the diagram:

1. Copy the string part of PrismaDiagramTemplate.ts
2. Save it as file.svg
3. Open https://drawio.corp.amazon.com/ (for Amazon internal network) or https://draw.io (for external customers) and
   open file.svg from step 2
4. Make changes
5. In DrawIo interface: File -> Exports as... -> SVG -> Download
6. Paste svg code into the string part of PrismaDiagramTemplate.ts

## Assessed options / design alternatives

- hack: <img> a template image on canvas and overlay with numbers
- use someone's API https://estech.shinyapps.io/prisma_flowdiagram/
  - they also provide R library \[can't bundle into NodeJS lambda\]
- make it ourselves with HTML + CSS hacks for arrows \[can't capture as an image, without potentially unreliable tools\]
  https://stackoverflow.com/questions/10721884/render-html-to-an-image https://github.com/tsayen/dom-to-image
- flowchart.js \[doesn't look good\] https://flowchart.js.org/
- graphviz/dot
  - server-side - problems bundling into Lambda https://www.npmjs.com/package/graphviz
    https://www.npmjs.com/package/graphviz-cli
  - client-side - there's a WASM library, but not all browsers support WASM https://github.com/aduh95/viz.js#readme
  - idea to use it from http://prisma.thetacollaborative.ca/
- flowcharty \[not popular, last updated 3 years ago, might contain vulnerabilities\]
  https://github.com/atago0129/flowcharty/blob/master/sample2.html
  - looks nice, customizable
  - after experimentation it wasn't as customizable as it looks
- just use raw SVG / d3, pretty much what flowcharty does anyway
- use draw.io to drag-and-drop a diagram in SVG (important so it can be exported into an image later on + arrows!)
  - https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Introduction
  - and then will data gaps
