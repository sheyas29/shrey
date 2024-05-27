const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const datasets = require('./routes/datasets');


const app = express();

app.use(cors());
app.use(express.json());
app.use(fileUpload());
app.use('/datasets', datasets);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));