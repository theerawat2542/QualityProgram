/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table, Tag } from "antd";
import { format } from "date-fns";
import { API_URL } from "../../lib/config";
import "./SafetyBarcode.css";

const SafetyBarcode = ({ barcode }) => {
  const [records, setRecords] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/barcode_safety?barcode=${barcode}`
        );
        setRecords(response.data);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [barcode]);

  const columns = [
    {
      title: "Barcode",
      dataIndex: "WorkUser_BarCode",
      key: "WorkUser_BarCode",
      fixed: "left",
      ellipsis: true,
    },
    {
      title: "Line",
      dataIndex: "WorkUser_LineName",
      key: "WorkUser_LineName",
      align: "center",
    },
    {
      title: "Date / Time",
      dataIndex: "Create_Date",
      key: "Create_Date",
      align: "center",
      render: (text) =>
        text ? format(new Date(text), "yyyy-MM-dd HH:mm:ss") : "-",
    },
    {
      title: "Order No.",
      dataIndex: "WorkUser_MOrderCode",
      key: "WorkUser_MOrderCode",
      align: "center",
    },
  ];

  return (
    <div className="safety-container">
      <div className="safety-card">
        <div className="safety-header">
          <span>🛡️ Safety Test</span>
          <small>Barcode : {barcode}</small>
        </div>

        <Table
          dataSource={records}
          columns={columns}
          pagination={false}
          size="middle"
          rowKey={(record, index) => index}
          scroll={{ y: 420, x: 900 }}
        />

        {error && <div className="error-text">Error : {error}</div>}
      </div>
    </div>
  );
};

export default SafetyBarcode;
