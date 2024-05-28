import React, { useState } from 'react';
import axios from 'axios';

function DatasetUpload({ addDataset }) {
  const [files, setFiles] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    setFiles(e.target.files);
  };

  const handleUpload = async () => {
    if (!files) {
      setError('Please select a file to upload.');
      return;
    }
    setLoading(true);
    setError(null);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      if (files[i].type !== 'text/csv') {
        setError('Only CSV files are allowed.');
        setLoading(false);
        return;
      }
      formData.append('dataset', files[i]);
    }

    try {
      const response = await axios.post('http://localhost:5000/datasets/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      addDataset(response.data.fileName);
      setFiles(null); // Clear file input after successful upload
    } catch (error) {
      setError('Error uploading file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input type="file" multiple onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={loading}>
        {loading ? 'Uploading...' : 'Upload Datasets'}
      </button>
      {error && <p className="error">{error}</p>}
    </div>
  );
}

export default DatasetUpload;