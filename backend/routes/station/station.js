const express = require("express");
const { connect78Database } = require("../../helper/db-util");

const router = express.Router();

router.get("/", async (req, res) => {
  let connection78
  const { barcode } = req.query;
  // console.log(barcode)
  if (barcode === '') {
    res.status(400).json({message:"Please input Barcode"})
    return 
  }
  
  try {
    connection78 = await connect78Database();
    const query78 = `
    SELECT
    COALESCE((
        SELECT o.barcode
        FROM oilcharger o
        WHERE o.barcode = '${barcode}' AND o.barcode <> '' 
        ORDER BY o.datetime DESC
        LIMIT 1
    ), '0') as oil_barcode,
    COALESCE((
        SELECT o.status
        FROM oilcharger o
        WHERE o.barcode = '${barcode}' AND o.status <> '' 
        ORDER BY o.datetime DESC
        LIMIT 1
    ), '0') as oil_status,
    COALESCE((
        SELECT o.datetime
        FROM oilcharger o
        WHERE o.barcode = '${barcode}' AND o.datetime <> ''
        ORDER BY o.datetime DESC
        LIMIT 1
    ), '0') as oil_charge_time,
    COALESCE((
      SELECT ct.barcode
      FROM cooling_test ct
      WHERE ct.barcode = '${barcode}' AND ct.barcode <> '' 
      ORDER BY ct.StartTime DESC
      LIMIT 1
    ), '0') as cooling_barcode,
    COALESCE((
        SELECT ct.TestResult
        FROM cooling_test ct
        WHERE ct.barcode = '${barcode}' AND ct.TestResult <> '' 
        ORDER BY ct.StartTime DESC
        LIMIT 1
    ), '0') as cooling_status,
    COALESCE((
        SELECT ct.StartTime
        FROM cooling_test ct
        WHERE ct.barcode = '${barcode}' AND ct.StartTime <> '' 
        ORDER BY ct.StartTime DESC
        LIMIT 1
    ), '0') as cooling_time,
    COALESCE((
        SELECT co.material_barcode
        FROM compressor co
        WHERE co.material_barcode = '${barcode}' AND co.material_barcode <> '' 
        ORDER BY co.scan_time DESC
        LIMIT 1
    ), '0') as comp_status,
    COALESCE((
        SELECT co.scan_time
        FROM compressor co
        WHERE co.material_barcode = '${barcode}' AND co.scan_time <> '' 
        ORDER BY co.scan_time DESC
        LIMIT 1
    ), '0') as comp_time,
    COALESCE((
        SELECT s.Serial
        FROM safety_test s
        WHERE s.Serial = '${barcode}' AND s.Serial <> '' 
        ORDER BY s.Time DESC
        LIMIT 1
    ), '0') as safety_status,
    COALESCE((
        SELECT s.Time
        FROM safety_test s
        WHERE s.Serial = '${barcode}' AND s.Time <> ''
        ORDER BY s.Time DESC
        LIMIT 1
    ), '0') as safety_time,
    COALESCE((
        SELECT fi.barcode
        FROM custom_final_scan fi
        WHERE fi.barcode = '${barcode}' AND fi.barcode <> '' 
        ORDER BY fi.scantime DESC
        LIMIT 1
    ), '0') as final_status,
    COALESCE((
        SELECT fi.scantime
        FROM custom_final_scan fi
        WHERE fi.barcode = '${barcode}' AND fi.scantime <> ''
        ORDER BY fi.scantime DESC
        LIMIT 1
    ), '0') as final_time;
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
