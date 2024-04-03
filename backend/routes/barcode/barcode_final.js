const express = require("express");
const { connectMes9771Database } = require("../../helper/db-util");
const router = express.Router();

router.get("/", async (req, res) => {
  let mes_connection;
  const { barcode } = req.query;
  try {
    mes_connection = await connectMes9771Database();
    const query = `
    SELECT 
        x.Create_Date AS "ScanTime",
        CASE 
                WHEN x.Quality_State = 1 THEN 'QC-OK'
                WHEN x.Quality_State = 0 THEN 'QC-NG'
                ELSE x.Quality_State
        END AS "QcState", -- 1 = QCOK, 0 = QCNG
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
        , x.*
FROM bns_pm_prodprocess x
LEFT JOIN pm_work_cells_t y ON x.Work_Cell_Code = y.Work_Cell_Code
LEFT JOIN base_user_extend z ON x.ScanUserCode = z.UserCode
left join bns_pm_operation b on x.WorkUser_BarCode = b.WorkUser_BarCode
WHERE 1=1
AND x.Work_Cell_Code in ('RB0019') 
AND x.WorkUser_BarCode IN ( 
    '${barcode}'
)
ORDER BY x.Create_Date DESC;
`;
    const [result, field] = await mes_connection.query(query);
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
