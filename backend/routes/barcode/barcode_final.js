const express = require("express");
const { connect78Database, connectMes9771Database } = require("../../helper/db-util");
const router = express.Router();

router.get('/', async (req, res) => {
  let connection;
  let mes_connection
  const { barcode } = req.query;
  try {
    connection = await connect78Database()
    mes_connection = await connectMes9771Database()
    const query1 = `SELECT * FROM custom_final_scan WHERE barcode = '${barcode}' order by scantime`;
    // console.log(query1)
    const [results, fields] = await connection.query(query1);
    const barcode_list = results.map(({barcode}) => `'${barcode}'`)
    const query2 = `SELECT WorkUser_MOrderCode, WorkUser_BarCode, WorkUser_LineName FROM bns_pm_operation where WorkUser_BarCode in (${barcode_list})`
    const [mes_results, mes_fields] = await mes_connection.query(query2)
    const query3 = "SELECT model, barcode FROM oilcharger";
    const [results2, fields2] = await connection.query(query3)
    const joinedData = joinData_final(results, mes_results, results2)
    res.json(joinedData)
  } catch (error) {
    res.status(500).json({message: error})
  } finally {
    connection.destroy()
  }
})

function joinData_final(data1, data2, data3) {
  const joinedData = [];
  const map1 = new Map(data1.map((entry) => [entry.barcode, entry]));
  const map3 = new Map(data3.map((entry) => [entry.barcode, entry]));
  data2.forEach((entry2) => {
    const matchingEntry1 = map1.get(entry2.WorkUser_BarCode);
    const matchingEntry3 = map3.get(entry2.WorkUser_BarCode);
    if (matchingEntry1 && matchingEntry3) {
      const joinedEntry = {
        ...entry2,
        ...matchingEntry1,
        ...matchingEntry3,
      };
      joinedData.push(joinedEntry);
    }
  });
  return joinedData;
}

module.exports = router;