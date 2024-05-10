const express = require("express");
const mysql = require("mysql");
const app = express();
const bodyParser = require("body-parser");
const oilChargerRoute = require("./routes/reports/oilcharger");
const coolingTestRoute = require("./routes/reports/coolingtest");
const compressorRoute = require("./routes/reports/compressor");
const finalRoute = require("./routes/reports/final");
const safetyRoute = require("./routes/reports/safety");
const oilchargerBarcode = require("./routes/barcode/barcode_oilcharger");
const compressorBarcode = require("./routes/barcode/barcode_compressor");
const coolingtestBarcode = require("./routes/barcode/barcode_coolingtest");
const finalBarcode = require("./routes/barcode/barcode_final");
const safetyBarcode = require("./routes/barcode/barcode_safety");
const stationBarcode = require("./routes/station/station");
// require('dotenv').config()
// ------------------------------------------------------------------------
const db1Pool = mysql.createPool({
  connectionLimit: 10,
  host: "10.35.10.78",
  user: "root",
  password: "78mes@haier",
  database: "quality_control",
});
// const db2Pool = mysql.createPool({
//   connectionLimit: 10,
//   host: "10.35.10.77",
//   user: "mes_it",
//   password: "Haier@2022",
//   database: "cosmo_im_9771",
// });
// ------------------------------------------------------------------------
//App use
app.use(bodyParser.json());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  next();
});
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS, PUT, PATCH, DELETE"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type"
  );
  next();
});
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  next();
});
// ------------------------------------------------------------------------
//Insert compressor
app.post("/Saved", (req, res) => {
  const { materialBarcode, compressorBarcode, scanTime, userId } = req.body;
  const sql =
    "INSERT INTO compressor (material_barcode, compressor_barcode, scan_time, user_id) VALUES (?, ?, ?, ?)";
  const values = [materialBarcode, compressorBarcode, scanTime, userId];
  db1Pool.query(sql, values, (err, result) => {
    if (err) {
      console.error("Error saving data to database:", err);
      res.status(500).send("Internal Server Error");
      return;
    }
    console.log("Data saved to compressor table:", result);
    res.status(200).send("Data saved successfully");
  });
});
// ------------------------------------------------------------------------
app.post("/SavedFinal", (req, res) => {
  const { barcode, scantime, station_scan, userId } = req.body;

  // Check if the barcode length is exactly 20 characters
  if (barcode.length !== 20) {
    // If not, send a response indicating the error
    res.status(400).send("Barcode length must be 20 characters");
    return;
  }

  // If barcode length is valid, proceed with database insertion
  const sql =
    "INSERT INTO custom_final_scan (barcode, scantime, station_scan, user_id) VALUES (?, ?, ?, ?)";
  const values = [barcode, scantime, station_scan, userId];
  db1Pool.query(sql, values, (err, result) => {
    if (err) {
      console.error("Error saving data to database:", err);
      res.status(500).send("Internal Server Error");
      return;
    }
    console.log("Data saved to compressor table:", result);
    res.status(200).send("Data saved successfully");
  });
});

// ------------------------------------------------------------------------
app.get("/History", (req, res) => {
  db1Pool.query(
    "SELECT material_barcode, compressor_barcode, scan_time, user_id FROM compressor WHERE DATE(scan_time) = CURDATE() ORDER BY ID DESC LIMIT 20;",
    (error, results) => {
      if (error) {
        console.error("Error executing SQL query:", error);
        res.status(500).json({ error: "Internal server error" });
      } else {
        res.json(results);
      }
    }
  );
});
// ------------------------------------------------------------------------
app.get("/HistoryFinal", (req, res) => {
  db1Pool.query(
    "SELECT barcode, scantime, station_scan, user_id FROM custom_final_scan WHERE DATE(scantime) = CURDATE() ORDER BY ID DESC LIMIT 20;",
    (error, results) => {
      if (error) {
        console.error("Error executing SQL query:", error);
        res.status(500).json({ error: "Internal server error" });
      } else {
        res.json(results);
      }
    }
  );
});
// ------------------------------------------------------------------------
//Report-API
app.use('/oilcharger', oilChargerRoute);
app.use('/coolingtest', coolingTestRoute);
app.use('/compressor', compressorRoute);
app.use('/final', finalRoute);
app.use('/safety', safetyRoute);
// ------------------------------------------------------------------------
//Barcode-API
app.use('/barcode_oilcharger', oilchargerBarcode);
app.use('/barcode_compressor', compressorBarcode);
app.use('/barcode_coolingtest', coolingtestBarcode);
app.use('/barcode_final', finalBarcode);
app.use('/barcode_safety', safetyBarcode);
// ------------------------------------------------------------------------
//Station-API
app.use('/station', stationBarcode);
// ------------------------------------------------------------------------
// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});