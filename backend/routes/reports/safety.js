const express = require("express");
const { connectMes9771Database } = require("../../helper/db-util");

const router = express.Router();

router.get("/", async (req, res) => {
  let mes_connection;
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({
      message: "startDate and endDate are required",
    });
  }

  try {
    mes_connection = await connectMes9771Database();

    const query = `
      SELECT
        h.TestTime,
        h.WorkUser_BarCode AS Barcode,
        t.WorkUser_MOrderCode AS \`Order\`,
        t.Work_OperationOutMainItemCode AS MatCode,
        t.WorkUser_RightMostItemName AS MatDesc,
        h.LineCode,
        h.Work_Cell_Code AS StationCode,
        CASE 
          WHEN h.TestResult = 1 THEN 'Qualified'
          ELSE 'Unqualified'
        END AS TestResult,
        h.Create_By AS CreateBy,
        h.Create_Date AS CreateTime,
        h.create_time AS TimeStamp,
        h.Site_Code AS Plant,
        h.Performance_ID AS \`Key\`,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'TestItem', d.Test_Item,
            'ActualValue', d.ActualValue,
            'UpperLimit', d.UpperLimit,
            'LowerLimit', d.LowerLimit,
            'Result',
              CASE 
                WHEN d.TestResult = 1 THEN 'Qualified'
                ELSE 'Unqualified'
              END
          )
        ) AS DetailList
      FROM bns_qm_performancetesting h
      LEFT JOIN bns_qm_testingdetail d
        ON h.Performance_ID = d.Relation_ID
      LEFT JOIN bns_pm_operation t
        ON t.WorkUser_BarCode = h.WorkUser_BarCode
      WHERE h.WorkUser_BarCode <> ''
        AND h.TestTime BETWEEN ? AND ?
      GROUP BY h.Performance_ID
      ORDER BY h.TestTime DESC
    `;

    const [results] = await mes_connection.query(query, [
      `${startDate} 00:00:00`,
      `${endDate} 23:59:59`,
    ]);

    res.json(results);
  } catch (error) {
    console.error("MES Query Error:", error);
    res.status(500).json({
      message: error.message || "Internal server error",
    });
  } finally {
    if (mes_connection && mes_connection.destroy) {
      mes_connection.destroy();
    }
  }
});

module.exports = router;
