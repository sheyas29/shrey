import React, { useState } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import './compare.css'; // Import the CSS file

const Comparison = () => {
  const [numDatasets, setNumDatasets] = useState(0);
  const [datasets, setDatasets] = useState([]);
  const [datasetHeaders, setDatasetHeaders] = useState({});
  const [selectedDatasets, setSelectedDatasets] = useState([]);
  const [xAxis, setXAxis] = useState('');
  const [yAxis, setYAxis] = useState('');
  const [referenceDataset, setReferenceDataset] = useState('');
  const [comparisonResult, setComparisonResult] = useState(null);

  const handleNumDatasetsChange = (event) => {
    setNumDatasets(parseInt(event.target.value, 10));
    setDatasets(Array(parseInt(event.target.value, 10)).fill(null));
  };

  const handleFileChange = (event, index) => {
    const file = event.target.files[0];
    if (file && file.type === 'text/csv') {
      const updatedDatasets = [...datasets];
      updatedDatasets[index] = file;
      setDatasets(updatedDatasets);
    } else {
      alert('Please select a valid CSV file.');
    }
  };

  const handleUpload = async (file, index) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:5000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const headersResponse = await axios.get('http://localhost:5000/attributes');
      setDatasetHeaders((prevHeaders) => ({
        ...prevHeaders,
        [file.name]: headersResponse.data,
      }));

      console.log(`Response for file ${index + 1}:`, response.data);
    } catch (error) {
      console.error(`Error uploading file ${index + 1}:`, error);
      alert(`Error uploading file ${index + 1}.`);
    }
  };

  const handleCompare = async () => {
    if (selectedDatasets.length === 0 || !xAxis || !yAxis || !referenceDataset) {
      alert('Please select datasets, x-axis, y-axis, and reference dataset.');
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/compare', {
        selectedDatasets,
        xAttribute: xAxis,
        yAttribute: yAxis,
        referenceDataset,
      });

      setComparisonResult(response.data);
    } catch (error) {
      console.error('Error comparing datasets:', error);
      alert('Error comparing datasets.');
    }
  };

  return (
    <div className="comparison-container">
      <h2 className="comparison-title">Compare Datasets</h2>
      <div className="comparison-content">
        <label>
          Number of Datasets to Compare:
          <input
            type="number"
            value={numDatasets}
            onChange={handleNumDatasetsChange}
            className="num-datasets-input"
          />
        </label>
        <div className="datasets-input">
          {Array.from({ length: numDatasets }).map((_, index) => (
            <div key={index} className="dataset-upload">
              <input
                type="file"
                accept=".csv"
                onChange={(event) => handleFileChange(event, index)}
                className="file-input"
              />
              {datasets[index] && (
                <button onClick={() => handleUpload(datasets[index], index)} className="upload-button">
                  Upload
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="datasets-selection">
          <label>
            Select Datasets to Compare:
            <select multiple value={selectedDatasets} onChange={(e) => setSelectedDatasets([...e.target.selectedOptions].map(option => option.value))}>
              {datasets.map((file, index) => (
                <option key={index} value={file?.name}>{file?.name}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="axis-selection">
          <label>
            X-Axis:
            <select value={xAxis} onChange={(e) => setXAxis(e.target.value)}>
              {selectedDatasets.length > 0 && datasetHeaders[selectedDatasets[0]]?.map((header, index) => (
                <option key={index} value={header}>{header}</option>
              ))}
            </select>
          </label>
          <label>
            Y-Axis:
            <select value={yAxis} onChange={(e) => setYAxis(e.target.value)}>
              {selectedDatasets.length > 0 && datasetHeaders[selectedDatasets[0]]?.map((header, index) => (
                <option key={index} value={header}>{header}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="reference-dataset-selection">
          <label>
            Select Reference Dataset:
            <select value={referenceDataset} onChange={(e) => setReferenceDataset(e.target.value)}>
              {selectedDatasets.map((dataset, index) => (
                <option key={index} value={dataset}>{dataset}</option>
              ))}
            </select>
          </label>
        </div>
        <button onClick={handleCompare} className="compare-button">Compare</button>
      </div>
      {comparisonResult && (
        <div className="comparison-result">
          <Line
            data={{
              labels: comparisonResult.datasets[0].data.map(point => point.x),
              datasets: comparisonResult.datasets.map((dataset, index) => ({
                label: dataset.name,
                data: dataset.data.map(point => point.y),
                borderColor: dataset.name === comparisonResult.reference ? 'red' : `hsl(${index * 60}, 100%, 50%)`,
                borderWidth: 2,
                fill: false,
              })),
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Comparison;
