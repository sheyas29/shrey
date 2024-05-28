import React from 'react';
import axios from 'axios';

function DatasetList({ datasets, removeDataset }) {
  const handleRemove = async (fileName) => {
    await axios.delete(`http://localhost:5000/datasets/delete/${fileName}`);
    removeDataset(fileName);
  };

  return (
    <ul>
      {datasets.map((dataset, index) => (
        <li key={`${dataset}-${index}`}>
          <span>{dataset}</span>
          <button onClick={() => handleRemove(dataset)}>Remove</button>
        </li>
      ))}
    </ul>
  );
}

export default DatasetList;