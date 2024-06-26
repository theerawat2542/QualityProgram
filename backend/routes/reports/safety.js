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
    connection = await connect78Database();
    mes_connection = await connectMes9771Database();
    const query1 = `SELECT * FROM safety_test WHERE Time >= '${startDate}' AND Time <= DATE_ADD('${endDate}', INTERVAL 1 DAY) and Serial <> '' order by Time desc`;
    const [results, fields] = await connection.query(query1);
    const barcode_list = results.map(({ Serial }) => `'${Serial}'`);
    const query2 = `SELECT WorkUser_MOrderCode, WorkUser_BarCode, WorkUser_LineName FROM bns_pm_operation where WorkUser_BarCode in (${barcode_list})`;
    const [mes_results, mes_fields] = await mes_connection.query(query2)
    const joinedData = joinData_safety(results, mes_results);
    res.json(joinedData);
  } catch (error) {
    res.status(500).json({ message: error });
  } finally {
    connection.destroy();
  }
});

function joinData_safety(data1, data2) {
  const joinedData = [];
  const map = new Map();
  data2.forEach((entry) => {
    map.set(entry.WorkUser_BarCode, entry);
  });
  data1.forEach((entry) => {
    const matchingEntry = map.get(entry.Serial);
    if (matchingEntry) {
      const joinedEntry = {
        ...entry,
        ...matchingEntry,
      };
      joinedData.push(joinedEntry);
    }
  });
  return joinedData;
}

module.exports = router;
