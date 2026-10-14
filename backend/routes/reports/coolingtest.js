
const express = require("express");
const { connectMes9771Database } = require("../../helper/db-util");

const router = express.Router();

router.get("/", async (req, res) => {
  let connection;

  const { startDate, endDate } = req.query;

  // ตรวจสอบวันที่
  if (!startDate || !endDate) {
    return res.status(400).json({
      message: "กรุณาระบุ startDate และ endDate",
    });
  }

  const isValidDate = (value) =>
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) &&
    new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;

  if (!isValidDate(startDate) || !isValidDate(endDate)) {
    return res.status(400).json({
      message: "รูปแบบวันที่ไม่ถูกต้อง กรุณาใช้ YYYY-MM-DD",
    });
  }

  if (startDate > endDate) {
    return res.status(400).json({
      message: "startDate ต้องไม่มากกว่า endDate",
    });
  }

  try {
    // เชื่อมต่อ MES 9771
    connection = await connectMes9771Database();

    const query = `
      SELECT *
      FROM (
        -- =========================================
        -- RA: external_system_detection_main
        -- =========================================
        SELECT
          t.WorkUser_RightMostItemName AS model,
          x.bar_code AS barcode,
          x.check_end_time AS StartTime,
          x.cell_code AS WorkStationNo,
          x.line_code AS LineNo,
          NULL AS PostNo,
          NULL AS TestNo,
          x.check_end_time AS TestedTime,

          CASE
            WHEN x.main_result = 'Y' THEN 'Qualified'
            ELSE 'Unqualified'
          END AS TestResult,

          x.check_type AS Remark,

          t.WorkUser_MOrderCode AS WorkUser_MOrderCode,
          t.WorkUser_BarCode AS WorkUser_BarCode,
          t.WorkUser_LineName AS WorkUser_LineName,

          x.check_end_time AS SortTime

        FROM cosmo_im_9771.external_system_detection_main AS x

        LEFT JOIN cosmo_im_9771.bns_pm_operation AS t
          ON t.WorkUser_BarCode = x.bar_code

        WHERE x.check_type = 'JC0029'
          AND x.line_code = 'RA'
          AND x.bar_code IS NOT NULL
          AND x.check_end_time >= ?
          AND x.check_end_time < DATE_ADD(?, INTERVAL 1 DAY)

        UNION ALL

        -- =========================================
        -- Line อื่น ๆ: bns_pm_electricsystem
        -- =========================================
        SELECT
          t.WorkUser_RightMostItemName AS model,
          x.WorkUser_BarCode AS barcode,
          x.TestTime AS StartTime,
          x.Work_Cell_Code AS WorkStationNo,
          x.Line_Code AS LineNo,
          NULL AS PostNo,
          x.TestNumber AS TestNo,
          x.TestTime AS TestedTime,

          CASE
            WHEN x.SYSTestResult = 1 THEN 'Qualified'
            ELSE 'Unqualified'
          END AS TestResult,

          x.Remark1 AS Remark,

          t.WorkUser_MOrderCode AS WorkUser_MOrderCode,
          t.WorkUser_BarCode AS WorkUser_BarCode,
          t.WorkUser_LineName AS WorkUser_LineName,

          x.TestTime AS SortTime

        FROM cosmo_im_9771.bns_pm_electricsystem AS x

        LEFT JOIN cosmo_im_9771.bns_pm_operation AS t
          ON t.WorkUser_BarCode = x.WorkUser_BarCode

        WHERE x.WorkUser_BarCode IS NOT NULL
          AND x.TestTime >= ?
          AND x.TestTime < DATE_ADD(?, INTERVAL 1 DAY)
      ) AS CoolingReport

      ORDER BY
        CASE
          WHEN TestResult = 'Unqualified' THEN 0
          ELSE 1
        END ASC,
        SortTime DESC
    `;

    const [results] = await connection.query(query, [
      startDate,
      endDate,
      startDate,
      endDate,
    ]);

    // ไม่ส่ง SortTime ซึ่งใช้สำหรับเรียงลำดับภายในเท่านั้น
    const reportData = results.map(
      ({ SortTime, ...record }) => record
    );

    return res.json(reportData);
  } catch (error) {
    console.error("Cooling Test Report error:", error);

    if (!res.headersSent) {
      return res.status(500).json({
        message: "เกิดข้อผิดพลาดในการดึงรายงาน Cooling Test",
      });
    }
  } finally {
    if (connection) {
      try {
        // หลีกเลี่ยง release() ที่ทำให้เกิด error ในระบบเดิม
        if (typeof connection.destroy === "function") {
          connection.destroy();
        } else if (typeof connection.end === "function") {
          await connection.end();
        }
      } catch (disconnectError) {
        console.error(
          "MES database disconnect error:",
          disconnectError
        );
      }
    }
  }
});

module.exports = router;
