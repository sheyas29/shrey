import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DatasetSummary from './DatasetSummary';
import Attributes from './Attributes';
import EditableDataset from './EditableDataset';
import './preprocess.css'; // Import the CSS file

const Preprocess = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState('');
  const [showSummary, setShowSummary] = useState(false);
  const [showEditableDataset, setShowEditableDataset] = useState(false);
  const [dataset, setDataset] = useState([]);
  const [attributeList, setAttributeList] = useState([]);
  const [selectedAttribute, setSelectedAttribute] = useState('');

  useEffect(() => {
    if (showSummary) {
      fetchDatasetAndAttributes();
    }
  }, [showSummary]);

  const fetchDatasetAndAttributes = async () => {
    try {
      const datasetResponse = await axios.get('http://localhost:5000/dataset');
      setDataset(datasetResponse.data);
      const attributesResponse = await axios.get('http://localhost:5000/attributes');
      setAttributeList(attributesResponse.data);
    } catch (error) {
      console.error('Error fetching dataset and attributes:', error);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'text/csv') {
      setSelectedFile(file);
      setError('');
      setShowSummary(false);
      console.log('File selected:', file);
    } else {
      setError('Please select a valid CSV file.');
      setSelectedFile(null);
      setShowSummary(false);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      setError('No file selected.');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      console.log('Uploading file:', selectedFile);
      const response = await axios.post('http://localhost:5000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('Response:', response.data);
      alert(response.data);
      setShowSummary(true);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file.');
    }
  };

  const handleEditClick = () => {
    setShowEditableDataset(true);
  };

  const handleCloseEditableDataset = () => {
    setShowEditableDataset(false);
  };

  const handleRemoveOutliers = async () => {
    if (!selectedAttribute) {
      setError('Please select an attribute for outlier removal.');
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/remove-outliers', {
        dataset,
        attribute: selectedAttribute,
      });
      const updatedDataset = response.data;
      setDataset(updatedDataset);
      alert('Outliers removed successfully!');
    } catch (error) {
      console.error('Error removing outliers:', error);
      alert('Error removing outliers.');
    }
  };

  const updateDataset = (updatedDataset) => {
    setDataset(updatedDataset);
  };

  return (
    <div className="preprocess-container">
      <h2 className="preprocess-title">Preprocess Data</h2>
      <div className="preprocess-content">
        <input type="file" accept=".csv" onChange={handleFileChange} className="file-input" />
        {error && <p className="preprocess-error">{error}</p>}
        <button onClick={handleFileUpload} className="upload-button">Upload</button>
        <button onClick={handleEditClick} className="edit-button">Edit</button>
        {attributeList.length > 0 && (
          <div>
            <label htmlFor="attribute-select">Select Attribute for Outlier Removal:</label>
            <select
              id="attribute-select"
              value={selectedAttribute}
              onChange={(e) => setSelectedAttribute(e.target.value)}
            >
              <option value="">--Please choose an attribute--</option>
              {attributeList.map((attr, index) => (
                <option key={index} value={attr}>
                  {attr}
                </option>
              ))}
            </select>
            <button onClick={handleRemoveOutliers} className="remove-outliers-button">
              Remove Outliers
            </button>
          </div>
        )}
      </div>
      {showSummary && (
        <>
          <DatasetSummary dataset={dataset} />
          <Attributes dataset={dataset} />
        </>
      )}
      {showEditableDataset && (
        <EditableDataset
          onClose={handleCloseEditableDataset}
          updateDataset={updateDataset}
        />
      )}
    </div>
  );
};

export default Preprocess;
