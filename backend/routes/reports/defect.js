const express = require("express");
const { connect78Database, connectMes9771Database } = require("../../helper/db-util");
const router = express.Router();

router.get("/", async (req, res) => {
    let connection78;
    let connection9771;
    const { startDate, endDate } = req.query;
    try {
      connection78 = await connect78Database();
      connection9771 = await connectMes9771Database();

      const query = `SELECT
                      material_barcode,
                      defect_barcode,
                      scan_time,
                      user_id,
                      production_line
                    FROM defect
                    WHERE scan_time >= '${startDate}'
                      AND scan_time <= DATE_ADD('${endDate}', INTERVAL 1 DAY)
                    ORDER BY scan_time DESC`;

      const [defectResults] = await connection78.query(query);

      // Get reason details for each defect
      const defectsWithReason = await Promise.all(
        defectResults.map(async (defect) => {
          // Check if defect barcode contains separator
          const isFullCode = defect.defect_barcode.includes('|');
          let reasonQuery;

          if (isFullCode) {
            reasonQuery = `SELECT
              CONCAT(P.Phenomenon_Reason_Code, '|', L.Defect_Location_Code) AS Logic_Code,
              P.Phenomenon_Reason_Name,
              L.Defect_Location_Name
            FROM
              cosmo_im_9771.base_phenomenon_reason AS P
            CROSS JOIN
              cosmo_im_9771.base_defect_location AS L
            WHERE
              P.Phenomenon_Reason_Code = SUBSTRING_INDEX('${defect.defect_barcode}', '|', 1)
              AND L.Defect_Location_Code = SUBSTRING_INDEX('${defect.defect_barcode}', '|', -1)`;
          } else {
            // For reason-only codes (7 digits)
            reasonQuery = `SELECT
              P.Phenomenon_Reason_Code AS Logic_Code,
              P.Phenomenon_Reason_Name,
              'No Location' AS Defect_Location_Name
            FROM
              cosmo_im_9771.base_phenomenon_reason AS P
            WHERE
              P.Phenomenon_Reason_Code = '${defect.defect_barcode}'`;
          }

          const [reasonResults] = await connection9771.query(reasonQuery);
          return {
            ...defect,
            reason: reasonResults[0]
              ? isFullCode
                ? `${reasonResults[0].Phenomenon_Reason_Name} - ${reasonResults[0].Defect_Location_Name}`
                : `${reasonResults[0].Phenomenon_Reason_Name} (No Location)`
              : 'Unknown'
          };
        })
      );

      res.json(defectsWithReason);
    } catch (error) {
      res.status(500).json({message: error});
    } finally {
      if (connection78) connection78.destroy();
      if (connection9771) connection9771.destroy();
    }
});

function joinData_defect(data1, data2) {
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
  joinedData.sort((a, b) => new Date(b.scan_time) - new Date(a.scan_time));
  return joinedData;
}

module.exports = router;