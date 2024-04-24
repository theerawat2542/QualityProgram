const express = require("express");
const { connect78Database, connectMes9771Database } = require("../../helper/db-util");

const router = express.Router();

router.get("/", async (req, res) => {
  let connection78, connectionMES;
  const { barcode } = req.query;

  if (barcode === '') {
    res.status(400).json({message:"Please input Barcode"})
    return 
  }
  
  try {
    connection78 = await connect78Database();
    const query78 = `
    SELECT
    o.barcode,
    o.status AS OilChargerStatus,
    o.datetime AS OilChargerTime,
    IFNULL(c.TestResult, 0) AS CoolingStatus,
    IFNULL(c.StartTime, 0) AS CoolingStartTime,
    IFNULL(co.material_barcode, 0) AS ScanCompressorStatus,
    IFNULL(co.scan_time, 0) AS ScanCompressorTime,
    IFNULL(f.barcode, 0) AS ScanFinalStatus,
    IFNULL(f.scantime, 0) AS ScanFinalTime,
    IFNULL(s.Judgement, 0) AS SafetyStatus,
    IFNULL(s.time, 0) AS SafetyTime
FROM
    oilcharger o
LEFT JOIN
    (SELECT * FROM cooling_test WHERE barcode = '${barcode}' ORDER BY StartTime DESC LIMIT 1) c ON c.barcode = o.barcode
LEFT JOIN
    compressor co ON co.material_barcode = o.barcode
LEFT JOIN
    custom_final_scan f ON f.barcode = o.barcode
LEFT JOIN
    safety_test s ON s.Judgement = o.barcode
WHERE
    o.barcode = '${barcode}'
ORDER BY
    o.datetime DESC
LIMIT 1;
`;
    const [result78, field78] = await connection78.query(query78);

    res.json({ station78Data: result78 });
  } catch (error) {
    console.error("Error executing query:", error);
    res.status(500).json({ message: error });
  } finally {
    if (connection78) {
      connection78.destroy();
    }
  }
});

module.exports = router;
