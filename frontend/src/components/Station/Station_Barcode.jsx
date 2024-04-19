import React, { useState, useEffect } from "react";
import { API_URL } from "../../lib/config";
import "./Styles.css"; // Assuming you have a separate CSS file for styling
import OilBarcode from "../ChargeR600/Oil_Barcode";
import CompBarcode from "../Compressor/Compressor_Barcode";
import CoolingBarcode from "../CoolingTest/Cooling_Barcode";
import FinalBarcode from "../Final/Final_Barcode";
import axios from 'axios';

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
  scanFinalStatus,
  // setStation
}) => {
  if (oilChargerStatus === "OK") {
    if (scanCompressorStatus !== "0") {
      if (coolingStatus === "OK") {
        if (scanFinalStatus !== "0") {
          return (
            // setStation("Complete")
            <h4>
              Current Station: <b>Complete</b>
            </h4>
          );
        } else if (scanFinalStatus === "0") {
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
  // const [station, setStation] = useState("No station")

useEffect(() => {
  const fetchData = async () => {
    try {
      const response = await axios.get(`${API_URL}/station`, {
        params: {
          barcode: barcode || '0', // Set default value '0' if barcode is null
        }
      });
      setData(response.data);
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
    if (data && data.station78Data && data.station78Data.length > 0) {
      setShowFinalBarcode(true);
      setShowCoolingBarcode(false);
      setShowCompBarcode(false);
      setShowOilBarcode(false);
    }
  };
  useEffect(() => {
    if (!barcode || !barcode.trim() || barcode.trim().length >= 20) {
      setShowOilBarcode(false);
      setShowCompBarcode(false);
      setShowCoolingBarcode(false);
      setShowFinalBarcode(false);
      // setStation("No Station")
    }
  }, [barcode]);

  return (
    <div>
      <div className="centered-container">
        <CurrentStation
          oilChargerStatus={data?.station78Data?.[0]?.OilChargerStatus}
          scanCompressorStatus={data?.station78Data?.[0]?.ScanCompressorStatus}
          coolingStatus={data?.station78Data?.[0]?.CoolingStatus}
          scanFinalStatus={data?.station78Data?.[0]?.ScanFinalStatus}
          // setStation={setStation}
        />
        {/* <h4>Current Station: <b>{station}</b></h4> */}
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
                (1) Charging R600
              </button>
            ) : (
              <button
                className="large-green-button"
                title={`Oil Charger Time: ${formatDateTime(
                  data.station78Data[0].OilChargerTime
                )}`}
                onClick={OilButtonClick}
              >
                (1) Charging R600
              </button>
            )
          ) : (
            <button className="large-gray-button" disabled>
              (1) Charging R600
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
              (2) Scan Compressor
            </button>
          ) : (
            <button className="large-gray-button" disabled>
              (2) Scan Compressor
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
                (3) Cooling Test
              </button>
            ) : (
              <button
                className="large-green-button"
                title={`Cooling Start Time: ${formatDateTime(
                  data.station78Data[0].CoolingStartTime
                )}`}
                onClick={CoolingButtonClick}
              >
                (3) Cooling Test
              </button>
            )
          ) : (
            <button className="large-gray-button" disabled>
              (3) Cooling Test
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
          data.station78Data &&
          data.station78Data.length > 0 &&
          data.station78Data[0].ScanFinalStatus !== "0" ? (
            <button
              className="large-green-button"
              title={`Scan Final Time: ${formatDateTime(
                data.station78Data[0].ScanFinalTime
              )}`}
              onClick={FinalButtonClick}
            >
              (4) Final
            </button>
          ) : (
            <button className="large-gray-button" disabled>
              (4) Final
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
