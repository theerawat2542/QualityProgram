/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
"use client";

import React, { useState } from "react";
import {
  Table,
  DatePicker,
  Button,
  message,
  Input,
  Space,
  Card,
  Typography,
  Divider,
} from "antd";
import {
  SearchOutlined,
  DownloadOutlined,
  ClearOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import axios from "axios";
import * as XLSX from "xlsx";
import { API_URL } from "../../lib/config";
import Navbar from "../Navbar/Navbar";

const { RangePicker } = DatePicker;
const { Title } = Typography;

/* ================= Column Search ================= */

const getColumnSearchProps = (dataIndex) => ({
  filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
    <div style={{ padding: 8 }}>
      <Input
        placeholder={`Search ${dataIndex}`}
        value={selectedKeys[0]}
        onChange={(e) =>
          setSelectedKeys(e.target.value ? [e.target.value] : [])
        }
        onPressEnter={() => confirm()}
        style={{ marginBottom: 8 }}
      />
      <Space>
        <Button
          type="primary"
          size="small"
          icon={<SearchOutlined />}
          onClick={() => confirm()}
        >
          Search
        </Button>
        <Button
          size="small"
          onClick={() => {
            clearFilters();
            confirm();
          }}
        >
          Reset
        </Button>
      </Space>
    </div>
  ),
  filterIcon: (filtered) => (
    <SearchOutlined style={{ color: filtered ? "#1677ff" : undefined }} />
  ),
  onFilter: (value, record) =>
    record[dataIndex]
      ?.toString()
      .toLowerCase()
      .includes(value.toLowerCase()),
});

/* ================= Component ================= */

function Compressor() {
  const [dateRange, setDateRange] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ================= Fetch ================= */

  const fetchData = async () => {
    if (!dateRange || dateRange.length !== 2) {
      message.warning("Please select date range");
      return;
    }

    try {
      setLoading(true);
      const [start, end] = dateRange;

      const res = await axios.get(`${API_URL}/compressor`, {
        params: {
          startDate: start.format("YYYY-MM-DD"),
          endDate: end.format("YYYY-MM-DD"),
        },
      });

      const mapped = (res.data || []).map((r, idx) => ({
        ...r,
        key: idx,
        scan_time: r.scan_time
          ? dayjs(r.scan_time).format("YYYY-MM-DD HH:mm:ss")
          : "-",
      }));

      setData(mapped);
    } catch (err) {
      message.info("No data in selected date range");
    } finally {
      setLoading(false);
    }
  };

  /* ================= Clear ================= */

  const handleClear = () => {
    setDateRange([]);
    setData([]);
    message.success("Cleared date and table data");
  };

  /* ================= Export ================= */

  const handleExport = () => {
    if (data.length === 0) {
      message.warning("No data to export");
      return;
    }

    const exportData = data.map((d) => ({
      Line: d.WorkUser_LineName,
      Model: d.WorkUser_RightMostItemName,
      "Order No": d.WorkUser_MOrderCode,
      "Material Barcode": d.material_barcode,
      "Compressor Barcode": d.compressor_barcode,
      "Date / Time": d.scan_time,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Compressor");

    XLSX.writeFile(wb, "Compressor_report.xlsx");
  };

  /* ================= Columns ================= */

  const columns = [
    {
      title: "Line",
      dataIndex: "WorkUser_LineName",
      width: 20,
      ...getColumnSearchProps("WorkUser_LineName"),
    },
    {
      title: "Model",
      dataIndex: "WorkUser_RightMostItemName",
      width: 30,
      ...getColumnSearchProps("WorkUser_RightMostItemName"),
    },
    {
      title: "Order No",
      dataIndex: "WorkUser_MOrderCode",
      width: 20,
      ...getColumnSearchProps("WorkUser_MOrderCode"),
    },
    {
      title: "Material Barcode",
      dataIndex: "material_barcode",
      width: 30,
      ellipsis: true,
      ...getColumnSearchProps("material_barcode"),
    },
    {
      title: "Compressor Barcode",
      dataIndex: "compressor_barcode",
      width: 30,
      ellipsis: true,
      ...getColumnSearchProps("compressor_barcode"),
    },
    {
      title: "Date / Time",
      dataIndex: "scan_time",
      width: 20,
    },
  ];

  /* ================= Render ================= */

  return (
    <div style={{ background: "#f5f7fa", minHeight: "100vh" }}>
      <Navbar />

      <Card style={{ margin: 16 }} bordered={false} styles={{ body: { padding: 24 } }}>
        {/* ===== Header ===== */}
        <Space align="center">
          <SettingOutlined style={{ fontSize: 28, color: "#1677ff" }} />
          <Title level={3} style={{ margin: 0 }}>
            Compressor
          </Title>
        </Space>

        <Divider />

        {/* ===== Toolbar ===== */}
        <Space wrap style={{ marginBottom: 16 }}>
          <RangePicker
            value={dateRange}
            onChange={setDateRange}
            format="YYYY-MM-DD"
          />

          <Button type="primary" icon={<SearchOutlined />} onClick={fetchData}>
            Search
          </Button>

          <Button icon={<ClearOutlined />} onClick={handleClear}>
            Clear
          </Button>

          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            Export
          </Button>
        </Space>

        {/* ===== Table ===== */}
        <Table
          columns={columns}
          dataSource={data}
          loading={loading}
          bordered
          size="middle"
          scroll={{ x: 1500, y: 520 }}
          pagination={{
            showSizeChanger: true,
            pageSizeOptions: ["20", "50", "100", "200"],
            defaultPageSize: 20,
          }}
        />
      </Card>
    </div>
  );
}

export default Compressor;
