import axios from "axios";
import React, { useState, useEffect } from "react";
import { Table } from "antd";
import { format } from 'date-fns';
import { API_URL } from '../../lib/config';

function History({ selectedOption }) {
  const [data, setData] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [selectedOption]); // Include selectedOption in the dependency array

  const fetchData = () => {
    axios
      .get(`${API_URL}/History`)
      .then((res) => {
        // Filter the data based on the selected option
        const filteredData = res.data.filter(item => item.material_barcode.charAt(12) === selectedOption);
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
      title: "Material Barcode",
      dataIndex: "material_barcode",
      key: "material_barcode",
      ellipsis: true
    },
    {
      title: "Compressor Barcode",
      dataIndex: "compressor_barcode",
      key: "compressor_barcode",
      ellipsis: true
    },
    {
      title: "Date/Time",
      dataIndex: "scan_time",
      key: "scan_time",
      render: (text) => format(new Date(text), 'yyyy-MM-dd HH:mm:ss'),
      ellipsis: true
    },
    {
      title: "Scan By",
      dataIndex: "user_id",
      key: "user_id",
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

export default History;
