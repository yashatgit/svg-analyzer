# SVG Analyzer

[![npm (scoped)](https://img.shields.io/npm/v/svg-analyzer.svg)](https://www.npmjs.com/package/svg-analyzer)

Analyse your SVG assets library for saving those extra bytes and DOM nodes.

## Supports:
* Preview of all the assets
* One click optimization with [SVGO](https://www.npmjs.com/package/svgo) with the savings in bytes
* Defing your SVG budget and see which files are above or below the threshold
* DOM node count - if used in inline mode 
* Builds a single page website with all these stats

## Usage
```
Usage: npx svgo-analyzer "--path-to-svg-assets" -o

Options:
  -o, --optimize   Do SVGO optimization. Defaults to false
  -n, --nodes <n>  Nodes threshold. Defaults to 8
  -s, --size <n>   Size threshold in bytes. Defaults to 400 bytes
  -h, --help       output usage information
```

## Screenshot
![](https://github.com/yashatgit/svg-analyzer/raw/master/screenshots/1.jpeg)
