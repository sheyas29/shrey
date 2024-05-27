const express = require('express');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const router = express.Router();
const uploadDir = path.join(__dirname, '../uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Helper function to read CSV file and get attributes
const getAttributes = (filePath) => {
  return new Promise((resolve, reject) => {
    const attributes = new Set();
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('headers', (headers) => {
        headers.forEach(header => attributes.add(header));
        resolve(Array.from(attributes));
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};

// Helper function to read CSV file and get data for chart
const getDataForChart = (filePath, xAxis, yAxis) => {
  return new Promise((resolve, reject) => {
    const data = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        data.push({ x: row[xAxis], y: row[yAxis] });
      })
      .on('end', () => {
        resolve(data);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};

router.post('/upload', (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }

  let datasetFile = req.files.dataset;
  const filePath = path.join(uploadDir, datasetFile.name);

  datasetFile.mv(filePath, (err) => {
    if (err) {
      return res.status(500).send(err);
    }
    res.send({ fileName: datasetFile.name, filePath });
  });
});

router.get('/list', (req, res) => {
  fs.readdir(uploadDir, (err, files) => {
    if (err) {
      return res.status(500).send(err);
    }
    res.send(files);
  });
});

router.delete('/delete/:fileName', (req, res) => {
  const fileName = req.params.fileName;
  const filePath = path.join(uploadDir, fileName);

  fs.unlink(filePath, (err) => {
    if (err) {
      return res.status(500).send(err);
    }
    res.send({ message: 'File deleted successfully' });
  });
});

router.get('/attributes/:fileName', async (req, res) => {
  const fileName = req.params.fileName;
  const filePath = path.join(uploadDir, fileName);

  try {
    const attributes = await getAttributes(filePath);
    res.send(attributes);
  } catch (error) {
    res.status(500).send(error.toString());
  }
});

router.post('/chart-data', async (req, res) => {
  const { datasets, xAxis, yAxis, referenceDataset } = req.body;

  try {
    const chartData = {};
    for (const dataset of datasets) {
      const filePath = path.join(uploadDir, dataset);
      chartData[dataset] = await getDataForChart(filePath, xAxis, yAxis);
    }
    res.send(chartData);
  } catch (error) {
    res.status(500).send(error.toString());
  }
});

module.exports = router;