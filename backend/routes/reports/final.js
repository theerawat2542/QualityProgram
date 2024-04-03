const express = require("express");
const { connectMes9771Database } = require("../../helper/db-util");
const router = express.Router();

router.get("/", async (req, res) => {
  let mes_connection;
  const { startDate, endDate } = req.query;
  try {
    mes_connection = await connectMes9771Database();
    const query = `
      SELECT
      x.Create_Date AS "ScanTime",
      CASE
        WHEN x.Quality_State = 1 THEN 'QC-OK'
        WHEN x.Quality_State = 0 THEN 'QC-NG'
        ELSE x.Quality_State
      END AS "QcState",
      x.Order_Code AS "Order",
      x.Prod_Code AS "MatCode",
      b.WorkUser_RightMostItemName as "Model",
      x.WorkUser_BarCode AS "Barcode",
      x.Work_Cell_Code AS "StationCode",
      y.Work_Cell_Desc AS "StationName",
      x.Production_Line_Code AS "PdCode",
      x.ScanUserCode AS "ScanBy",
      z.UserName  AS "ScanByName",
      x.Team_Code AS "TeamCode",
      x.Shift_Code AS "ShiftCode",
      x.Create_Date AS "CreateDate",
      x.ARRIVE_TIME AS "ArriveTime",
      x.LEAVE_TIME AS "LeaveTime",
      x.ENTERPRISE_ID AS "IPAddess",
      x.ENTERPRISE_CODE AS "MacAddess",
      x.ClientVersion AS "MesVersion"
      FROM bns_pm_prodprocess x
      LEFT JOIN pm_work_cells_t y ON x.Work_Cell_Code = y.Work_Cell_Code
      LEFT JOIN base_user_extend z ON x.ScanUserCode = z.UserCode
      LEFT JOIN bns_pm_operation b ON x.WorkUser_BarCode = b.WorkUser_BarCode
      WHERE x.Create_Date >= '${startDate}' AND x.Create_Date <= '${endDate}' AND x.Work_Cell_Code IN ('RB0019')
      ORDER BY x.Create_Date DESC;
    `;
    const [result, field] = await mes_connection.query(query);
    // console.log(result)
    // console.log(field)
    res.json(result);
  } catch (error) {
    console.error("Error executing query:", error);
    res.status(500).json({ message: error });
  } finally {
    if (mes_connection) {
      mes_connection.destroy();
    }
  }
});

module.exports = router;
