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

    // 1. ดึงข้อมูล Compressor เรียงจากเวลาล่าสุดไปเก่าสุด
    const query1 = `
      SELECT
        material_barcode,
        compressor_barcode,
        scan_time
      FROM compressor
      WHERE scan_time >= ?
        AND scan_time < DATE_ADD(?, INTERVAL 1 DAY)
      ORDER BY scan_time DESC
    `;

    const [results] = await connection.query(query1, [
      startDate,
      endDate,
    ]);

    // 2. เลือกเฉพาะรายการล่าสุดของแต่ละ material_barcode
    const latestByBarcode = new Map();

    for (const row of results) {
      if (row.material_barcode == null) continue;

      const barcode = String(row.material_barcode);

      // เนื่องจากเรียง scan_time DESC แล้ว
      // รายการแรกที่พบจะเป็นรายการล่าสุด
      if (!latestByBarcode.has(barcode)) {
        latestByBarcode.set(barcode, row);
      }
    }

    const latestResults = Array.from(latestByBarcode.values());

    // หากไม่พบข้อมูล ไม่ต้อง query ฐานข้อมูล MES
    if (latestResults.length === 0) {
      return res.json([]);
    }

    // 3. ดึงรายการ Barcode ที่ไม่ซ้ำกัน
    const barcodeList = latestResults.map((row) =>
      String(row.material_barcode)
    );

    // 4. ค้นหาข้อมูล MES
    const query2 = `
      SELECT
        WorkUser_MOrderCode,
        WorkUser_BarCode,
        WorkUser_LineName,
        WorkUser_RightMostItemName
      FROM bns_pm_operation
      WHERE WorkUser_BarCode IN (?)
    `;

    const [mes_results] = await mes_connection.query(query2, [
      barcodeList,
    ]);

    // 5. รวมข้อมูล Compressor กับ MES
    const joinedData = joinData_compressor(
      latestResults,
      mes_results
    );

    res.json(joinedData);
  } catch (error) {
    console.error("Compressor API error:", error);

    res.status(500).json({
      message: error.message || "Internal Server Error",
    });
  } finally {
    if (connection) {
      try {
        connection.destroy();
      } catch (error) {
        console.error("Error closing Compressor connection:", error.message);
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

function joinData_compressor(data1, data2) {
  const compressorMap = new Map(
    data1.map((entry) => [
      String(entry.material_barcode),
      entry,
    ])
  );

  const joinedData = [];

  for (const entry2 of data2) {
    if (entry2.WorkUser_BarCode == null) continue;

    const barcode = String(entry2.WorkUser_BarCode);
    const matchingEntry = compressorMap.get(barcode);

    if (matchingEntry) {
      joinedData.push({
        ...entry2,
        ...matchingEntry,
      });
    }
  }

  joinedData.sort(
    (a, b) => new Date(b.scan_time) - new Date(a.scan_time)
  );

  return joinedData;
}

module.exports = router;