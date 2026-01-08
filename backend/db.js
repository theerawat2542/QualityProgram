const express = require("express");
const mysql = require("mysql");
const { connect78Database, connectMes9771Database } = require("../backend/helper/db-util");
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
const defectRoute = require("./routes/reports/defect");
const defectBarcode = require("./routes/barcode/barcode_defect");
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
//Insert defect
app.post("/SavedDefect", (req, res) => {
  console.log('Received request at /SavedDefect');
  console.log('Request body:', req.body);

  const { materialBarcode, defectBarcode, scanTime, userId, productionLine } = req.body;

  // Validate required fields
  if (!materialBarcode || !defectBarcode || !scanTime || !userId || !productionLine) {
    console.error('Missing required fields:', { materialBarcode, defectBarcode, scanTime, userId, productionLine });
    res.status(400).send('Missing required fields');
    return;
  }

  const sql = `
    INSERT INTO defect
    (material_barcode, defect_barcode, scan_time, user_id, production_line)
    VALUES (?, ?, ?, ?, ?)
  `;
  const values = [materialBarcode, defectBarcode, scanTime, userId, productionLine];

  console.log('Executing SQL:', sql, values);  // Debug log

  db1Pool.query(sql, values, (err, result) => {
    if (err) {
      console.error("Database error:", err);
      res.status(500).send(err.message);
      return;
    }
    console.log("Data saved successfully:", result);
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
app.get("/HistoryDefect", async (req, res) => {
    let connection78;
    let connection9771;
    try {
      connection78 = await connect78Database();
      connection9771 = await connectMes9771Database();

      const query = `SELECT material_barcode, defect_barcode, scan_time, user_id, production_line FROM defect WHERE DATE(scan_time) = CURDATE() ORDER BY ID DESC LIMIT 20;`;

      const [defectResults] = await connection78.query(query);

      // Get reason details for each defect
      const defectsWithReason = await Promise.all(
        defectResults.map(async (defect) => {
          // Check if defect barcode contains separator
          const isFullCode = defect.defect_barcode.includes('|');
          let reasonQuery;

          if (isFullCode) {
            reasonQuery = `SELECT
              CONCAT(P.Phenomenon_Reason_Code, '|', L.Defect_Location_Code) AS Logic_Code,
              P.Phenomenon_Reason_Name,
              L.Defect_Location_Name
            FROM
              cosmo_im_9771.base_phenomenon_reason AS P
            CROSS JOIN
              cosmo_im_9771.base_defect_location AS L
            WHERE
              P.Phenomenon_Reason_Code = SUBSTRING_INDEX('${defect.defect_barcode}', '|', 1)
              AND L.Defect_Location_Code = SUBSTRING_INDEX('${defect.defect_barcode}', '|', -1)`;
          } else {
            // For reason-only codes (7 digits)
            reasonQuery = `SELECT
              P.Phenomenon_Reason_Code AS Logic_Code,
              P.Phenomenon_Reason_Name,
              'No Location' AS Defect_Location_Name
            FROM
              cosmo_im_9771.base_phenomenon_reason AS P
            WHERE
              P.Phenomenon_Reason_Code = '${defect.defect_barcode}'`;
          }

          const [reasonResults] = await connection9771.query(reasonQuery);
          return {
            ...defect,
            reason: reasonResults[0]
              ? isFullCode
                ? `${reasonResults[0].Phenomenon_Reason_Name} - ${reasonResults[0].Defect_Location_Name}`
                : `${reasonResults[0].Phenomenon_Reason_Name} - (No Location)`
              : 'Unknown'
          };
        })
      );

      res.json(defectsWithReason);
    } catch (error) {
      console.error("Error in HistoryDefect:", error);
      res.status(500).json({message: error.message});
    } finally {
      if (connection78) connection78.destroy();
      if (connection9771) connection9771.destroy();
    }
});
// ------------------------------------------------------------------------
//Report-API
app.use('/oilcharger', oilChargerRoute);
app.use('/coolingtest', coolingTestRoute);
app.use('/compressor', compressorRoute);
app.use('/defect', defectRoute);
app.use('/final', finalRoute);
app.use('/safety', safetyRoute);
// ------------------------------------------------------------------------
//Barcode-API
app.use('/barcode_oilcharger', oilchargerBarcode);
app.use('/barcode_compressor', compressorBarcode);
app.use('/barcode_coolingtest', coolingtestBarcode);
app.use('/barcode_defect', defectBarcode);
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