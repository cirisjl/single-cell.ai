import React, { memo } from 'react';
import Plot from 'react-plotly.js';

const ReactPlotly = memo(({ plot_data }) => {
  // Safeguard against unnecessary re-renders
  const parsedData = React.useMemo(() => JSON.parse(plot_data), [plot_data]);

  return (
    <div>
      {parsedData && (
        <Plot
          data={parsedData.data}
          layout={parsedData.layout}
          // Using a key prop to force re-render the component only if plot_data changes
          key={JSON.stringify(parsedData.layout) + JSON.stringify(parsedData.data)}
        />
      )}
    </div>
  );
});

export default ReactPlotly;
