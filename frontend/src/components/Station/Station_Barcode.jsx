import React, { useState, useEffect } from "react";
import { API_URL } from "../../lib/config";
import "./Styles.css"; // Assuming you have a separate CSS file for styling
import OilBarcode from "../ChargeR600/Oil_Barcode";
import CompBarcode from "../Compressor/Compressor_Barcode";
import CoolingBarcode from "../CoolingTest/Cooling_Barcode";
import FinalBarcode from "../Final/Final_Barcode";

const ArrowRight = () => {
  return (
    <div className="arrow-container">
      <svg className="arrow" viewBox="0 0 24 24">
        <path d="M0 0h24v24H0z" fill="none" />
        <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
      </svg>
    </div>
  );
};

const formatDateTime = (dateTimeString) => {
  const dateTime = new Date(dateTimeString);
  const year = dateTime.getFullYear();
  const month = String(dateTime.getMonth() + 1).padStart(2, "0");
  const day = String(dateTime.getDate()).padStart(2, "0");
  const hours = String(dateTime.getHours()).padStart(2, "0");
  const minutes = String(dateTime.getMinutes()).padStart(2, "0");
  const seconds = String(dateTime.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

const CurrentStation = ({
  oilChargerStatus,
  scanCompressorStatus,
  coolingStatus,
  qcState,
}) => {
  if (oilChargerStatus === "OK") {
    if (scanCompressorStatus !== "0") {
      if (coolingStatus === "OK") {
        if (qcState === "QC-OK") {
          return (
            <h4>
              Current Station: <b>Complete</b>
            </h4>
          );
        } else if (qcState === "QC-NG" || qcState === "") {
          return (
            <h4>
              Current Station: <b>Final Scan</b>
            </h4>
          );
        }
        return (
          <h4>
            Current Station: <b>Final Scan</b>
          </h4>
        );
      } else if (
        coolingStatus === "NG" ||
        coolingStatus === "0" ||
        coolingStatus === ""
      ) {
        return (
          <h4>
            Current Station: <b>Cooling Test</b>
          </h4>
        );
      }
    } else {
      return (
        <h4>
          Current Station: <b>Scan Compressor</b>
        </h4>
      );
    }
  } else if (
    oilChargerStatus === "NG" ||
    oilChargerStatus === "0" ||
    oilChargerStatus === ""
  ) {
    return (
      <h4>
        Current Station: <b>Charging R600</b>
      </h4>
    );
  }

  return null;
};

const ButtonRowWithArrows = ({ barcode }) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [showOilBarcode, setShowOilBarcode] = useState(false);
  const [showCompBarcode, setShowCompBarcode] = useState(false);
  const [showCoolingBarcode, setShowCoolingBarcode] = useState(false);
  const [showFinalBarcode, setShowFinalBarcode] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${API_URL}/station?barcode=${barcode}`); // Set default value '0' if barcode is null
        const jsonData = await response.json();
        setData(jsonData);
      } catch (error) {
        setError(error.message);
      }
    };

    fetchData();
  }, [barcode]);

  const OilButtonClick = () => {
    if (data && data.station78Data && data.station78Data.length > 0) {
      setShowOilBarcode(true);
      setShowCompBarcode(false);
      setShowCoolingBarcode(false);
      setShowFinalBarcode(false);
    }
  };
  const CompButtonClick = () => {
    if (data && data.station78Data && data.station78Data.length > 0) {
      setShowCompBarcode(true);
      setShowOilBarcode(false);
      setShowCoolingBarcode(false);
      setShowFinalBarcode(false);
    }
  };
  const CoolingButtonClick = () => {
    if (data && data.station78Data && data.station78Data.length > 0) {
      setShowCoolingBarcode(true);
      setShowCompBarcode(false);
      setShowOilBarcode(false);
      setShowFinalBarcode(false);
    }
  };
  const FinalButtonClick = () => {
    if (data && data.stationMESData && data.stationMESData.length > 0) {
      setShowFinalBarcode(true);
      setShowCoolingBarcode(false);
      setShowCompBarcode(false);
      setShowOilBarcode(false);
    }
  };
  useEffect(() => {
    if (!barcode.trim() || barcode.length !== 20) {
      setShowOilBarcode(false);
      setShowCompBarcode(false);
      setShowCoolingBarcode(false);
      setShowFinalBarcode(false);
    }
  }, [barcode]);

  return (
    <div>
      <div className="centered-container">
        <CurrentStation
          oilChargerStatus={data?.station78Data?.[0]?.OilChargerStatus}
          scanCompressorStatus={data?.station78Data?.[0]?.ScanCompressorStatus}
          coolingStatus={data?.station78Data?.[0]?.CoolingStatus}
          qcState={data?.stationMESData?.[0]?.QcState}
        />
      </div>
      <br />
      <div className="centered-container">
        <div className="button-row">
          {data &&
          data.station78Data &&
          data.station78Data.length > 0 &&
          data.station78Data[0].OilChargerStatus !== "0" ? (
            data.station78Data[0].OilChargerStatus === "NG" ? (
              <button
                className="large-yellow-button"
                title={`Oil Charger Time: ${formatDateTime(
                  data.station78Data[0].OilChargerTime
                )}`}
                onClick={OilButtonClick}
              >
                Charging R600
              </button>
            ) : (
              <button
                className="large-green-button"
                title={`Oil Charger Time: ${formatDateTime(
                  data.station78Data[0].OilChargerTime
                )}`}
                onClick={OilButtonClick}
              >
                Charging R600
              </button>
            )
          ) : (
            <button className="large-gray-button" disabled>
              Charging R600
            </button>
          )}

          <ArrowRight />
          {data &&
          data.station78Data &&
          data.station78Data.length > 0 &&
          data.station78Data[0].ScanCompressorStatus !== "0" ? (
            <button
              className="large-green-button"
              title={`Scan Compressor Time: ${formatDateTime(
                data.station78Data[0].ScanCompressorTime
              )}`}
              onClick={CompButtonClick}
            >
              Scan Compressor
            </button>
          ) : (
            <button className="large-gray-button" disabled>
              Scan Compressor
            </button>
          )}
          <ArrowRight />
          {data &&
          data.station78Data &&
          data.station78Data.length > 0 &&
          data.station78Data[0].CoolingStatus !== "0" ? (
            data.station78Data[0].CoolingStatus === "NG" ? (
              <button
                className="large-yellow-button"
                title={`Cooling Start Time: ${formatDateTime(
                  data.station78Data[0].CoolingStartTime
                )}`}
                onClick={CoolingButtonClick}
              >
                Cooling Test
              </button>
            ) : (
              <button
                className="large-green-button"
                title={`Cooling Start Time: ${formatDateTime(
                  data.station78Data[0].CoolingStartTime
                )}`}
                onClick={CoolingButtonClick}
              >
                Cooling Test
              </button>
            )
          ) : (
            <button className="large-gray-button" disabled>
              Cooling Test
            </button>
          )}

          <ArrowRight />
          {/* {data &&
          data.station78Data &&
          data.station78Data.length > 0 &&
          data.station78Data[0].ScanCompressorStatus !== "0" ? (
            <button
              className="large-green-button"
              title={`Oil Charger Time: ${formatDateTime(
                data.station78Data[0].OilChargerTime
              )}`}
            >
              Safety Test
            </button>
          ) : (
          <button className="large-gray-button" disabled>
            Safety Test
          </button>
          )}
          <ArrowRight /> */}
          {data &&
          data.stationMESData &&
          data.stationMESData.length > 0 &&
          data.stationMESData[0].QcState !== "0" ? (
            data.stationMESData[0].QcState === "QC-NG" ? (
              <button
                className="large-yellow-button"
                title={`Scan Time: ${formatDateTime(
                  data.stationMESData[0].ScanTime
                )}`}
                onClick={FinalButtonClick}
              >
                Final scan
              </button>
            ) : (
              <button
                className="large-green-button"
                title={`Scan Time: ${formatDateTime(
                  data.stationMESData[0].ScanTime
                )}`}
                onClick={FinalButtonClick}
              >
                Final scan
              </button>
            )
          ) : (
            <button className="large-gray-button" disabled>
              Final scan
            </button>
          )}
        </div>
      </div> 
      {error && <p>Error: {error}</p>}
      {showOilBarcode && <OilBarcode barcode={barcode} />}
      {showCompBarcode && <CompBarcode barcode={barcode} />}
      {showCoolingBarcode && <CoolingBarcode barcode={barcode} />}
      {showFinalBarcode && <FinalBarcode barcode={barcode} />}
    </div>
  );
};

export default ButtonRowWithArrows;
