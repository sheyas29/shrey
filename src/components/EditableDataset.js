// EditableDataset.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './EditableDataset.css';

const EditableDataset = ({ onClose, updateDataset }) => {
  const [dataset, setDataset] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [selectedColumn, setSelectedColumn] = useState(null);
  const [showCustomValueInput, setShowCustomValueInput] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const [cellEdit, setCellEdit] = useState({ rowIndex: null, colIndex: null, newValue: '' });

  useEffect(() => {
    const fetchDataset = async () => {
      try {
        const response = await axios.get('http://localhost:5000/dataset');
        setHeaders(response.data[0]);
        setDataset(response.data.slice(1));
      } catch (error) {
        console.error('Error fetching dataset:', error);
      }
    };
    fetchDataset();
  }, []);

  const calculateMean = (columnIndex) => {
    const values = dataset.map(row => parseFloat(row[columnIndex])).filter(value => !isNaN(value));
    return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2);
  };

  const calculateMedian = (columnIndex) => {
    const values = dataset.map(row => parseFloat(row[columnIndex])).filter(value => !isNaN(value)).sort((a, b) => a - b);
    const mid = Math.floor(values.length / 2);
    return values.length % 2 !== 0 ? values[mid] : ((values[mid - 1] + values[mid]) / 2).toFixed(2);
  };

  const handleFillMissingValues = (method) => {
    const updatedDataset = [...dataset];
    const columnIndex = headers.indexOf(selectedColumn);
    updatedDataset.forEach(row => {
      if (!row[columnIndex]) {
        if (method === 'mean') {
          row[columnIndex] = calculateMean(columnIndex);
        } else if (method === 'median') {
          row[columnIndex] = calculateMedian(columnIndex);
        } else if (method === 'custom') {
          row[columnIndex] = customValue;
        }
      }
    });
    setDataset(updatedDataset);
    setShowCustomValueInput(false);
    setSelectedColumn(null); // Hide the dropdown after selection
    updateDataset([headers, ...updatedDataset]); // Update the dataset in the parent component
  };

  const handleSetAllValues = () => {
    if (selectedColumn !== null) {
      const columnIndex = headers.indexOf(selectedColumn);
      const updatedDataset = dataset.map((row) => {
        row[columnIndex] = customValue;
        return row;
      });
      setDataset(updatedDataset);
      setShowCustomValueInput(false);
      setSelectedColumn(null); // Hide the dropdown after selection
      updateDataset([headers, ...updatedDataset]); // Update the dataset in the parent component
    }
  };

  const handleCellEdit = (rowIndex, colIndex, newValue) => {
    const updatedDataset = [...dataset];
    updatedDataset[rowIndex][colIndex] = newValue;
    setDataset(updatedDataset);
    updateDataset([headers, ...updatedDataset]); // Update the dataset in the parent component
    setCellEdit({ rowIndex: null, colIndex: null, newValue: '' }); // Hide the cell edit input
  };

  const handleSaveDataset = async () => {
    let directory;
    if (window.electron) {
      directory = await window.electron.showSaveDialog();
    } else {
      directory = prompt('Enter directory to save the dataset:');
    }

    if (directory) {
      try {
        await axios.post('http://localhost:5000/save-dataset', { directory, dataset: [headers, ...dataset] });
        alert('Dataset saved successfully!');
      } catch (error) {
        console.error('Error saving dataset:', error);
        alert('Error saving dataset.');
      }
    }
  };

  const handleClose = (event) => {
    if (event.target.className === 'editable-dataset-popup' || event.target.className === 'close-button') {
      onClose();
    }
  };

  return (
    <div className="editable-dataset-popup" onClick={handleClose}>
      <div className="popup-content">
        <button onClick={onClose} className="close-button">Close</button>
        <h3>Edit Dataset</h3>
        {dataset.length > 0 && (
          <table className="editable-dataset-table">
            <thead>
              <tr>
                {headers.map((header, index) => (
                  <th key={index} onClick={() => setSelectedColumn(header)}>
                    {header}
                    {selectedColumn === header && (
                      <div className="dropdown">
                        <button onClick={() => handleFillMissingValues('mean')}>Fill Missing with Mean</button>
                        <button onClick={() => handleFillMissingValues('median')}>Fill Missing with Median</button>
                        <button onClick={() => setShowCustomValueInput(true)}>Fill Missing with Custom Value</button>
                        <button onClick={() => setShowCustomValueInput(true)}>Set All Values To...</button>
                        {showCustomValueInput && (
                          <div className="custom-value-input">
                            <input
                              type="text"
                              placeholder="Enter custom value"
                              value={customValue}
                              onChange={(e) => setCustomValue(e.target.value)}
                            />
                            <button onClick={() => handleFillMissingValues('custom')}>Apply</button>
                            <button onClick={handleSetAllValues}>Set All Values</button>
                          </div>
                        )}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataset.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, colIndex) => (
                    <td key={colIndex} onClick={() => setCellEdit({ rowIndex, colIndex, newValue: cell })}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {cellEdit.rowIndex !== null && (
          <div className="cell-edit-input">
            <input
              type="text"
              value={cellEdit.newValue}
              onChange={(e) => setCellEdit({ ...cellEdit, newValue: e.target.value })}
            />
            <button onClick={() => handleCellEdit(cellEdit.rowIndex, cellEdit.colIndex, cellEdit.newValue)}>Save</button>
          </div>
        )}
        <button onClick={handleSaveDataset} className="save-button">Save Dataset</button>
      </div>
    </div>
  );
};

export default EditableDataset;
