import axios from "axios";
import React, { useState, useEffect } from "react";
import { CSVLink } from "react-csv";
import ReactLoading from "react-loading";
import { FaFileExcel } from "react-icons/fa";
import Navbar from "../Navbar/Navbar";
import { format, parse, isValid } from "date-fns";
import "../Report.css";
import { API_URL } from "../../lib/config";
import { Alert } from "antd";

function Charge() {
  const [data, setData] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modelFilter, setModelFilter] = useState("");
  const [barcodeFilter, setBarcodeFilter] = useState("");
  const [orderNoFilter, setOrderNoFilter] = useState("");
  const [lineFilter, setLineFilter] = useState("");
  const [startdate, setStartDate] = useState("");
  const [enddate, setEndDate] = useState("");
  const [tempStartDate, setTempStartDate] = useState("");
  const [tempEndDate, setTempEndDate] = useState("");
  const [row, setRow] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [alertMessage, setAlertMessage] = useState(null);

  const startDate = isValid(parse(tempStartDate, "yyyy-MM-dd", new Date()))
    ? tempStartDate
    : "";
  const endDate = isValid(parse(tempEndDate, "yyyy-MM-dd", new Date()))
    ? tempEndDate
    : "";

  const handleSearch = () => {
    if (tempStartDate && tempEndDate) {
      setLoading(true);
      setStartDate(tempStartDate);
      setEndDate(tempEndDate);
      setCurrentPage(1); // Reset currentPage to 1 when searching/filtering

      axios
        .get(
          `${API_URL}/oilcharger?startDate=${tempStartDate}&endDate=${tempEndDate}`
        )
        .then((res) => {
          setData(
            res.data.map((record) => ({
              ...record,
              datetime: format(
                new Date(record.datetime),
                "yyyy-MM-dd HH:mm:ss"
              ),
            }))
          );
          setTotalPages(row === -1 ? 1 : Math.ceil(res.data.length / row));
          setLoading(false); // Set loading to false after data is fetched
          filterRecords(); // Call filterRecords after data is fetched
        })
        .catch((err) => {
          setAlertMessage({
            description: "No data. Select new date.",
            type: "info",
            message: "ประกาศ!",
          });
          setTimeout(() => {
            setAlertMessage(null);
          }, 4000);
          setLoading(false); // Set loading to false in case of error
        });
    } else {
      setAlertMessage({
        description: "Please enter both start date and end date.",
        type: "warning",
        message: "คำเตือน!",
      });
      setTimeout(() => {
        setAlertMessage(null);
      }, 4000);
    }
  };

  useEffect(() => {
    filterRecords();
  }, [
    lineFilter,
    modelFilter,
    barcodeFilter,
    orderNoFilter,
    currentPage,
    row,
    data,
  ]);

  const filterRecords = () => {
    let filteredRecords = data.filter((record) => {
      let matchesLine = true;
      let matchesModel = true;
      let matchesBarcode = true;
      let matchesOrderNo = true;

      if (lineFilter !== "") {
        matchesLine = record.WorkUser_LineName.toLowerCase().includes(
          lineFilter.toLowerCase()
        );
      }
      if (modelFilter !== "") {
        matchesModel = record.model
          .toLowerCase()
          .includes(modelFilter.toLowerCase());
      }
      if (barcodeFilter !== "") {
        matchesBarcode = record.barcode
          .toLowerCase()
          .includes(barcodeFilter.toLowerCase());
      }
      if (orderNoFilter !== "") {
        matchesOrderNo = record.WorkUser_MOrderCode.toLowerCase().includes(
          orderNoFilter.toLowerCase()
        );
      }

      return matchesLine && matchesModel && matchesBarcode && matchesOrderNo;
    });

    // Apply pagination or show all records if row is set to -1 (All)
    let startIndex = 0;
    let endIndex = filteredRecords.length;

    if (row !== -1) {
      startIndex = (currentPage - 1) * row;
      endIndex = startIndex + row;
    }

    setRecords(filteredRecords.slice(startIndex, endIndex));
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleRowChange = (e) => {
    setRow(parseInt(e.target.value));
  };

  const handleClear = () => {
    setTempStartDate("");
    setTempEndDate("");
    setData([]);
    setModelFilter("");
    setBarcodeFilter("");
    setLineFilter("");
    setOrderNoFilter("");
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner-container">
          <ReactLoading type={"spin"} color={"blue"} height={64} width={64} />
        </div>
      </div>
    );
  }
  if (error) {
    return <div className="loading-container">Error: {error}</div>;
  }

  const headers = [
    { label: "Production Line", key: "WorkUser_LineName" },
    { label: "Model", key: "model" },
    { label: "Order No.", key: "WorkUser_MOrderCode" },
    { label: "Barcode", key: "barcode" },
    { label: "Date/Time", key: "datetime" },
    { label: "Program", key: "program" },
    { label: "R600/Setpoint", key: "r600_setpoint" },
    { label: "R600/Actum", key: "r600_actum" },
    { label: "Status", key: "status" },
    { label: "Alarm", key: "alarm" },
  ];

  return (
    <div>
      <Navbar />
      <h2 className="text-center">
        <b>Charge R600a</b>
      </h2>
      <br />
      <div className="App container">
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ marginRight: "auto" }}>
            <label style={{ marginRight: "10px" }}>Start Date:</label>
            <input
              type="date"
              value={tempStartDate}
              onChange={(e) => {
                setTempStartDate(e.target.value);
                setTempEndDate(e.target.value);
              }}
            />
            <label style={{ marginLeft: "10px", marginRight: "10px" }}>
              End Date:
            </label>
            <input
              type="date"
              value={tempEndDate}
              onChange={(e) => setTempEndDate(e.target.value)}
            />
            <button
              onClick={handleSearch}
              className="btn btn-primary"
              style={{ marginLeft: "10px" }}
            >
              Search
            </button>
            <button
              onClick={handleClear}
              className="btn btn-warning"
              style={{ marginLeft: "10px" }}
            >
              Clear
            </button>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <label>Select Rows:</label>
            <select
              value={row}
              onChange={handleRowChange}
              style={{ marginLeft: "10px" }}
            >
              <option value="10">10 rows</option>
              <option value="50">50 rows</option>
              <option value="100">100 rows</option>
              <option value="1000">1000 rows</option>
              <option value="-1">All</option>
            </select>
          </div>
        </div>
        <div className="bg-white shadow border">
          <div style={{ textAlign: "right" }}>
            <CSVLink
              data={data}
              headers={headers}
              filename={`oilcharger_${startDate.replace(
                /-/g,
                ""
              )}_${endDate.replace(/-/g, "")}.csv`}
              style={{
                color: "green",
                display: "inline-block",
                textDecoration: "none", // Remove underline from the link
              }}
            >
              <div style={{ display: "flex", alignItems: "center" }}>
                <FaFileExcel style={{ marginRight: "5px" }} />
                Download
              </div>
            </CSVLink>
          </div>
          <div className="table-responsive">
            <table className="table table-striped table-hover">
              <thead className="thead-dark">
                <tr>
                <th><center>No.</center></th>
                  <th>
                    <center>
                      <label>Production Line</label>
                    </center>
                    <input
                      type="text"
                      className="form-control input-sm"
                      placeholder="Search Line"
                      value={lineFilter}
                      onChange={(e) => {
                        setLineFilter(e.target.value);
                        setCurrentPage(1); // Reset currentPage to 1
                      }}
                    />
                  </th>
                  <th>
                    <center>
                      <label>Model</label>
                    </center>
                    <input
                      type="text"
                      className="form-control input-sm"
                      placeholder="Search Model"
                      value={modelFilter}
                      onChange={(e) => {
                        setModelFilter(e.target.value);
                        setCurrentPage(1); // Reset currentPage to 1
                      }}
                    />
                  </th>
                  <th>
                    <center>
                      <label>Order No.</label>
                    </center>
                    <input
                      type="text"
                      className="form-control input-sm"
                      placeholder="Search Order No."
                      value={orderNoFilter}
                      onChange={(e) => {
                        setOrderNoFilter(e.target.value);
                        setCurrentPage(1); // Reset currentPage to 1
                      }}
                    />
                  </th>
                  <th>
                    <center>
                      <label>Barcode</label>
                    </center>
                    <input
                      type="text"
                      className="form-control input-sm"
                      placeholder="Search Barcode"
                      value={barcodeFilter}
                      onChange={(e) => {
                        setBarcodeFilter(e.target.value);
                        setCurrentPage(1); // Reset currentPage to 1
                      }}
                    />
                  </th>

                  <th>Date/Time</th>
                  <th>Program</th>
                  <th>R600/Setpoint</th>
                  <th>R600/Actum</th>
                  <th>Status</th>
                  <th>Alarm</th>
                </tr>
              </thead>
              <tbody>
                {records.map((d, i) => (
                  <tr key={i}>
                    <td>{i+1}</td>
                    <td>{d.WorkUser_LineName}</td>
                    <td>{d.model}</td>
                    <td>{d.WorkUser_MOrderCode}</td>
                    <td>{d.barcode}</td>
                    <td>
                      <center>{d.datetime}</center>
                    </td>{" "}
                    {/* No need to format again */}
                    <td>
                      <center>{d.program}</center>
                    </td>
                    <td>
                      <center>{d.r600_setpoint}</center>
                    </td>
                    <td>
                      <center>{d.r600_actum}</center>
                    </td>
                    <td>
                      <center>
                        <label
                          style={{
                            backgroundColor:
                              d.status === "OK" ? "#32FF42" : "#FC7D79",
                            borderRadius: 5,
                            padding: "2px 4px 2px 4px",
                          }}
                        >
                          {d.status}
                        </label>
                      </center>
                    </td>
                    <td>
                      <center>{d.alarm}</center>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <center>
            {row !== -1 && (
              <div className="pagination-container">
                <nav aria-label="Pagination">
                  <ul className="pagination">
                    <li
                      className={`page-item ${
                        currentPage === 1 ? "disabled" : ""
                      }`}
                    >
                      <button
                        className="page-link"
                        onClick={() => handlePageChange(currentPage - 1)}
                      >
                        <span aria-hidden="true">&lt;</span>
                        <span className="sr-only">Previous</span>
                      </button>
                    </li>
                    {[...Array(totalPages).keys()].map((pageNumber) => {
                      if (
                        pageNumber === 0 ||
                        pageNumber === currentPage - 1 ||
                        pageNumber === currentPage ||
                        pageNumber === currentPage + 1 ||
                        pageNumber === totalPages - 1
                      ) {
                        return (
                          <li
                            key={pageNumber}
                            className={`page-item ${
                              currentPage === pageNumber + 1 ? "active" : ""
                            }`}
                          >
                            <button
                              className="page-link"
                              onClick={() => handlePageChange(pageNumber + 1)}
                            >
                              {pageNumber + 1}
                            </button>
                          </li>
                        );
                      } else if (
                        pageNumber === 1 ||
                        pageNumber === currentPage - 2 ||
                        pageNumber === currentPage + 2 ||
                        pageNumber === totalPages - 2
                      ) {
                        return (
                          <li key={pageNumber} className="ellipsis">
                            ...
                          </li>
                        );
                      }
                      return null;
                    })}
                    <li
                      className={`page-item ${
                        currentPage === totalPages ? "disabled" : ""
                      }`}
                    >
                      <button
                        className="page-link"
                        onClick={() => handlePageChange(currentPage + 1)}
                      >
                        <span aria-hidden="true">&gt;</span>
                        <span className="sr-only">Next</span>
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            )}
          </center>
        </div>
        {alertMessage && (
          <Alert
            description={alertMessage.description}
            message={alertMessage.message}
            type={alertMessage.type}
            closable
          />
        )}
      </div>
    </div>
  );
}

export default Charge;