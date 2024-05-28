import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Scatter } from 'react-chartjs-2';
import 'chart.js/auto';

const ScatterPlot = ({ data, xAxis, yAxis, onHighlightedDataChange }) => {
  const chartRef = useRef(null);
  const [selection, setSelection] = useState(null);
  const [rects, setRects] = useState([]);
  const [highlightedData, setHighlightedData] = useState(data);

  const handleMouseDown = useCallback((e) => {
    if (!chartRef.current || !chartRef.current.canvas) return;
    const rect = chartRef.current.canvas.getBoundingClientRect();
    setSelection({
      startX: e.clientX - rect.left,
      startY: e.clientY - rect.top,
    });
  }, []);

  const handleMouseUp = useCallback(() => {
    if (!selection || !chartRef.current || !chartRef.current.chartInstance) return;

    const chartInstance = chartRef.current.chartInstance || chartRef.current.chart;
    const { startX, startY, endX, endY } = selection;
    const xMin = Math.min(startX, endX);
    const xMax = Math.max(startX, endX);
    const yMin = Math.min(startY, endY);
    const yMax = Math.max(startY, endY);

    const newRects = [...rects, { xMin, xMax, yMin, yMax }];
    setRects(newRects);

    const newHighlightedData = data.filter((point) => {
      const x = chartInstance.scales.x.getPixelForValue(parseFloat(point[xAxis]));
      const y = chartInstance.scales.y.getPixelForValue(parseFloat(point[yAxis]));
      return newRects.every(
        (rect) => !(x >= rect.xMin && x <= rect.xMax && y >= rect.yMin && y <= rect.yMax)
      );
    });

    setHighlightedData(newHighlightedData);
    onHighlightedDataChange(newHighlightedData);
    setSelection(null);
  }, [selection, data, xAxis, yAxis, rects, onHighlightedDataChange]);

  const handleMouseMove = useCallback((e) => {
    if (!selection || !chartRef.current || !chartRef.current.canvas) return;

    const rect = chartRef.current.canvas.getBoundingClientRect();
    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;
    setSelection({
      ...selection,
      endX,
      endY,
    });
  }, [selection]);

  useEffect(() => {
    if (!chartRef.current || !chartRef.current.canvas) return;

    const canvas = chartRef.current.canvas;
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mousemove', handleMouseMove);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, [handleMouseDown, handleMouseUp, handleMouseMove]);

  const scatterData = {
    datasets: [
      {
        label: 'Dataset',
        data: data.map((item) => ({ x: parseFloat(item[xAxis]), y: parseFloat(item[yAxis]) })),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
      },
      {
        label: 'Highlighted',
        data: highlightedData.map((item) => ({ x: parseFloat(item[xAxis]), y: parseFloat(item[yAxis]) })),
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
      },
    ],
  };

  return (
    <div style={{ position: 'relative' }}>
      <Scatter ref={chartRef} data={scatterData} />
      {selection && (
        <div
          style={{
            position: 'absolute',
            border: '1px dashed black',
            left: Math.min(selection.startX, selection.endX),
            top: Math.min(selection.startY, selection.endY),
            width: Math.abs(selection.endX - selection.startX),
            height: Math.abs(selection.endY - selection.startY),
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
};

export default ScatterPlot;
