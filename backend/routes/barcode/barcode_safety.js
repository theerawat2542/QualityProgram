const express = require("express");
const {
  connect78Database,
  connectMes9771Database,
} = require("../../helper/db-util");

const router = express.Router();

router.get("/", async (req, res) => {
  let connection78;
  let mes_connection;

  const { barcode } = req.query;

  if (!barcode) {
    return res.status(400).json({ message: "Please input barcode" });
  }

  try {
    connection78 = await connect78Database();
    mes_connection = await connectMes9771Database();

    /* ================= Query 1 (MES) ================= */
    const query1 = `
      SELECT *
      FROM bns_qm_performancetesting
      WHERE WorkUser_BarCode = '${barcode}'
      ORDER BY Create_Date DESC
    `;

    const [results] = await mes_connection.query(query1);

    if (results.length === 0) {
      return res.json([]);
    }

    /* ================= Prepare barcode list ================= */
    const barcodeList = results
      .map(({ WorkUser_BarCode }) => `'${WorkUser_BarCode}'`)
      .join(",");

    /* ================= Query 2 (MES) ================= */
    const query2 = `
      SELECT
        WorkUser_MOrderCode,
        WorkUser_BarCode,
        WorkUser_LineName
      FROM bns_pm_operation
      WHERE WorkUser_BarCode IN (${barcodeList})
    `;

    const [mesResults] = await mes_connection.query(query2);

    /* ================= Join Data ================= */
    const joinedData = joinDataSafety(results, mesResults);

    res.json(joinedData);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    if (connection78) connection78.destroy();
    if (mes_connection) mes_connection.destroy();
  }
});

/* ================= Join Function ================= */

function joinDataSafety(data1, data2) {
  const map = new Map();
  const joined = [];

  data2.forEach((item) => {
    map.set(item.WorkUser_BarCode, item);
  });

  data1.forEach((item) => {
    const match = map.get(item.WorkUser_BarCode);
    if (match) {
      joined.push({
        ...item,
        ...match,
      });
    }
  });

  return joined;
}

module.exports = router;
