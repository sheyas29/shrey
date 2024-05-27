const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const configDir = path.join(__dirname, '../configs');
const uploadDir = path.join(__dirname, '../uploads');

if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir);
}

// Save configuration
router.post('/save', (req, res) => {
  const { configName, datasets, xAxis, yAxis, referenceDataset } = req.body;
  const config = { datasets, xAxis, yAxis, referenceDataset };

  fs.writeFile(path.join(configDir, `${configName}.json`), JSON.stringify(config), (err) => {
    if (err) {
      return res.status(500).send(err);
    }
    res.send({ message: 'Configuration saved successfully' });
  });
});

// Load configuration
router.get('/load/:configName', (req, res) => {
  const configName = req.params.configName;

  fs.readFile(path.join(configDir, `${configName}.json`), 'utf8', (err, data) => {
    if (err) {
      return res.status(500).send(err);
    }
    const config = JSON.parse(data);
    const missingFiles = config.datasets.filter(dataset => !fs.existsSync(path.join(uploadDir, dataset)));
    if (missingFiles.length > 0) {
      return res.status(404).send({ error: `Missing files: ${missingFiles.join(', ')}`, missingFiles });
    }
    res.send(config);
  });
});

module.exports = router;