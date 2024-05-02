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

function Safety() {
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

  const startDate = isValid(parse(tempStartDate, "yyyy-MM-dd", new Date())) ? tempStartDate : "";
  const endDate = isValid(parse(tempEndDate, "yyyy-MM-dd", new Date())) ? tempEndDate : "";

  const handleSearch = () => {
    if (tempStartDate && tempEndDate) {
      setLoading(true);
      setStartDate(tempStartDate);
      setEndDate(tempEndDate);
      setCurrentPage(1); // Reset currentPage to 1 when searching/filtering

      axios
        .get(
          `${API_URL}/safety?startDate=${tempStartDate}&endDate=${tempEndDate}`
        )
        .then((res) => {
          setData(
            res.data.map((record) => ({
              ...record,
              Time: format(
                new Date(record.Time),
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
        matchesModel = record["Program/Model"]
          .toLowerCase()
          .includes(modelFilter.toLowerCase());
      }
      if (barcodeFilter !== "") {
        matchesBarcode = record.Judgement
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
    { label: "Model", key: "Program/Model" },
    { label: "Order No.", key: "WorkUser_MOrderCode" },
    { label: "Barcode", key: "Judgement" },
    { label: "Date/Time", key: "Time" },
    { label: "Serial", key: "Serial" },
    { label: "s1_HL", key: "s1_HL" },
    { label: "Step1", key: "Step1" },
    { label: "Ss1_Judgetatus", key: "s1_Judge" },
    { label: "s1_LL", key: "s1_LL" },
    { label: "s1_Read1", key: "s1_Read1" },
    { label: "s1_Output", key: "s1_Output" },
    { label: "s1_Read2", key: "s1_Read2" },
    { label: "s2_HL", key: "s2_HL" },
    { label: "Step2", key: "Step2" },
    { label: "s2_Judge", key: "s2_Judge" },
    { label: "s2_LL", key: "s2_LL" },
    { label: "s2_Read1", key: "s2_Read1" },
    { label: "s2_Output", key: "s2_Output" },
    { label: "s2_Read2", key: "s2_Read2" },
    { label: "s3_HL", key: "s3_HL" },
    { label: "Step3", key: "Step3" },
    { label: "s3_Judge", key: "s3_Judge" },
    { label: "s3_LL", key: "s3_LL" },
    { label: "s3_Read1", key: "s3_Read1" },
    { label: "s3_Output", key: "s3_Output" },
    { label: "s3_Read2", key: "s3_Read2" },
    { label: "s4_HL", key: "s4_HL" },
    { label: "Step4", key: "Step4" },
    { label: "s4_Judge", key: "s4_Judge" },
    { label: "s4_LL", key: "s4_LL" },
    { label: "s4_Read1", key: "s4_Read1" },
    { label: "s4_Output", key: "s4_Output" },
    { label: "s4_Read2", key: "s4_Read2" },
    { label: "s5_HL", key: "s5_HL" },
    { label: "Step5", key: "Step5" },
    { label: "s5_Judge", key: "s5_Judge" },
    { label: "s5_LL", key: "s5_LL" },
    { label: "s5_Read1", key: "s5_Read1" },
    { label: "s5_Output", key: "s5_Output" },
    { label: "s5_Read2", key: "s5_Read2" },
    { label: "s6_HL", key: "s6_HL" },
    { label: "Step6", key: "Step6" },
    { label: "s6_Judge", key: "s6_Judge" },
    { label: "s6_LL", key: "s6_LL" },
    { label: "s6_Read1", key: "s6_Read1" },
    { label: "s6_Output", key: "s6_Output" },
    { label: "s6_Read2", key: "s6_Read2" },
    { label: "s7_HL", key: "s7_HL" },
    { label: "Step7", key: "Step7" },
    { label: "s7_Judge", key: "s7_Judge" },
    { label: "s7_LL", key: "s7_LL" },
    { label: "s7_Read1", key: "s7_Read1" },
    { label: "s7_Output", key: "s7_Output" },
    { label: "s7_Read2", key: "s7_Read2" },
    { label: "s8_HL", key: "s8_HL" },
    { label: "Step8", key: "Step8" },
    { label: "s8_Judge", key: "s8_Judge" },
    { label: "s8_LL", key: "s8_LL" },
    { label: "s8_Read1", key: "s8_Read1" },
    { label: "s8_Output", key: "s8_Output" },
    { label: "s8_Read2", key: "s8_Read2" },
    { label: "Operator", key: "Operator" }
  ];

  return (
    <div>
      <Navbar />
      <h2 className="text-center">
        <b>Safety Test</b>
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
              filename={`safety_${startDate.replace(
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
          <div
            className="table-responsive"
            style={{ overflowX: "auto", maxWidth: "100%" }}
          >
            <table
              className="table table-striped table-hover"
              style={{ minWidth: "5000px" }}
            >
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
                  <th><center>Date/Time</center></th>
                  <th><center>Serial</center></th>
                  <th><center>s1_HL</center></th>
                  <th><center>Step1</center></th>
                  <th><center>s1_Judge</center></th>
                  <th><center>s1_LL</center></th>
                  <th><center>s1_Read1</center></th>
                  <th><center>s1_Output</center></th>
                  <th><center>s1_Read2</center></th>
                  <th><center>s2_HL</center></th>
                  <th><center>Step2</center></th>
                  <th><center>s2_Judge</center></th>
                  <th><center>s2_LL</center></th>
                  <th><center>s2_Read1</center></th>
                  <th><center>s2_Output</center></th>
                  <th><center>s2_Read2</center></th>
                  <th><center>s3_HL</center></th>
                  <th><center>Step3</center></th>
                  <th><center>s3_Judge</center></th>
                  <th><center>s3_LL</center></th>
                  <th><center>s3_Read1</center></th>
                  <th><center>s3_Output</center></th>
                  <th><center>s3_Read2</center></th>
                  <th><center>s4_HL</center></th>
                  <th><center>Step4</center></th>
                  <th><center>s4_Judge</center></th>
                  <th><center>s4_LL</center></th>
                  <th><center>s4_Read1</center></th>
                  <th><center>s4_Output</center></th>
                  <th><center>s4_Read2</center></th>
                  <th><center>s5_HL</center></th>
                  <th><center>Step5</center></th>
                  <th><center>s5_Judge</center></th>
                  <th><center>s5_LL</center></th>
                  <th><center>s5_Read1</center></th>
                  <th><center>s5_Output</center></th>
                  <th><center>s5_Read2</center></th>
                  <th><center>s6_HL</center></th>
                  <th><center>Step6</center></th>
                  <th><center>s6_Judge</center></th>
                  <th><center>s6_LL</center></th>
                  <th><center>s6_Read1</center></th>
                  <th><center>s6_Output</center></th>
                  <th><center>s6_Read2</center></th>
                  <th><center>s7_HL</center></th>
                  <th><center>Step7</center></th>
                  <th><center>s7_Judge</center></th>
                  <th><center>s7_LL</center></th>
                  <th><center>s7_Read1</center></th>
                  <th><center>s7_Output</center></th>
                  <th><center>s7_Read2</center></th>
                  <th><center>s8_HL</center></th>
                  <th><center>Step8</center></th>
                  <th><center>s8_Judge</center></th>
                  <th><center>s8_LL</center></th>
                  <th><center>s8_Read1</center></th>
                  <th><center>s8_Output</center></th>
                  <th><center>s8_Read2</center></th>
                  <th><center>Operator</center></th>

                </tr>
              </thead>
              <tbody>
                {records.map((d, i) => (
                  <tr key={i}>
                    <td>{i+1}</td>
                    <td>{d.WorkUser_LineName}</td>
                    <td>{d["Program/Model"]}</td>
                    <td>{d.WorkUser_MOrderCode}</td>
                    <td>{d.Judgement}</td>
                    <td><center>{d.Time}</center></td> {/* No need to format again */}
                    <td><center>{d.Serial}</center></td>
                    <td><center>{d.s1_HL}</center></td>
                    <td><center>{d.Step1}</center></td>
                    <td><center>{d.s1_Judge}</center></td>
                    <td><center>{d.s1_LL}</center></td>
                    <td><center>{d.s1_Read1}</center></td>
                    <td><center>{d.s1_Output}</center></td>
                    <td><center>{d.s1_Read2}</center></td>
                    <td><center>{d.s2_HL}</center></td>
                    <td><center>{d.Step2}</center></td>
                    <td><center>{d.s2_Judge}</center></td>
                    <td><center>{d.s2_LL}</center></td>
                    <td><center>{d.s2_Read1}</center></td>
                    <td><center>{d.s2_Output}</center></td>
                    <td><center>{d.s2_Read2}</center></td>
                    <td><center>{d.s3_HL}</center></td>
                    <td><center>{d.Step3}</center></td>
                    <td><center>{d.s3_Judge}</center></td>
                    <td><center>{d.s3_LL}</center></td>
                    <td><center>{d.s3_Read1}</center></td>
                    <td><center>{d.s3_Output}</center></td>
                    <td><center>{d.s3_Read2}</center></td>
                    <td><center>{d.s4_HL}</center></td>
                    <td><center>{d.Step4}</center></td>
                    <td><center>{d.s4_Judge}</center></td>
                    <td><center>{d.s4_LL}</center></td>
                    <td><center>{d.s4_Read1}</center></td>
                    <td><center>{d.s4_Output}</center></td>
                    <td><center>{d.s4_Read2}</center></td>
                    <td><center>{d.s5_HL}</center></td>
                    <td><center>{d.Step5}</center></td>
                    <td><center>{d.s5_Judge}</center></td>
                    <td><center>{d.s5_LL}</center></td>
                    <td><center>{d.s5_Read1}</center></td>
                    <td><center>{d.s5_Output}</center></td>
                    <td><center>{d.s5_Read2}</center></td>
                    <td><center>{d.s6_HL}</center></td>
                    <td><center>{d.Step6}</center></td>
                    <td><center>{d.s6_Judge}</center></td>
                    <td><center>{d.s6_LL}</center></td>
                    <td><center>{d.s6_Read1}</center></td>
                    <td><center>{d.s6_Output}</center></td>
                    <td><center>{d.s6_Read2}</center></td>
                    <td><center>{d.s7_HL}</center></td>
                    <td><center>{d.Step7}</center></td>
                    <td><center>{d.s7_Judge}</center></td>
                    <td><center>{d.s7_LL}</center></td>
                    <td><center>{d.s7_Read1}</center></td>
                    <td><center>{d.s7_Output}</center></td>
                    <td><center>{d.s7_Read2}</center></td>
                    <td><center>{d.s8_HL}</center></td>
                    <td><center>{d.Step8}</center></td>
                    <td><center>{d.s8_Judge}</center></td>
                    <td><center>{d.s8_LL}</center></td>
                    <td><center>{d.s8_Read1}</center></td>
                    <td><center>{d.s8_Output}</center></td>
                    <td><center>{d.s8_Read2}</center></td>
                    <td><center>{d.Operator}</center></td>
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

export default Safety;
