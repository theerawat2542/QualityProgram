const express = require("express");
const { connect78Database, connectMes9771Database } = require("../../helper/db-util");

const router = express.Router();

router.get("/", async (req, res) => {
  let connection78, connectionMES;
  const { barcode } = req.query;
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
        IFNULL(co.scan_time, 0) AS ScanCompressorTime
    FROM
        oilcharger o
    LEFT JOIN
        (SELECT * FROM cooling_test WHERE barcode = '${barcode}' ORDER BY StartTime DESC LIMIT 1) c ON c.barcode = o.barcode
    LEFT JOIN
        compressor co ON co.material_barcode = o.barcode
    WHERE
        o.barcode = '${barcode}'
    ORDER BY
        o.datetime DESC
    LIMIT 1;
    `;
    const [result78, field78] = await connection78.query(query78);

    connectionMES = await connectMes9771Database();
    const queryMES = `
        SELECT 
        x.Create_Date AS "ScanTime",
        CASE 
                WHEN x.Quality_State = 1 THEN 'QC-OK'
                WHEN x.Quality_State = 0 THEN 'QC-NG'
                ELSE x.Quality_State
        END AS "QcState"
    FROM bns_pm_prodprocess x
    LEFT JOIN pm_work_cells_t y ON x.Work_Cell_Code = y.Work_Cell_Code
    LEFT JOIN base_user_extend z ON x.ScanUserCode = z.UserCode
    left join bns_pm_operation b on x.WorkUser_BarCode = b.WorkUser_BarCode
    WHERE 1=1
    AND x.Work_Cell_Code in ('RB0019') -- final Station
    AND x.WorkUser_BarCode IN (
        '${barcode}'
    )
    ORDER BY x.Create_Date DESC;
    `;
    const [resultMES, fieldMES] = await connectionMES.query(queryMES);

    res.json({ station78Data: result78, stationMESData: resultMES });
  } catch (error) {
    console.error("Error executing query:", error);
    res.status(500).json({ message: error });
  } finally {
    if (connection78) {
      connection78.destroy();
    }
    if (connectionMES) {
      connectionMES.destroy();
    }
  }
});

module.exports = router;
