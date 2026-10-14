const express = require("express");
const {
  connect78Database,
  connectMes9771Database,
} = require("../../helper/db-util");

const router = express.Router();

router.get("/", async (req, res) => {
  let connection;
  let mes_connection;

  const { startDate, endDate } = req.query;

  try {
    if (!startDate || !endDate) {
      return res.status(400).json({
        message: "startDate and endDate are required",
      });
    }

    connection = await connect78Database();
    mes_connection = await connectMes9771Database();

    // 1. ดึงข้อมูลโดยเรียงจากเวลาล่าสุดก่อน
    const query1 = `
      SELECT barcode, scantime, station_scan
      FROM custom_final_scan
      WHERE scantime >= ?
        AND scantime < DATE_ADD(?, INTERVAL 1 DAY)
      ORDER BY scantime DESC
    `;

    const [results] = await connection.query(query1, [
      startDate,
      endDate,
    ]);

    // 2. เลือกเฉพาะรายการล่าสุดของแต่ละ barcode
    // เพราะเรียง scantime DESC แล้ว จึงเก็บรายการแรกที่พบ
    const latestByBarcode = new Map();

    for (const row of results) {
      if (row.barcode == null) continue;

      const barcode = String(row.barcode);

      if (!latestByBarcode.has(barcode)) {
        latestByBarcode.set(barcode, row);
      }
    }

    const latestResults = Array.from(latestByBarcode.values());

    // ถ้าไม่มีข้อมูล ไม่ต้องไป query ฐานข้อมูล MES
    if (latestResults.length === 0) {
      return res.json([]);
    }

    // 3. ค้นหาข้อมูล MES เฉพาะ barcode ที่ไม่ซ้ำกัน
    const barcodeList = latestResults.map((row) =>
      String(row.barcode)
    );

    const query2 = `
      SELECT
        WorkUser_MOrderCode,
        WorkUser_BarCode,
        WorkUser_LineName,
        WorkUser_RightMostItemName
      FROM bns_pm_operation
      WHERE WorkUser_BarCode IN (?)
    `;

    const [mesResults] = await mes_connection.query(query2, [
      barcodeList,
    ]);

    // 4. รวมข้อมูลจากสองฐานข้อมูล
    const joinedData = joinData_final(latestResults, mesResults);

    res.json(joinedData);
  } catch (error) {
    // แสดงรายละเอียดจริงใน Terminal ของ Backend
    console.error("Final inspection API error:", error);

    res.status(500).json({
      message: error.message || "Internal Server Error",
    });
  } finally {
    if (connection) {
      try {
        connection.destroy();
      } catch (error) {
        console.error("Error closing connection 78:", error.message);
      }
    }

    if (mes_connection) {
      try {
        mes_connection.destroy();
      } catch (error) {
        console.error("Error closing MES connection:", error.message);
      }
    }
  }
});

function joinData_final(data1, data2) {
  const scanMap = new Map(
    data1.map((entry) => [String(entry.barcode), entry])
  );

  const joinedData = [];

  for (const entry of data2) {
    if (entry.WorkUser_BarCode == null) continue;

    const barcode = String(entry.WorkUser_BarCode);
    const matchingEntry = scanMap.get(barcode);

    if (matchingEntry) {
      joinedData.push({
        ...entry,
        ...matchingEntry,
      });
    }
  }

  joinedData.sort(
    (a, b) => new Date(b.scantime) - new Date(a.scantime)
  );

  return joinedData;
}

module.exports = router;