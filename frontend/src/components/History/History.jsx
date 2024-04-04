import axios from "axios";
import React, { useState, useEffect } from "react";
// import ReactLoading from "react-loading";
import { Table } from "antd";
import { format } from 'date-fns';
import { API_URL } from '../../lib/config';

function History() {
  const [data, setData] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = () => {
    axios
      .get(`${API_URL}/History`)
      .then((res) => {
        setData(res.data);
        setRecords(res.data.slice(0));
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
          <div className="table-responsive" style={{ maxHeight: "200px", overflowY: "scroll" }}>
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
