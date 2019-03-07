/*
    read sizes and dom nodes
*/
//libs
const fs = require("fs");
const exec = require("child_process").exec;
const path = require("path");

//deps
const _ = require("lodash");
const fsEx = require("fs-extra");
const rimraf = require("rimraf");
const opn = require("opn");
const program = require("commander");

const BUILD_DIR = "./build";
const BUILD_ASSETS_DIR = `${[BUILD_DIR]}/assets`;
const BUILD_ASSETS_SVGO_DIR = `${[BUILD_DIR]}/svgo_assets`;
const LIBS_DIR = "./lib";

const copyAssetsToBuildDirectory = (srcDirectory, params, callback) => {
  rimraf(BUILD_DIR, function(err) {
    fs.mkdirSync(BUILD_DIR);
    fs.mkdirSync(BUILD_ASSETS_SVGO_DIR);
    //copy assets
    fsEx.copySync(srcDirectory, BUILD_ASSETS_DIR);

    if (params.shouldOptimize) {
      console.log("Optimising SVG asssets with SVGO");
      exec(
        `./node_modules/svgo/bin/svgo -f ${srcDirectory} -o ${BUILD_ASSETS_SVGO_DIR}`,
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

const buildSvgStats = options => {
  const allStats = [];
  const { shouldOptimize } = options;
  fs.readdirSync(BUILD_ASSETS_DIR).forEach(file => {
    const extension = path.extname(file);
    if (extension === ".svg") {
      const stats = fs.statSync(`${BUILD_ASSETS_DIR}/${file}`);
      let svgFullStats = {
        filename: file,
        size: parseInt(stats.size)
      };
      if (shouldOptimize) {
        const svgo_stats = fs.statSync(`${BUILD_ASSETS_SVGO_DIR}/${file}`);
        svgFullStats.svgo_size = parseInt(svgo_stats.size);
        svgFullStats.svgo_improvement = getPercentageImprovement(svgFullStats);
      }
      allStats.push(svgFullStats);
    }
  });
  return allStats;
};

const generateHtmlPage = svgStats => {
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
        <script>window.svgStats=${JSON.stringify(svgStats)}</script>        
        <script src="https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.11/lodash.core.min.js" type="text/javascript"></script>
        <script src="./app.js" type="text/javascript"></script>
      </html>
      `;

  fs.writeFileSync(`${BUILD_DIR}/index.html`, htmlFileTemplate);
  console.log("SVG analyzer page generated!");
};

const buildAnalyzerPage = svgStats => {
  fsEx.copySync(LIBS_DIR, `${[BUILD_DIR]}`);
  generateHtmlPage(svgStats); //generate HTML template
  opn("./build/index.html");
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
  //const svgFileDirectory = "/Users/Yash/Sprinklr/spr/sprinklr-app-client/packages/spr-space/assets/icons/";
  // const svgFileDirectory =
  // "/Users/Yash/Sprinklr/spr/sprinklr-app-client/packages/spr-main-web/src/app/img/";

  copyAssetsToBuildDirectory(svgFileDirectory, options, () => {
    const svgStats = buildSvgStats(options);
    buildAnalyzerPage(svgStats);
  });
};

program
  .arguments("<file>")
  .option("-f, --file", "folder patch for svg assets")
  .option("-o, --optimize", "Do SVGO optimization")
  .action(function(file) {
    generateAnalyzerPage(file, { shouldOptimize: program.optimize });
  })
  .parse(process.argv);
