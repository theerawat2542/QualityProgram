import React, { useState, useEffect } from 'react';
import axios from "axios";
import { Table } from "antd";
import { format } from 'date-fns';
import { API_URL } from '../../lib/config';

const CoolingBarcode = ({ barcode }) => {
  const [data, setData] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${API_URL}/barcode_coolingtest?barcode=${barcode}`);
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
      title: "Order No.",
      dataIndex: "WorkUser_MOrderCode",
      key: "WorkUser_MOrderCode",
      ellipsis: true
    },
    {
      title: "Date/Time",
      dataIndex: "StartTime",
      key: "StartTime",
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
      title: "Remark",
      dataIndex: "Remark",
      key: "Remark",
      ellipsis: true
    }
  ];

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <br />
      <div className="App container">
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

export default CoolingBarcode;