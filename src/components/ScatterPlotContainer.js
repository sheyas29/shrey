import React, { useState } from 'react';
import ScatterPlot from './ScatterPlot';

const ScatterPlotContainer = ({ dataset, onOutliersRemoved, onClose }) => {
  const [xAxis, setXAxis] = useState('');
  const [yAxis, setYAxis] = useState('');
  const [showScatterPlot, setShowScatterPlot] = useState(false);
  const [highlightedData, setHighlightedData] = useState(dataset.slice(1));

  const handleXAxisChange = (e) => {
    setXAxis(e.target.value);
  };

  const handleYAxisChange = (e) => {
    setYAxis(e.target.value);
  };

  const handleShowScatterPlot = () => {
    if (xAxis && yAxis) {
      setShowScatterPlot(true);
    } else {
      alert('Please select both X and Y axes.');
    }
  };

  const handleSave = () => {
    onOutliersRemoved(highlightedData);
    setShowScatterPlot(false);
  };

  const handleHighlightedDataChange = (newHighlightedData) => {
    setHighlightedData(newHighlightedData);
  };

  return (
    <div className="scatter-plot-container">
      <div>
        <label>
          Select X Axis:
          <select value={xAxis} onChange={handleXAxisChange}>
            <option value="">Select</option>
            {dataset[0].map((header, index) => (
              <option key={index} value={header}>{header}</option>
            ))}
          </select>
        </label>
        <label>
          Select Y Axis:
          <select value={yAxis} onChange={handleYAxisChange}>
            <option value="">Select</option>
            {dataset[0].map((header, index) => (
              <option key={index} value={header}>{header}</option>
            ))}
          </select>
        </label>
        <button onClick={handleShowScatterPlot}>Show Scatter Plot</button>
        {showScatterPlot && <button onClick={handleSave}>Save</button>}
        <button onClick={onClose}>Close</button>
      </div>
      {showScatterPlot && (
        <ScatterPlot
          data={dataset.slice(1)}
          xAxis={xAxis}
          yAxis={yAxis}
          onHighlightedDataChange={handleHighlightedDataChange}
        />
      )}
    </div>
  );
};

export default ScatterPlotContainer;
