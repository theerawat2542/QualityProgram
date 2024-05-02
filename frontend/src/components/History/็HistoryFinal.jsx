import axios from "axios";
import React, { useState, useEffect } from "react";
import { Table } from "antd";
import { format } from 'date-fns';
import { API_URL } from '../../lib/config';

function HistoryFinal({ selectedOption }) {
  const [data, setData] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [selectedOption]); // Trigger fetching data when the selected option changes

  const fetchData = () => {
    axios
      .get(`${API_URL}/HistoryFinal`)
      .then((res) => {
        // Filter data based on the 13th character of the barcode matching the selected option
        const filteredData = res.data.filter(item => item.barcode.charAt(12) === selectedOption);
        setData(filteredData);
        setRecords(filteredData.slice(0));
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  const columns = [
    {
      title: "Barcode",
      dataIndex: "barcode",
      key: "barcode",
      ellipsis: true
    },
    {
      title: "Date/Time",
      dataIndex: "scantime",
      key: "scantime",
      render: (text) => format(new Date(text), 'yyyy-MM-dd HH:mm:ss'),
      ellipsis: true
    },
    {
      title: "Station Scan",
      dataIndex: "station_scan",
      key: "station_scan",
      ellipsis: true
    }
  ];

  return (
    <div>
      <br />
      <div className="App container">
        <div className="bg-white shadow border">
          <div className="table-responsive" style={{ maxHeight: "300px", overflowY: "scroll" }}>
            <Table
              dataSource={records}
              columns={columns}
              pagination={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default HistoryFinal;
