import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const Attributes = ({ dataset }) => {
  const headers = dataset.length ? dataset[0] : [];
  const [selectedAttributes, setSelectedAttributes] = useState([]);
  const [selectedAttributeDetails, setSelectedAttributeDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (selectedAttributeDetails && selectedAttributeDetails.histogramData) {
      const ctx = document.getElementById('histogramChart').getContext('2d');

      if (chartRef.current) {
        chartRef.current.destroy();
      }

      const isNumeric = selectedAttributeDetails.dataType === 'Numeric';
      const chartType = isNumeric ? 'bar' : 'pie';

      chartRef.current = new Chart(ctx, {
        type: chartType,
        data: {
          labels: selectedAttributeDetails.histogramData.labels,
          datasets: [{
            label: 'Histogram',
            data: selectedAttributeDetails.histogramData.histogram,
            backgroundColor: isNumeric ? 'rgba(75, 192, 192, 0.2)' : ['rgba(75, 192, 192, 0.2)', 'rgba(255, 99, 132, 0.2)', 'rgba(255, 206, 86, 0.2)', 'rgba(54, 162, 235, 0.2)', 'rgba(153, 102, 255, 0.2)', 'rgba(255, 159, 64, 0.2)'],
            borderColor: isNumeric ? 'rgba(75, 192, 192, 1)' : ['rgba(75, 192, 192, 1)', 'rgba(255, 99, 132, 1)', 'rgba(255, 206, 86, 1)', 'rgba(54, 162, 235, 1)', 'rgba(153, 102, 255, 1)', 'rgba(255, 159, 64, 1)'],
            borderWidth: 1,
          }]
        },
        options: {
          responsive: true,
          scales: isNumeric ? {
            x: {
              type: 'category',
              title: {
                display: true,
                text: 'Bins'
              }
            },
            y: {
              title: {
                display: true,
                text: 'Frequency'
              }
            }
          } : {}
        }
      });
    }
  }, [selectedAttributeDetails]);

  const handleCheckboxChange = (attribute) => {
    setSelectedAttributes((prev) => {
      if (prev.includes(attribute)) {
        return prev.filter((attr) => attr !== attribute);
      } else {
        return [...prev, attribute];
      }
    });
  };

  const handleRemove = async () => {
    try {
      setLoading(true);
      await axios.post('http://localhost:5000/remove-attributes', { attributesToRemove: selectedAttributes });
      await axios.get('http://localhost:5000/attributes');
      setSelectedAttributes([]);
      setLoading(false);
    } catch (error) {
      console.error('Error removing attributes:', error);
      setLoading(false);
      setError('Error removing attributes');
    }
  };

  const handleUndo = async () => {
    try {
      setLoading(true);
      await axios.post('http://localhost:5000/undo-remove');
      await axios.get('http://localhost:5000/attributes');
      setSelectedAttributes([]);
      setLoading(false);
    } catch (error) {
      console.error('Error undoing removal:', error);
      setLoading(false);
      setError('Error undoing removal');
    }
  };

  const handleAttributeClick = async (attribute) => {
    try {
      setLoading(true);
      const encodedAttribute = encodeURIComponent(attribute); // Encode the attribute name
      const response = await axios.get(`http://localhost:5000/attribute-details/${encodedAttribute}`);
      setSelectedAttributeDetails(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching attribute details:', error);
      setLoading(false);
      setError('Error fetching attribute details');
      // Keep the attribute list visible and clear selected attribute details
      setSelectedAttributeDetails(null);
    }
  };

  if (!dataset.length) {
    return <p>No dataset available.</p>;
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Attributes</h3>
      {loading && <p>Loading...</p>}
      {error && <p style={styles.error}>{error}</p>}
      {!loading && (
        <>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Serial No.</th>
                <th>Attribute Name</th>
                <th>Select</th>
              </tr>
            </thead>
            <tbody>
              {headers.map((attribute, index) => (
                <tr key={attribute}>
                  <td>{index + 1}</td>
                  <td onClick={() => handleAttributeClick(attribute)} style={styles.clickable}>
                    {attribute}
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedAttributes.includes(attribute)}
                      onChange={() => handleCheckboxChange(attribute)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={handleRemove} style={styles.button}>Remove</button>
          <button onClick={handleUndo} style={styles.button}>Undo</button>
        </>
      )}

      {selectedAttributeDetails && (
        <div style={styles.detailsContainer}>
          <h4>Selected Attribute: {selectedAttributeDetails.name}</h4>
          <p>Data Type: {selectedAttributeDetails.dataType}</p>
          <p>Missing Values: {selectedAttributeDetails.missingValues}</p>
          <p>Distinct Values: {selectedAttributeDetails.distinctValues}</p>
          {selectedAttributeDetails.dataType === 'Numeric' && (
            <table style={styles.statsTable}>
              <thead>
                <tr>
                  <th>Min</th>
                  <th>Max</th>
                  <th>Mean</th>
                  <th>Variance</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{selectedAttributeDetails.stats.min}</td>
                  <td>{selectedAttributeDetails.stats.max}</td>
                  <td>{selectedAttributeDetails.stats.mean}</td>
                  <td>{selectedAttributeDetails.stats.variance}</td>
                </tr>
              </tbody>
            </table>
          )}
          <div style={styles.histogramContainer}>
            <canvas id="histogramChart"></canvas>
          </div>
        </div>
      )}
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
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  title: {
    fontSize: '24px',
    marginBottom: '15px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  clickable: {
    cursor: 'pointer',
    color: 'blue',
  },
  button: {
    marginTop: '10px',
    padding: '10px 20px',
    backgroundColor: '#61dafb',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    marginRight: '10px',
  },
  detailsContainer: {
    marginTop: '20px',
    padding: '20px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    backgroundColor: '#fff',
    width: '100%',
  },
  statsTable: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '10px',
  },
  histogramContainer: {
    marginTop: '20px',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    backgroundColor: '#fff',
    width: '100%',
    height: '400px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: {
    color: 'red',
  },
};

export default Attributes;
