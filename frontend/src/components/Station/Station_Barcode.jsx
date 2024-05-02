import React, { useState, useEffect } from "react";
import { API_URL } from "../../lib/config";
import "./Styles.css"; // Assuming you have a separate CSS file for styling
import OilBarcode from "../ChargeR600/Oil_Barcode";
import CompBarcode from "../Compressor/Compressor_Barcode";
import CoolingBarcode from "../CoolingTest/Cooling_Barcode";
import FinalBarcode from "../Final/Final_Barcode";
import SafetyBarcode from "../Safety/Safety_Barcode";
import axios from "axios";

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
  oil_status,
  comp_status,
  cooling_status,
  final_status,
  safety_status,
  oil_barcode,
  cooling_barcode,
}) => {
  if (oil_status === "OK" && oil_barcode !== "0") {
    if (comp_status !== "0") {
      if (cooling_status === "OK" && cooling_barcode !== "0") {
        if (safety_status !== "0") {
          if (final_status !== "0") {
            return (
              <h4>
                Current Station: <b>Complete</b>
              </h4>
            );
          } else {
            return (
              <h4>
                Current Station: <b>Final</b>
              </h4>
            );
          }
        } else {
          return (
            <h4>
              Current Station: <b>Safety Test</b>
            </h4>
          );
        }
      } else if (cooling_status === "0") {
        return (
          <h4>
            Current Station: <b>Cooling Test</b>
          </h4>
        );
      }
    } else {
      return (
        <h4>
          Current Station: <b>Compressor</b>
        </h4>
      );
    }
  } else if (oil_status === "NG" || oil_status === "0" || oil_barcode === "0") {
    return (
      <h4>
        Current Station: <b>Charging R600</b>
      </h4>
    );
  }

  // Check scanCompressorStatus conditions
  if (comp_status === "0") {
    return (
      <h4>
        Current Station: <b>Compressor</b>
      </h4>
    );
  }

  // Check coolingStatus conditions
  if (
    cooling_status === "NG" ||
    cooling_status === "0" ||
    cooling_barcode === "0"
  ) {
    return (
      <h4>
        Current Station: <b>Cooling Test</b>
      </h4>
    );
  }

  // Check safetyStatus conditions
  if (safety_status === "0") {
    return (
      <h4>
        Current Station: <b>Safety Test</b>
      </h4>
    );
  }

  // Check scanFinalStatus conditions
  if (final_status === "0") {
    return (
      <h4>
        Current Station: <b>Final</b>
      </h4>
    );
  }

  return null; // Default return, in case none of the conditions match
};

const ButtonRowWithArrows = ({ barcode }) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [showOilBarcode, setShowOilBarcode] = useState(false);
  const [showCompBarcode, setShowCompBarcode] = useState(false);
  const [showCoolingBarcode, setShowCoolingBarcode] = useState(false);
  const [showFinalBarcode, setShowFinalBarcode] = useState(false);
  const [showSafetyBarcode, setShowSafetyBarcode] = useState(false);
  // const [station, setStation] = useState("No station")

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${API_URL}/station`, {
          params: {
            barcode: barcode || "0", // Set default value '0' if barcode is null
          },
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
      setShowSafetyBarcode(false);
    }
  };
  const CompButtonClick = () => {
    if (data && data.station78Data && data.station78Data.length > 0) {
      setShowCompBarcode(true);
      setShowOilBarcode(false);
      setShowCoolingBarcode(false);
      setShowFinalBarcode(false);
      setShowSafetyBarcode(false);
    }
  };
  const CoolingButtonClick = () => {
    if (data && data.station78Data && data.station78Data.length > 0) {
      setShowCoolingBarcode(true);
      setShowCompBarcode(false);
      setShowOilBarcode(false);
      setShowFinalBarcode(false);
      setShowSafetyBarcode(false);
    }
  };
  const FinalButtonClick = () => {
    if (data && data.station78Data && data.station78Data.length > 0) {
      setShowFinalBarcode(true);
      setShowCoolingBarcode(false);
      setShowCompBarcode(false);
      setShowOilBarcode(false);
      setShowSafetyBarcode(false);
    }
  };
  const SafetyButtonClick = () => {
    if (data && data.station78Data && data.station78Data.length > 0) {
      setShowSafetyBarcode(true);
      setShowOilBarcode(false);
      setShowCompBarcode(false);
      setShowCoolingBarcode(false);
      setShowFinalBarcode(false);
    }
  };
  useEffect(() => {
    if (!barcode || !barcode.trim() || barcode.trim().length >= 20) {
      setShowOilBarcode(false);
      setShowCompBarcode(false);
      setShowCoolingBarcode(false);
      setShowFinalBarcode(false);
      setShowSafetyBarcode(false);
      // setStation("No Station")
    }
  }, [barcode]);

  const oilStatus = data?.station78Data?.[0]?.oil_status;
  const compStatus = data?.station78Data?.[0]?.comp_status;
  const coolingStatus = data?.station78Data?.[0]?.cooling_status;
  const finalStatus = data?.station78Data?.[0]?.final_status;
  const safetyStatus = data?.station78Data?.[0]?.safety_status;
  const oilBarcode = data?.station78Data?.[0]?.oil_barcode;
  const coolBarcode = data?.station78Data?.[0]?.cooling_barcode;
  const allValuesZero =
    oilBarcode === "0" &&
    compStatus === "0" &&
    coolBarcode === "0" &&
    finalStatus === "0" &&
    safetyStatus === "0";
  return (
    <div>
      <div className="centered-container">
        {!allValuesZero && (
          <CurrentStation
            oil_status={oilStatus}
            comp_status={compStatus}
            cooling_status={coolingStatus}
            final_status={finalStatus}
            safety_status={safetyStatus}
            oil_barcode={oilBarcode}
            cooling_barcode={coolBarcode}
          />
        )}
      </div>
      <br />
      <div className="centered-container">
        <div className="button-row">
          {data &&
          data.station78Data &&
          data.station78Data.length > 0 &&
          data.station78Data[0].oil_barcode !== "0" && // Check if barcode exists and has a length greater than 0
          data.station78Data[0].oil_status !== "0" ? (
            data.station78Data[0].oil_status === "NG" ||
            data.station78Data[0].oil_status === "0" ? (
              <button
                className="large-yellow-button"
                title={`Oil Charger Time: ${formatDateTime(
                  data.station78Data[0].oil_charge_time
                )}`}
                onClick={OilButtonClick}
              >
                (1) Charging R600
              </button>
            ) : (
              <button
                className="large-green-button"
                title={`Oil Charger Time: ${formatDateTime(
                  data.station78Data[0].oil_charge_time
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
          data.station78Data[0].comp_status === "0" ? (
            <button className="large-gray-button" disabled>
              (2) Scan Compressor
            </button>
          ) : data &&
            data.station78Data &&
            data.station78Data.length > 0 &&
            data.station78Data[0].comp_status !== "0" ? (
            <button
              className="large-green-button"
              title={`Scan Compressor Time: ${formatDateTime(
                data.station78Data[0].comp_time
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
          data.station78Data[0].cooling_barcode !== "0" && // Check if barcode exists and has a length greater than 0
          data.station78Data[0].cooling_status !== "0" ? (
            data.station78Data[0].cooling_status === "NG" ||
            data.station78Data[0].cooling_status === "0" ? (
              <button
                className="large-yellow-button"
                title={`Cooling Test Time: ${formatDateTime(
                  data.station78Data[0].cooling_time
                )}`}
                onClick={CoolingButtonClick}
              >
                (3) Cooling Test
              </button>
            ) : (
              <button
                className="large-green-button"
                title={`Cooling Test Time: ${formatDateTime(
                  data.station78Data[0].cooling_time
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

          {data &&
          data.station78Data &&
          data.station78Data.length > 0 &&
          data.station78Data[0].safety_status !== "0" ? (
            <button
              className="large-green-button"
              title={`Safety Test Time: ${formatDateTime(
                data.station78Data[0].safety_time
              )}`}
              onClick={SafetyButtonClick}
            >
              (4) Safety Test
            </button>
          ) : (
            <button className="large-gray-button" disabled>
              (4) Safety Test
            </button>
          )}

          <ArrowRight />

          {data &&
          data.station78Data &&
          data.station78Data.length > 0 &&
          data.station78Data[0].final_status !== "0" ? (
            <button
              className="large-green-button"
              title={`Scan Final Time: ${formatDateTime(
                data.station78Data[0].final_time
              )}`}
              onClick={FinalButtonClick}
            >
              (5) Final
            </button>
          ) : (
            <button className="large-gray-button" disabled>
              (5) Final
            </button>
          )}
        </div>
      </div>
      {error && <p>Error: {error}</p>}
      {barcode.length === 20 && showOilBarcode && (
        <OilBarcode barcode={barcode} />
      )}
      {barcode.length === 20 && showCompBarcode && (
        <CompBarcode barcode={barcode} />
      )}
      {barcode.length === 20 && showCoolingBarcode && (
        <CoolingBarcode barcode={barcode} />
      )}
      {barcode.length === 20 && showFinalBarcode && (
        <FinalBarcode barcode={barcode} />
      )}
      {barcode.length === 20 && showSafetyBarcode && (
        <SafetyBarcode barcode={barcode} />
      )}
    </div>
  );
};

export default ButtonRowWithArrows;