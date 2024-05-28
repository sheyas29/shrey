import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import axios from 'axios';
import Spinner from './Spinner';
import ErrorModal from './ErrorModal';
import './ChartComponent.css';

Chart.register(...registerables);

function ChartComponent({ datasets, xAxis, yAxis, referenceDataset }) {
  const [chartData, setChartData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (datasets && xAxis && yAxis) {
        setLoading(true);
        setError(null);
        try {
          const response = await axios.post('http://localhost:5000/datasets/chart-data', {
            datasets,
            xAxis,
            yAxis
          });
          setChartData(response.data);
        } catch (error) {
          setError('Error fetching chart data');
        } finally {
          setLoading(false);
        }
      }
    };
    fetchData();
  }, [datasets, xAxis, yAxis]);

  const data = {
    labels: chartData[referenceDataset]?.map(item => item.x) || [],
    datasets: datasets.map(dataset => ({
      label: dataset,
      data: chartData[dataset]?.map(item => item.y) || [],
      fill: false,
      borderColor: dataset === referenceDataset ? 'red' : 'blue'
    }))
  };

  const handleCloseError = () => {
    setError(null);
  };

  return (
    <div className="chart-container">
      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorModal error={error} onClose={handleCloseError} />
      ) : (
        <Line data={data} />
      )}
    </div>
  );
}

export default ChartComponent;