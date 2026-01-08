/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Table, Tag } from "antd";
import { format } from "date-fns";
import { API_URL } from "../../lib/config";
import "./OilBarcode.css";

const OilBarcode = ({ barcode }) => {
  const [records, setRecords] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/barcode_oilcharger?barcode=${barcode}`
        );
        setRecords(response.data);
      } catch (error) {
        setError(error.message);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [barcode]);

  const columns = [
    {
      title: "Barcode",
      dataIndex: "barcode",
      key: "barcode",
      ellipsis: true,
      fixed: "left",
    },
    {
      title: "Line",
      dataIndex: "WorkUser_LineName",
      key: "WorkUser_LineName",
      align: "center",
    },
    {
      title: "Date / Time",
      dataIndex: "datetime",
      key: "datetime",
      render: (text) => format(new Date(text), "yyyy-MM-dd HH:mm:ss"),
      align: "center",
    },
    {
      title: "Model",
      dataIndex: "model",
      key: "model",
    },
    {
      title: "Order No.",
      dataIndex: "WorkUser_MOrderCode",
      key: "WorkUser_MOrderCode",
      align: "center",
    },
    {
      title: "Program",
      dataIndex: "program",
      key: "program",
      align: "center",
    },
    {
      title: "Oil SP",
      dataIndex: "oil_setpoint",
      key: "oil_setpoint",
      align: "right",
    },
    {
      title: "Oil Act",
      dataIndex: "oil_actum",
      key: "oil_actum",
      align: "right",
    },
    {
      title: "R600 SP",
      dataIndex: "r600_setpoint",
      key: "r600_setpoint",
      align: "right",
    },
    {
      title: "R600 Act",
      dataIndex: "r600_actum",
      key: "r600_actum",
      align: "right",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      align: "center",
      render: (status) =>
        status === "OK" ? (
          <Tag color="green">OK</Tag>
        ) : (
          <Tag color="red">NG</Tag>
        ),
    },
    {
      title: "Alarm",
      dataIndex: "alarm",
      key: "alarm",
      ellipsis: true,
    },
    {
      title: "Inaccurate",
      dataIndex: "inaccurate",
      key: "inaccurate",
      align: "center",
    },
  ];

  return (
    <div className="oil-container">
      <div className="oil-card">
        <div className="oil-header">
          <span>🔥 Charging R600</span>
          <small>Barcode : {barcode}</small>
        </div>

        <Table
          dataSource={records}
          columns={columns}
          pagination={false}
          size="middle"
          rowKey={(record, index) => index}
          scroll={{ y: 420, x: 1600 }}
        />

        {error && <div className="error-text">Error : {error}</div>}
      </div>
    </div>
  );
};

export default OilBarcode;
