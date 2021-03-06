#!/usr/bin/env node

//libs
const fs = require("fs");
const exec = require("child_process").exec;
const path = require("path");

//deps
const _ = require("lodash");
const fsEx = require("fs-extra");
const rimraf = require("rimraf");
const opn = require("opn");
const open = require("open");
const program = require("commander");

const LIBS_DIR = path.resolve(__dirname, 'lib');
let buildDir;

const setBuildDir = dir => buildDir = dir;
const getBuildDir = () => buildDir;
const getBuildAssetsDir = () => `${[buildDir]}/assets`;
const getBuildSvgoAssetsDir = () => `${[buildDir]}/svgo_assets`;


const copyAssetsToBuildDirectory = (srcDirectory, params, callback) => {
  rimraf(getBuildDir(), function(err) {
    fs.mkdirSync(getBuildDir());
    fs.mkdirSync(getBuildSvgoAssetsDir());
    //copy assets
    fsEx.copySync(srcDirectory, getBuildAssetsDir());

    if (params.svgo_optimize) {
      console.log("Optimising SVG asssets with SVGO");
      exec(
        `./node_modules/svgo/bin/svgo -f ${srcDirectory} -o ${getBuildSvgoAssetsDir()}`,
        (error, stdout, stderr) => {
          //console.log(`stdout: ${stdout}`);
          if (!error) {
            console.log("SVG Optimization completed");
            callback();
          }
        }
      );
    } else {
      callback();
    }
  });
};

const getPercentageImprovement = ({ size, svgo_size }) => {
  return parseFloat((((size - svgo_size) / size) * 100).toFixed(2));
};

const findDOMNodesLength = (fileContent) => {
  return fileContent.match(/<[^>]+>/g).length - fileContent.match(/<\//g).length;
};

const buildSvgStats = options => {
  const allStats = [];
  const { svgo_optimize } = options;
  fs.readdirSync(getBuildAssetsDir()).forEach((file, index) => {
    const extension = path.extname(file);
    const filePath = `${getBuildAssetsDir()}/${file}`;
    if (extension === ".svg") {
      const fileContents = fs.readFileSync(filePath);
      const stats = fs.statSync(filePath);

      let svgFullStats = {
        filename: file,
        size: parseInt(stats.size),
        nodes: findDOMNodesLength(fileContents.toString()),
      };
      if (svgo_optimize) {
        const svgo_stats = fs.statSync(`${getBuildSvgoAssetsDir()}/${file}`);
        svgFullStats.svgo_size = parseInt(svgo_stats.size);
        svgFullStats.svgo_improvement = getPercentageImprovement(svgFullStats);
      }
      allStats.push(svgFullStats);
    }
  });
  return allStats;
};

const generateHtmlPage = appData => {
  const htmlFileTemplate = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width,initial-scale=1" />
          <title>SVG Analyzer</title>
          <link href="https://fonts.googleapis.com/css?family=Roboto" rel="stylesheet">
          <link rel="stylesheet" href="./stylesheet.css" type="text/css" />
        </head>
        <body>
        <div class="container">
            <div id="controls">
                <div id="stats"></div>                              
            </div>            
            <div id="svg-palette"></div>    
        </div>
        </body>
        <script>window.appData=${JSON.stringify(appData)}</script>        
        <script src="https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.11/lodash.core.min.js" type="text/javascript"></script>
        <script src="./app.js" type="text/javascript"></script>
      </html>
      `;

  fs.writeFileSync(`${getBuildDir()}/index.html`, htmlFileTemplate);
  console.log("SVG analyzer page generated!");
};

const buildAnalyzerPage = embedOptions => {
  fsEx.copySync(LIBS_DIR, `${[getBuildDir()]}`);
  generateHtmlPage(embedOptions); //generate HTML template
};

/*
Copy the contents of given directory to build/assets directory
Read all the SVGs in the assets file and built svgStats collection

Generate webpage from the generated HTML file.
  - assets: all copied .svg assets
  - index.html: generated from HTML template with svgStats embedded
  - stylesheet.css : for styling the page
  - app.js : JS stuff
*/
const generateAnalyzerPage = (svgFileDirectory, options) => {
  copyAssetsToBuildDirectory(svgFileDirectory, options, () => {
    const svgStats = buildSvgStats(options);
    buildAnalyzerPage({
      ...options,
      svgStats
    });
    opn(`${getBuildDir()}/index.html`);
    open(getBuildDir());
  });
};

const defaults = {
  svgo_optimize: false,
  nodes_threshold: 8,
  size_threshold: 400,
  output_dir: './build',
};
program
  .arguments("<file>")
  .option("-o, --optimize", `Do SVGO optimization. Defaults to ${defaults.svgo_optimize}`)
  .option("-n, --nodes <n>", `Nodes threshold. Defaults to ${defaults.nodes_threshold}`, parseInt)
  .option("-s, --size <n>", `Size threshold in bytes. Defaults to ${defaults.size_threshold} bytes`, parseInt)
  .option("-O, --output <file>", 'Output directory. Defaults to current directory')
  .action(function(file) {
    setBuildDir(program.output || defaults.output_dir);
    generateAnalyzerPage(file, {
      svgo_optimize: program.optimize || defaults.svgo_optimize,
      nodes_threshold: program.nodes || defaults.nodes_threshold,
      size_threshold: program.size || defaults.size_threshold,
    });
  })
  .parse(process.argv);
