
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

  if (!barcode || typeof barcode !== "string") {
    return res.status(400).json({
      message: "Please input Barcode",
    });
  }

  try {
    /* ================= DB 78 ================= */
    connection78 = await connect78Database();

    // Oil Charger: latest record
    const [oilResult] = await connection78.query(
      `SELECT barcode, status, datetime
       FROM oilcharger
       WHERE barcode = ?
       ORDER BY datetime DESC
       LIMIT 1`,
      [barcode]
    );

    // Compressor: latest record
    const [compressorResult] = await connection78.query(
      `SELECT material_barcode, scan_time
       FROM compressor
       WHERE material_barcode = ?
       ORDER BY scan_time DESC
       LIMIT 1`,
      [barcode]
    );

    // Final Scan: latest record
    const [finalResult] = await connection78.query(
      `SELECT barcode, scantime
       FROM custom_final_scan
       WHERE barcode = ?
       ORDER BY scantime DESC
       LIMIT 1`,
      [barcode]
    );

    /* ================= MES 9771 ================= */
    connectionMes9771 = await connectMes9771Database();

    // Cooling Test: เลือกผลทดสอบล่าสุดจากทุก Line
    const [coolingResult] = await connectionMes9771.query(
      `
      SELECT
        TestTime,
        Barcode,
        TestResult,
        LineCode
      FROM (
        -- RA
        SELECT
          x.check_end_time AS TestTime,
          x.bar_code AS Barcode,
          CASE
            WHEN x.main_result = 'Y' THEN 'Qualified'
            ELSE 'Unqualified'
          END AS TestResult,
          x.line_code AS LineCode
        FROM cosmo_im_9771.external_system_detection_main AS x
        WHERE x.check_type = 'JC0029'
          AND x.line_code = 'RA'
          AND x.bar_code = ?

        UNION ALL

        -- Line อื่น ๆ
        SELECT
          x.TestTime AS TestTime,
          x.WorkUser_BarCode AS Barcode,
          CASE
            WHEN x.SYSTestResult = 1 THEN 'Qualified'
            ELSE 'Unqualified'
          END AS TestResult,
          x.Line_Code AS LineCode
        FROM cosmo_im_9771.bns_pm_electricsystem AS x
        WHERE x.WorkUser_BarCode = ?
      ) AS CoolingTests
      ORDER BY TestTime DESC
      LIMIT 1
      `,
      [barcode, barcode]
    );

    // ตรวจสอบผล Cooling Test ล่าสุด
    const latestCoolingTest = coolingResult[0];

    const coolingStatus =
      latestCoolingTest?.TestResult === "Qualified"
        ? "Qualified"
        : latestCoolingTest
          ? "Unqualified"
          : "0";

    /* ================= Safety Test ================= */
    const [safetyResult] = await connectionMes9771.query(
      `SELECT WorkUser_BarCode, TestTime
       FROM cosmo_im_9771.bns_qm_performancetesting
       WHERE WorkUser_BarCode = ?
         AND WorkUser_BarCode <> ''
       ORDER BY TestTime DESC
       LIMIT 1`,
      [barcode]
    );

    /* ================= Merge Result ================= */
    const responseData = {
      // Oil Charger
      oil_barcode: oilResult?.[0]?.barcode || "0",
      oil_status: oilResult?.[0]?.status || "0",
      oil_charge_time: oilResult?.[0]?.datetime || "0",

      // Cooling Test: latest TestResult
      cooling_barcode: latestCoolingTest?.Barcode || "0",
      cooling_status: coolingStatus,
      cooling_time: latestCoolingTest?.TestTime || "0",

      // Compressor
      comp_status:
        compressorResult?.[0]?.material_barcode || "0",
      comp_time: compressorResult?.[0]?.scan_time || "0",

      // Final Scan
      final_status: finalResult?.[0]?.barcode || "0",
      final_time: finalResult?.[0]?.scantime || "0",

      // Safety Test
      safety_status:
        safetyResult?.[0]?.WorkUser_BarCode || "0",
      safety_time: safetyResult?.[0]?.TestTime || "0",
    };

    return res.json({
      station78Data: [responseData],
    });
  } catch (error) {
    console.error("Error executing station query:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  } finally {
    if (connection78) {
      connection78.destroy();
    }

    if (connectionMes9771) {
      connectionMes9771.destroy();
    }
  }
});

module.exports = router;
