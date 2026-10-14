
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import { API_URL } from "../../lib/config";
import "./Styles.css";

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
        <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l-4.58 4.59L10 18z" />
      </svg>
    </div>
  );
};

const formatDateTime = (dateTimeString) => {
  if (
    !dateTimeString ||
    dateTimeString === "0"
  ) {
    return "-";
  }

  const dateTime = new Date(dateTimeString);

  if (Number.isNaN(dateTime.getTime())) {
    return dateTimeString;
  }

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
  // Station 1: Charging R600
  if (oil_status !== "OK" || oil_barcode === "0") {
    return (
      <h4>
        Current Station: <b>Charging R600</b>
      </h4>
    );
  }

  // Station 2: Compressor
  if (comp_status === "0") {
    return (
      <h4>
        Current Station: <b>Compressor</b>
      </h4>
    );
  }

  // Station 3: Cooling Test
  // ต้องมีผล Qualified จึงจะไปสถานีถัดไปได้
  if (
    cooling_barcode === "0" ||
    cooling_status !== "Qualified"
  ) {
    return (
      <h4>
        Current Station: <b>Cooling Test</b>
      </h4>
    );
  }

  // Station 4: Safety Test
  if (safety_status === "0") {
    return (
      <h4>
        Current Station: <b>Safety Test</b>
      </h4>
    );
  }

  // Station 5: Final
  if (final_status === "0") {
    return (
      <h4>
        Current Station: <b>Final</b>
      </h4>
    );
  }

  return (
    <h4>
      Current Station: <b>Complete</b>
    </h4>
  );
};

const ButtonRowWithArrows = ({ barcode }) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const [showOilBarcode, setShowOilBarcode] = useState(false);
  const [showCompBarcode, setShowCompBarcode] = useState(false);
  const [showCoolingBarcode, setShowCoolingBarcode] = useState(false);
  const [showFinalBarcode, setShowFinalBarcode] = useState(false);
  const [showSafetyBarcode, setShowSafetyBarcode] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      if (!barcode || !barcode.trim() || barcode.trim().length !== 20) {
        setData(null);
        setError(null);

        setShowOilBarcode(false);
        setShowCompBarcode(false);
        setShowCoolingBarcode(false);
        setShowFinalBarcode(false);
        setShowSafetyBarcode(false);

        return;
      }

      try {
        setError(null);

        const response = await axios.get(`${API_URL}/station`, {
          params: {
            barcode: barcode.trim(),
          },
        });

        if (!cancelled) {
          setData(response.data);
        }
      } catch (error) {
        if (!cancelled) {
          setData(null);
          setError(error.message || "Unable to fetch station data");
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [barcode]);

  const hasStationData =
    data &&
    data.station78Data &&
    data.station78Data.length > 0;

  const stationData = hasStationData
    ? data.station78Data[0]
    : null;

  const OilButtonClick = () => {
    if (!hasStationData) return;

    setShowOilBarcode(true);
    setShowCompBarcode(false);
    setShowCoolingBarcode(false);
    setShowFinalBarcode(false);
    setShowSafetyBarcode(false);
  };

  const CompButtonClick = () => {
    if (!hasStationData) return;

    setShowCompBarcode(true);
    setShowOilBarcode(false);
    setShowCoolingBarcode(false);
    setShowFinalBarcode(false);
    setShowSafetyBarcode(false);
  };

  const CoolingButtonClick = () => {
    if (!hasStationData) return;

    setShowCoolingBarcode(true);
    setShowOilBarcode(false);
    setShowCompBarcode(false);
    setShowFinalBarcode(false);
    setShowSafetyBarcode(false);
  };

  const FinalButtonClick = () => {
    if (!hasStationData) return;

    setShowFinalBarcode(true);
    setShowOilBarcode(false);
    setShowCompBarcode(false);
    setShowCoolingBarcode(false);
    setShowSafetyBarcode(false);
  };

  const SafetyButtonClick = () => {
    if (!hasStationData) return;

    setShowSafetyBarcode(true);
    setShowOilBarcode(false);
    setShowCompBarcode(false);
    setShowCoolingBarcode(false);
    setShowFinalBarcode(false);
  };

  const oilStatus = stationData?.oil_status;
  const compStatus = stationData?.comp_status;
  const coolingStatus = stationData?.cooling_status;
  const finalStatus = stationData?.final_status;
  const safetyStatus = stationData?.safety_status;

  const oilBarcode = stationData?.oil_barcode;
  const coolBarcode = stationData?.cooling_barcode;

  const allValuesZero =
    stationData &&
    oilBarcode === "0" &&
    compStatus === "0" &&
    coolBarcode === "0" &&
    finalStatus === "0" &&
    safetyStatus === "0";

  return (
    <div>
      {/* Current Station */}
      <div className="centered-container">
        {hasStationData && !allValuesZero && (
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

      {/* Station Buttons */}
      <div className="centered-container">
        <div className="button-row">
          {/* Station 1: Charging R600 */}
          {hasStationData &&
          oilBarcode !== "0" &&
          oilStatus !== "0" ? (
            oilStatus === "NG" ? (
              <button
                className="large-yellow-button"
                title={`Oil Charger Time: ${formatDateTime(
                  stationData.oil_charge_time
                )}`}
                onClick={OilButtonClick}
              >
                (1) Charging R600
              </button>
            ) : oilStatus === "OK" ? (
              <button
                className="large-green-button"
                title={`Oil Charger Time: ${formatDateTime(
                  stationData.oil_charge_time
                )}`}
                onClick={OilButtonClick}
              >
                (1) Charging R600
              </button>
            ) : (
              <button className="large-gray-button" disabled>
                (1) Charging R600
              </button>
            )
          ) : (
            <button className="large-gray-button" disabled>
              (1) Charging R600
            </button>
          )}

          <ArrowRight />

          {/* Station 2: Compressor */}
          {hasStationData && stationData.comp_status !== "0" ? (
            <button
              className="large-green-button"
              title={`Scan Compressor Time: ${formatDateTime(
                stationData.comp_time
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

          {/* Station 3: Cooling Test */}
          {hasStationData && stationData.cooling_barcode !== "0" ? (
            stationData.cooling_status === "Qualified" ? (
              <button
                className="large-green-button"
                title={`Cooling Test Time: ${formatDateTime(
                  stationData.cooling_time
                )}`}
                onClick={CoolingButtonClick}
              >
                (3) Cooling Test
              </button>
            ) : (
              <button
                className="large-yellow-button"
                title={`Cooling Test Time: ${formatDateTime(
                  stationData.cooling_time
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

          {/* Station 4: Safety Test */}
          {hasStationData && stationData.safety_status !== "0" ? (
            <button
              className="large-green-button"
              title={`Safety Test Time: ${formatDateTime(
                stationData.safety_time
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

          {/* Station 5: Final */}
          {hasStationData && stationData.final_status !== "0" ? (
            <button
              className="large-green-button"
              title={`Scan Final Time: ${formatDateTime(
                stationData.final_time
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

      {/* API Error */}
      {error && <p>Error: {error}</p>}

      {/* Station Details */}
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
