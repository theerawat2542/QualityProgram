import React, { useState, useEffect } from 'react';
import axios from "axios";
import { Table } from "antd";
import { format } from 'date-fns';
import { API_URL } from '../../lib/config';

const OilBarcode = ({ barcode }) => {
  const [data, setData] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${API_URL}/barcode_oilcharger?barcode=${barcode}`);
        setData(response.data);
        setRecords(response.data.slice(0));
        setLoading(false);
      } catch (error) {
        setError(error.message);
        setLoading(false);
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
        ellipsis: true
    },
    {
      title: "Production Line",
      dataIndex: "WorkUser_LineName",
      key: "WorkUser_LineName",
      ellipsis: true
    },
    {
        title: "Date/time",
        dataIndex: "datetime",
        key: "datetime",
        render: (text) => format(new Date(text), 'yyyy-MM-dd HH:mm:ss'),
        ellipsis: true
    },
    {
      title: "Model",
      dataIndex: "model",
      key: "model",
      ellipsis: true
    },
    {
      title: "Order No.",
      dataIndex: "WorkUser_MOrderCode",
      key: "WorkUser_MOrderCode",
      ellipsis: true
    },
    {
      title: "Program",
      dataIndex: "program",
      key: "program",
      ellipsis: true
    },
    {
      title: "Oil Setpoint",
      dataIndex: "oil_setpoint",
      key: "oil_setpoint",
      ellipsis: true
    },
    {
      title: "Oil Actum",
      dataIndex: "oil_actum",
      key: "oil_actum",
      ellipsis: true
    },
    {
      title: "R600 Setpoint",
      dataIndex: "r600_setpoint",
      key: "r600_setpoint",
      ellipsis: true
    },
    {
      title: "R600 Actum",
      dataIndex: "r600_actum",
      key: "r600_actum",
      ellipsis: true
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      ellipsis: true
    },
    {
      title: "Alarm",
      dataIndex: "alarm",
      key: "alarm",
      ellipsis: true
    },
    {
      title: "Iaccurate",
      dataIndex: "inaccurate",
      key: "inaccurate",
      ellipsis: true
    }
  ];

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <br />
      <div className="App container">
        <center><label><h3>Charging R600</h3></label><br /></center>
        <div className="bg-white shadow border">
          <div className="table-responsive" style={{ maxHeight: "500px", overflowY: "scroll" }}>
            <Table
              dataSource={records}
              columns={columns}
              pagination={false}
              scroll={{ x: true }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default OilBarcode;