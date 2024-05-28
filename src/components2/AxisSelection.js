import React, { useState, useEffect } from 'react';
import axios from 'axios';

function AxisSelection({ setXAxis, setYAxis, datasets }) {
  const [attributes, setAttributes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAttributes = async () => {
      if (datasets && datasets.length > 0) {
        setLoading(true);
        setError(null);
        try {
          const response = await axios.get(`http://localhost:5000/datasets/attributes/${datasets[0]}`);
          setAttributes(response.data);
        } catch (error) {
          setError('Error fetching attributes');
        } finally {
          setLoading(false);
        }
      }
    };
    fetchAttributes();
  }, [datasets]);

  return (
    <div>
      {loading ? (
        <p>Loading attributes...</p>
      ) : (
        <>
          {error && <p className="error">{error}</p>}
          <label>Select X Axis:</label>
          <select onChange={(e) => setXAxis(e.target.value)} defaultValue="">
            <option value="" disabled>Select X Axis</option>
            {attributes.map(attr => (
              <option key={attr} value={attr}>{attr}</option>
            ))}
          </select>
          
          <label>Select Y Axis:</label>
          <select onChange={(e) => setYAxis(e.target.value)} defaultValue="">
            <option value="" disabled>Select Y Axis</option>
            {attributes.map(attr => (
              <option key={attr} value={attr}>{attr}</option>
            ))}
          </select>
        </>
      )}
    </div>
  );
}

export default AxisSelection;