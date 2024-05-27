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
app.use(express.json({ limit: '50mb' })); // Increase the payload limit

let uploadedFileName = '';
let datasetHeaders = [];
let datasetPath = '';
let dataset = []; // Store the entire dataset
let datasets = {}; // Store multiple datasets

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

app.post('/upload-multiple', (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }

  let fileKeys = Object.keys(req.files);
  fileKeys.forEach((key) => {
    const uploadedFile = req.files[key];
    const uploadPath = `${__dirname}/uploads/${uploadedFile.name}`;

    uploadedFile.mv(uploadPath, (err) => {
      if (err) {
        return res.status(500).send(err);
      }

      let headers = [];
      let data = [];

      fs.createReadStream(uploadPath)
        .pipe(csv())
        .on('headers', (h) => {
          headers = h;
        })
        .on('data', (row) => {
          data.push(row);
        })
        .on('end', () => {
          datasets[uploadedFile.name] = { headers, data };
        })
        .on('error', (error) => {
          res.status(500).send(error.message);
        });
    });
  });

  res.send('Files uploaded!');
});

app.get('/datasets', (req, res) => {
  res.json(datasets);
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

app.post('/remove-outliers', (req, res) => {
  const { dataset, attribute } = req.body;

  const attributeIndex = dataset[0].indexOf(attribute);
  if (attributeIndex === -1) {
    return res.status(400).send('Attribute not found.');
  }

  const values = dataset.slice(1).map(row => parseFloat(row[attributeIndex])).filter(value => !isNaN(value));
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
  const stdDev = Math.sqrt(variance);
  const lowerBound = mean - 3 * stdDev;
  const upperBound = mean + 3 * stdDev;

  const filteredDataset = dataset.filter((row, index) => {
    if (index === 0) return true; // Keep the header row
    const value = parseFloat(row[attributeIndex]);
    return !isNaN(value) && value >= lowerBound && value <= upperBound;
  });

  res.json(filteredDataset);
});

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


app.post('/upload', (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }

  const uploadedFile = req.files.file;
  const datasetName = uploadedFile.name;

  if (path.extname(uploadedFile.name) !== '.csv') {
    return res.status(400).send('Only CSV files are allowed.');
  }

  const uploadPath = `${__dirname}/uploads/${uploadedFile.name}`;

  uploadedFile.mv(uploadPath, (err) => {
    if (err) {
      return res.status(500).send(err);
    }

    const dataset = [];
    fs.createReadStream(uploadPath)
      .pipe(csv())
      .on('headers', (headers) => {
        datasets[datasetName] = { headers, data: [] };
      })
      .on('data', (data) => {
        datasets[datasetName].data.push(data);
      })
      .on('end', () => {
        res.send('File uploaded!');
      })
      .on('error', (error) => {
        res.status(500).send(error.message);
      });
  });
});

app.get('/datasets', (req, res) => {
  res.json(Object.keys(datasets));
});

app.delete('/remove-dataset/:name', (req, res) => {
  const datasetName = req.params.name;
  if (datasets[datasetName]) {
    delete datasets[datasetName];
    fs.unlink(`${__dirname}/uploads/${datasetName}`, (err) => {
      if (err) {
        return res.status(500).send('Error deleting file.');
      }
      res.send('Dataset removed successfully.');
    });
  } else {
    res.status(400).send('Dataset not found.');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
