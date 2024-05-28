import React from 'react';

const DatasetSummary = ({ dataset }) => {
  if (!dataset.length) {
    return <p>Loading dataset summary...</p>;
  }

  const numAttributes = dataset[0].length;
  const numInstances = dataset.length - 1; // subtract one for the header row

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Dataset Summary</h3>
      <p><strong>Number of Attributes:</strong> {numAttributes}</p>
      <p><strong>Number of Instances:</strong> {numInstances}</p>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    backgroundColor: '#f9f9f9',
    marginBottom: '20px',
    width: 'fit-content',
  },
  title: {
    fontSize: '20px',
    marginBottom: '10px',
  },
};

export default DatasetSummary;
