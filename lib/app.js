let SORT_BY = "size";
let appData = window.appData;
let SIZE_THRESHOLD = appData.size_threshold;
let DOM_NODES_THRESHOLD = appData.nodes_threshold;

const getSizeInKb = size => parseFloat((size || 0) / 1000).toFixed(2);

const renderIcons = () => {
  const svgNodes = _.reduce(
    svgStats,
    (acc, { filename, size, svgo_size, svgo_improvement, nodes }) => {
      acc = `${acc}
          <article class="svg-icon-item ${nodes > DOM_NODES_THRESHOLD ? "border-red" : ""}">
            <object class="svg-icon" data="./assets/${filename}" type="image/svg+xml"></object>
            <span class="icon-name txt-overflow">${filename.split(".")[0]}</span>
            <span class="txt-center ${size > SIZE_THRESHOLD ? "col-red" : ""}">            
                <span class="icon-size">Size: ${getSizeInKb(size)} kb</span>
            </span>            
            <span class="icon-size ${
              !svgo_size ? "hide" : ""
            }">SVGO: ${getSizeInKb(
        svgo_size
      )} kb (<b class="col-green">${svgo_improvement}%</b>)</span>
            <span class="${nodes > DOM_NODES_THRESHOLD ? "col-red" : ""}">Nodes: ${nodes}</span>
          </article>
          `;
      return acc;
    },
    ""
  );
  document.getElementById("svg-palette").innerHTML = svgNodes;
};

const renderStats = () => {
  const summary = {
    totalSize: 0,
    totalDomNodes:0,
    iconsGreaterThanThreshold: 0,
    savings_op: 0,
    savings_svgo: 0
  };
  _.forEach(svgStats, ({ size, svgo_size, nodes }) => {
    summary.totalSize += size;
    summary.totalDomNodes += nodes;
    if (size > SIZE_THRESHOLD) {
      summary.iconsGreaterThanThreshold += 1;
      summary.savings_op += size - SIZE_THRESHOLD;
    }
    summary.savings_svgo += size - svgo_size;
  });
  const table = `
    <table class="minimalistBlack">
    <thead></thead>
    <tbody>
        <tr><td>Total Assets</td><td>${svgStats.length}</td></tr>
        <tr><td>Total library size</td><td><b class="col-red">${getSizeInKb(
          summary.totalSize
        )} kb</b></td></tr>
        <tr><td>Assets > Budget <input id="threshold-control" value="${SIZE_THRESHOLD}" type="number"/> b</td><td>${
    summary.iconsGreaterThanThreshold
  }</td></tr>
        <tr><td>Potential Savings</td><td><b class="col-green">${getSizeInKb(
          summary.savings_op
        )} kb</b></td></tr>
        <tr><td>SVGO Savings</td><td><b class="col-green">${getSizeInKb(
          summary.savings_svgo
        )} kb</b></td></tr>
        <tr><td>Total DOM Nodes</td><td><b class="col-red">${summary.totalDomNodes}</b></td></tr>
        <tr><td>Sort By</td><td><select value="${SORT_BY}" id="sort-control"><option value="size">Original Size</option><option value="svgo_improvement">SVGO optimised size</option><option value="nodes">Nodes</option></select></td></tr>
    </tbody>
    </table>
  `;
  document.getElementById("stats").innerHTML = table;
};

const domNodesLength = () => {
  $(".svg-icon-item").each(function(index) {
    $(this).append(`<span>DOM Nodes: ${$(this).find("svg")}</span>`);
  });
};

const render = () => {
  svgStats = appData.svgStats.sort((a, b) => (a[SORT_BY] < b[SORT_BY] ? 1 : -1));
  renderIcons();
  renderStats();

  document
    .getElementById("threshold-control")
    .addEventListener("change", function(evt) {
      onThresholdChange(parseInt(this.value));
    });

  document
    .getElementById("sort-control")
    .addEventListener("change", function(evt) {
      onSortChange(this.value);
    });
  document.getElementById("sort-control").value = SORT_BY;
};

const onThresholdChange = newThreshold => {
  SIZE_THRESHOLD = newThreshold;
  render();
};

const onSortChange = newSort => {
  SORT_BY = newSort;
  render();
};


render();
