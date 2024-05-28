import React, { useState } from 'react';
import './App.css';
import Header from './components2/Header';
import Footer from './components2/Footer';
import DatasetUpload from './components2/DatasetUpload';
import DatasetList from './components2/DatasetList';
import AxisSelection from './components2/AxisSelection';
import ChartComponent from './components2/Chart';

function App() {
  const [datasets, setDatasets] = useState([]);
  const [xAxis, setXAxis] = useState('');
  const [yAxis, setYAxis] = useState('');
  const [referenceDataset, setReferenceDataset] = useState('');

  const addDataset = (dataset) => {
    setDatasets([...datasets, dataset]);
  };

  const removeDataset = (fileName) => {
    setDatasets(datasets.filter(dataset => dataset !== fileName));
  };

  return (
    <div className="App">
      <Header />
      <main>
        <DatasetUpload addDataset={addDataset} />
        <DatasetList datasets={datasets} removeDataset={removeDataset} />
        {datasets.length > 0 && (
          <>
            <AxisSelection setXAxis={setXAxis} setYAxis={setYAxis} datasets={datasets} />
            <label>Select Reference Dataset:</label>
            <select onChange={(e) => setReferenceDataset(e.target.value)} defaultValue="">
              <option value="" disabled>Select Reference Dataset</option>
              {datasets.map(dataset => (
                <option key={dataset} value={dataset}>{dataset}</option>
              ))}
            </select>
            {xAxis && yAxis && referenceDataset && (
              <ChartComponent datasets={datasets} xAxis={xAxis} yAxis={yAxis} referenceDataset={referenceDataset} />
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default App;