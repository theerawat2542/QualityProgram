const express = require("express");
const { connect78Database, connectMes9771Database } = require("../../helper/db-util");
const router = express.Router();

router.get("/", async (req, res) => {
    let connection;
    let mes_connection;
    const { barcode } = req.query;
    try {
      connection = await connect78Database();
      mes_connection = await connectMes9771Database();

      // Get defect records
      const query1 = `SELECT * FROM defect WHERE material_barcode = '${barcode}' order by scan_time desc`;
      const [results] = await connection.query(query1);

      // Get reason details for each defect
      const resultsWithReason = await Promise.all(results.map(async (record) => {
        const isFullCode = record.defect_barcode.includes('|');
        let reasonQuery;

        if (isFullCode) {
          reasonQuery = `SELECT
            P.Phenomenon_Reason_Name,
            L.Defect_Location_Name
          FROM
            base_phenomenon_reason AS P
          CROSS JOIN
            base_defect_location AS L
          WHERE
            P.Phenomenon_Reason_Code = SUBSTRING_INDEX('${record.defect_barcode}', '|', 1)
            AND L.Defect_Location_Code = SUBSTRING_INDEX('${record.defect_barcode}', '|', -1)`;
        } else {
          reasonQuery = `SELECT
            P.Phenomenon_Reason_Name
          FROM
            base_phenomenon_reason AS P
          WHERE
            P.Phenomenon_Reason_Code = '${record.defect_barcode}'`;
        }

        const [reasonResult] = await mes_connection.query(reasonQuery);
        return {
          ...record,
          reason: reasonResult[0]
            ? isFullCode
              ? `${reasonResult[0].Phenomenon_Reason_Name} - ${reasonResult[0].Defect_Location_Name}`
              : `${reasonResult[0].Phenomenon_Reason_Name} (No Location)`
            : 'Unknown'
        };
      }));

      const barcode_list = results.map(({material_barcode}) => `'${material_barcode}'`);
      const query2 = `SELECT WorkUser_MOrderCode, WorkUser_BarCode, WorkUser_LineName, WorkUser_RightMostItemName
                     FROM bns_pm_operation
                     WHERE WorkUser_BarCode in (${barcode_list})`;
      const [mes_results] = await mes_connection.query(query2);

      const joinedData = joinData_compressor(resultsWithReason, mes_results);
      res.json(joinedData);
    } catch (error) {
      console.error(error);
      res.status(500).json({message: error.message});
    } finally {
      if (connection) connection.destroy();
      if (mes_connection) mes_connection.destroy();
    }
});

function joinData_compressor(data1, data2) {
  const joinedData = [];
  const map1 = new Map(data1.map((entry) => [entry.material_barcode, entry]));
  data2.forEach((entry2) => {
    const matchingEntry1 = map1.get(entry2.WorkUser_BarCode);
    if (matchingEntry1) {
      const joinedEntry = {
        ...entry2,
        ...matchingEntry1
      };
      joinedData.push(joinedEntry);
    }
  });
  return joinedData;
}

module.exports = router;