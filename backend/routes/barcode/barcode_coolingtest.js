
const express = require("express");
const { connectMes9771Database } = require("../../helper/db-util");

const router = express.Router();

router.get("/", async (req, res) => {
  let connection;

  const { barcode } = req.query;

  // ตรวจสอบ Barcode
  if (!barcode || typeof barcode !== "string") {
    return res.status(400).json({
      message: "กรุณาระบุ barcode",
    });
  }

  try {
    // เชื่อมต่อฐานข้อมูล MES 9771
    connection = await connectMes9771Database();

    const query = `
      -- =========================================================
      -- RA
      -- =========================================================
      SELECT
        x.check_end_time AS TestTime,
        x.bar_code AS Barcode,
        t.WorkUser_MOrderCode AS \`Order\`,
        t.Work_OperationOutMainItemCode AS MatCode,
        t.WorkUser_RightMostItemName AS MatDesc,
        x.bar_code_type AS Temperature,
        CASE
          WHEN x.main_result = 'Y' THEN 'Qualified'
          ELSE 'Unqualified'
        END AS TestResult,
        x.line_code AS LineCode,
        x.cell_code AS StationCode,
        NULL AS TestNo,
        x.site_code AS Plant,
        x.create_time AS CreatedTime,
        x.user_code AS DeviceId,
        x.user_name AS EnterpriseCode,
        x.create_by AS UserCode,
        x.check_type AS Remark1,
        x.id AS Remark2,
        x.active AS Remark3
      FROM cosmo_im_9771.external_system_detection_main AS x
      LEFT JOIN cosmo_im_9771.bns_pm_operation AS t
        ON t.WorkUser_BarCode = x.bar_code
      WHERE x.check_type = 'JC0029'
        AND x.line_code = 'RA'
        AND x.bar_code = ?

      UNION ALL

      -- =========================================================
      -- Line อื่น ๆ
      -- =========================================================
      SELECT
        x.TestTime AS TestTime,
        x.WorkUser_BarCode AS Barcode,
        t.WorkUser_MOrderCode AS \`Order\`,
        x.PROD_CODE AS MatCode,
        t.WorkUser_RightMostItemName AS MatDesc,
        x.CurRingTemperature AS Temperature,
        CASE
          WHEN x.SYSTestResult = 1 THEN 'Qualified'
          ELSE 'Unqualified'
        END AS TestResult,
        x.Line_Code AS LineCode,
        x.Work_Cell_Code AS StationCode,
        x.TestNumber AS TestNo,
        x.Site_Code AS Plant,
        x.create_time AS CreatedTime,
        x.DeviceID AS DeviceId,
        x.Enterprise_Code AS EnterpriseCode,
        x.User_Code AS UserCode,
        x.Remark1 AS Remark1,
        x.Remark2 AS Remark2,
        x.Remark3 AS Remark3
      FROM cosmo_im_9771.bns_pm_electricsystem AS x
      LEFT JOIN cosmo_im_9771.bns_pm_operation AS t
        ON t.WorkUser_BarCode = x.WorkUser_BarCode
      WHERE x.WorkUser_BarCode = ?

      ORDER BY TestTime DESC
    `;

    // ส่ง Barcode ให้ SQL ทั้ง 2 เงื่อนไข
    const [results] = await connection.query(query, [
      barcode,
      barcode,
    ]);

    // ส่งผลลัพธ์กลับไปยัง Client
    return res.json(results);
  } catch (error) {
    console.error("barcode_coolingtest error:", error);

    if (!res.headersSent) {
      return res.status(500).json({
        message: "เกิดข้อผิดพลาดในการดึงข้อมูล Cooling Test",
      });
    }
  } finally {
    if (connection) {
      try {
        // ไม่เรียก release() เพราะเป็นต้นเหตุของ Error ที่พบ
        if (typeof connection.destroy === "function") {
          connection.destroy();
        } else if (typeof connection.end === "function") {
          await connection.end();
        }
      } catch (disconnectError) {
        console.error(
          "Database disconnect error:",
          disconnectError
        );
      }
    }
  }
});

module.exports = router;
