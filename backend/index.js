const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const { parse, isValid } = require('date-fns');
const json2csv = require('json2csv').parse;

const app = express();
const PORT = 5000;

app.use(cors());
app.use(fileUpload());
app.use(express.json());

let uploadedFileName = '';
let datasetHeaders = [];
let datasetPath = '';
let dataset = []; // Store the entire dataset

app.post('/upload', (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }

  const uploadedFile = req.files.file;
  uploadedFileName = uploadedFile.name;

  if (path.extname(uploadedFile.name) !== '.csv') {
    return res.status(400).send('Only CSV files are allowed.');
  }

  const uploadPath = `${__dirname}/uploads/${uploadedFile.name}`;
  datasetPath = uploadPath;

  uploadedFile.mv(uploadPath, (err) => {
    if (err) {
      return res.status(500).send(err);
    }

    datasetHeaders = [];
    dataset = [];
    fs.createReadStream(uploadPath)
      .pipe(csv())
      .on('headers', (headers) => {
        datasetHeaders = headers;
      })
      .on('data', (data) => {
        dataset.push(data);
      })
      .on('end', () => {
        res.send('File uploaded!');
      })
      .on('error', (error) => {
        res.status(500).send(error.message);
      });
  });
});

app.get('/dataset-summary', (req, res) => {
  if (datasetHeaders.length === 0) {
    return res.status(400).send('No dataset available.');
  }

  const numInstances = dataset.length;
  const summary = {
    name: uploadedFileName,
    numAttributes: datasetHeaders.length,
    numInstances: numInstances,
  };
  res.json(summary);
});

app.get('/dataset', (req, res) => {
  if (datasetHeaders.length === 0) {
    return res.status(400).send('No dataset available.');
  }

  const datasetArray = [datasetHeaders, ...dataset.map(Object.values)];
  res.json(datasetArray);
});

app.post('/save-dataset', (req, res) => {
  const { directory, dataset } = req.body;

  if (!directory) {
    return res.status(400).send('Directory not specified.');
  }

  const csvData = json2csv(dataset, { header: true });
  const savePath = path.join(directory, uploadedFileName);

  fs.writeFile(savePath, csvData, (err) => {
    if (err) {
      return res.status(500).send('Error saving dataset.');
    }
    res.send('Dataset saved successfully!');
  });
});

app.get('/attributes', (req, res) => {
  if (datasetHeaders.length === 0) {
    return res.status(400).send('No dataset available.');
  }
  res.json(datasetHeaders);
});

app.post('/remove-attributes', (req, res) => {
  const { attributesToRemove } = req.body;
  datasetHeaders = datasetHeaders.filter(attr => !attributesToRemove.includes(attr));
  dataset = dataset.map(row => {
    attributesToRemove.forEach(attr => delete row[attr]);
    return row;
  });
  res.send('Attributes removed.');
});

app.post('/undo-remove', (req, res) => {
  const uploadPath = `${__dirname}/uploads/${uploadedFileName}`;
  datasetHeaders = [];
  dataset = [];

  fs.createReadStream(uploadPath)
    .pipe(csv())
    .on('headers', (headers) => {
      datasetHeaders = headers;
    })
    .on('data', (row) => {
      dataset.push(row);
    })
    .on('end', () => {
      res.send('Undo completed.');
    })
    .on('error', (error) => {
      res.status(500).send(error.message);
    });
});

function detectDataType(values) {
  let isNumeric = true;
  let isDate = true;

  values.forEach(value => {
    if (isNaN(value) || value === '') {
      isNumeric = false;
    }
    if (!isValid(parse(value, 'yyyy-MM-dd', new Date()))) {
      isDate = false;
    }
  });

  if (isNumeric) return 'Numeric';
  if (isDate) return 'Date';
  return 'Nominal';
}

function calculateAttributeStats(attribute, values) {
  const dataType = detectDataType(values);
  let stats = {};
  let histogramData = {};

  if (dataType === 'Numeric') {
    const numericValues = values.map(value => parseFloat(value)).filter(value => !isNaN(value));
    const min = Math.min(...numericValues);
    const max = Math.max(...numericValues);
    const mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
    const variance = numericValues.reduce((a, b) => a + (b - mean) ** 2, 0) / numericValues.length;
    stats = { min, max, mean, variance };

    histogramData = generateHistogramData(numericValues, 10);
  } else if (dataType === 'Nominal') {
    const valueCounts = values.reduce((acc, value) => {
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {});

    histogramData = {
      labels: Object.keys(valueCounts),
      histogram: Object.values(valueCounts),
    };
  }

  const missingValues = dataset.length - values.length;

  return { dataType, stats, histogramData, missingValues };
}

function generateHistogramData(data, bins) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const binWidth = (max - min) / bins;

  const histogram = Array(bins).fill(0);
  data.forEach((value) => {
    const bin = Math.floor((value - min) / binWidth);
    histogram[Math.min(bin, bins - 1)] += 1;
  });

  const labels = Array(bins).fill(0).map((_, i) => (min + i * binWidth).toFixed(2));
  return { labels, histogram };
}

app.get('/attribute-details/:attribute', (req, res) => {
  const encodedAttribute = req.params.attribute;
  const attribute = decodeURIComponent(encodedAttribute);

  const values = dataset.map(row => row[attribute]).filter(value => value !== undefined && value !== '');

  const { dataType, stats, histogramData, missingValues } = calculateAttributeStats(attribute, values);

  res.json({
    name: attribute,
    dataType,
    missingValues: missingValues,
    distinctValues: new Set(values).size,
    stats,
    histogramData
  });
});

function removeOutliersUsingIQR(data) {
  // Assuming data is a list of numeric values
  const sortedData = [...data].sort((a, b) => a - b);
  const q1 = sortedData[Math.floor((sortedData.length / 4))];
  const q3 = sortedData[Math.ceil((sortedData.length * (3 / 4))) - 1];
  const iqr = q3 - q1;

  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;

  return data.filter(x => x >= lowerBound && x <= upperBound);
}

app.post('/remove-outliers', (req, res) => {
  const { dataset } = req.body;
  const numericColumns = dataset[0].filter(col => detectDataType(dataset.slice(1).map(row => row[col])) === 'Numeric');
  let updatedDataset = [dataset[0]];

  dataset.slice(1).forEach(row => {
    let isOutlier = false;
    numericColumns.forEach(col => {
      const value = parseFloat(row[col]);
      if (!isNaN(value)) {
        const cleanedData = removeOutliersUsingIQR(dataset.slice(1).map(row => parseFloat(row[col])).filter(val => !isNaN(val)));
        if (!cleanedData.includes(value)) {
          isOutlier = true;
        }
      }
    });
    if (!isOutlier) {
      updatedDataset.push(row);
    }
  });

  res.json(updatedDataset);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
