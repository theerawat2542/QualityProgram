const express = require("express");
const {
  connect78Database,
  connectMes9771Database,
} = require("../../helper/db-util");

const router = express.Router();

router.get("/", async (req, res) => {
  let connection78;
  let connectionMes9771;

  const { barcode } = req.query;

  if (!barcode) {
    return res.status(400).json({ message: "Please input Barcode" });
  }

  try {
    /* ================= DB 78 ================= */
    connection78 = await connect78Database();

    const query78 = `
      SELECT
        COALESCE((
          SELECT o.barcode
          FROM oilcharger o
          WHERE o.barcode = '${barcode}'
          ORDER BY o.datetime DESC
          LIMIT 1
        ), '0') AS oil_barcode,

        COALESCE((
          SELECT o.status
          FROM oilcharger o
          WHERE o.barcode = '${barcode}'
          ORDER BY o.datetime DESC
          LIMIT 1
        ), '0') AS oil_status,

        COALESCE((
          SELECT o.datetime
          FROM oilcharger o
          WHERE o.barcode = '${barcode}'
          ORDER BY o.datetime DESC
          LIMIT 1
        ), '0') AS oil_charge_time,

        COALESCE((
          SELECT ct.barcode
          FROM cooling_test ct
          WHERE ct.barcode = '${barcode}'
          ORDER BY ct.StartTime DESC
          LIMIT 1
        ), '0') AS cooling_barcode,

        COALESCE((
          SELECT ct.TestResult
          FROM cooling_test ct
          WHERE ct.barcode = '${barcode}'
          ORDER BY ct.StartTime DESC
          LIMIT 1
        ), '0') AS cooling_status,

        COALESCE((
          SELECT ct.StartTime
          FROM cooling_test ct
          WHERE ct.barcode = '${barcode}'
          ORDER BY ct.StartTime DESC
          LIMIT 1
        ), '0') AS cooling_time,

        COALESCE((
          SELECT co.material_barcode
          FROM compressor co
          WHERE co.material_barcode = '${barcode}'
          ORDER BY co.scan_time DESC
          LIMIT 1
        ), '0') AS comp_status,

        COALESCE((
          SELECT co.scan_time
          FROM compressor co
          WHERE co.material_barcode = '${barcode}'
          ORDER BY co.scan_time DESC
          LIMIT 1
        ), '0') AS comp_time,

        COALESCE((
          SELECT fi.barcode
          FROM custom_final_scan fi
          WHERE fi.barcode = '${barcode}'
          ORDER BY fi.scantime DESC
          LIMIT 1
        ), '0') AS final_status,

        COALESCE((
          SELECT fi.scantime
          FROM custom_final_scan fi
          WHERE fi.barcode = '${barcode}'
          ORDER BY fi.scantime DESC
          LIMIT 1
        ), '0') AS final_time
    `;

    const [result78] = await connection78.query(query78);

    /* ================= MES 9771 (Safety) ================= */
    connectionMes9771 = await connectMes9771Database();

    const safetyQuery = `
      SELECT
        COALESCE((
          SELECT WorkUser_BarCode
          FROM bns_qm_performancetesting
          WHERE WorkUser_BarCode = '${barcode}'
          AND WorkUser_BarCode <> ''
          ORDER BY TestTime DESC
          LIMIT 1
        ), '0') AS safety_status,

        COALESCE((
          SELECT TestTime
          FROM bns_qm_performancetesting
          WHERE WorkUser_BarCode = '${barcode}'
          AND WorkUser_BarCode <> ''
          ORDER BY TestTime DESC
          LIMIT 1
        ), '0') AS safety_time
    `;

    const [safetyResult] = await connectionMes9771.query(safetyQuery);

    /* ================= Merge Result ================= */
    const responseData = {
      ...result78[0],
      safety_status: safetyResult[0]?.safety_status || "0",
      safety_time: safetyResult[0]?.safety_time || "0",
    };

    res.json({ station78Data: [responseData] });
  } catch (error) {
    console.error("Error executing query:", error);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    if (connection78) connection78.destroy();
    if (connectionMes9771) connectionMes9771.destroy();
  }
});

module.exports = router;
