import React, {useEffect, useState} from 'react';
import Plot from 'react-plotly.js';

function BenchmarksPlots({ benchmarksPlot, utilizationPlot }) {

    const [benchmarksPlotData, setbenchmarksPlotData] = useState(null);
    const [utilizationPlotData, setutilizationPlotData] = useState(null);

    useEffect(() => {
      if (benchmarksPlot) {
        setbenchmarksPlotData(benchmarksPlot);
      }

      if(utilizationPlot) {
        setutilizationPlotData(utilizationPlot);
      }
    }, [benchmarksPlot, utilizationPlot]);
  return (
    <div>
      <h2>Benchmarks</h2>
      {benchmarksPlotData && <Plot data={benchmarksPlotData.data} layout={benchmarksPlotData.layout} />}

      <h2>Computing Assessments</h2>
      {utilizationPlotData && <Plot data={utilizationPlotData.data} layout={utilizationPlotData.layout} />}
    </div>
  );
}

export default BenchmarksPlots;