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
  BugOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import axios from "axios";
import * as XLSX from "xlsx";
import Navbar from "../Navbar/Navbar";
import { API_URL } from "../../lib/config";

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
    (record[dataIndex] ?? "")
      .toString()
      .toLowerCase()
      .includes(value.toLowerCase()),
});

/* ================= Component ================= */

function Defect() {
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

      const res = await axios.get(`${API_URL}/defect`, {
        params: {
          startDate: start.format("YYYY-MM-DD"),
          endDate: end.format("YYYY-MM-DD"),
        },
      });

      if (!res.data || res.data.length === 0) {
        message.info("No data in selected date range");
        setData([]);
        return;
      }

      const mapped = res.data.map((r, idx) => ({
        ...r,
        key: r.id || idx,
        scan_time: r.scan_time
          ? dayjs(r.scan_time).format("YYYY-MM-DD HH:mm:ss")
          : "-",
        production_line:
          r.production_line === "RA"
            ? "A"
            : r.production_line === "RB"
            ? "B"
            : r.production_line,
      }));

      setData(mapped);
    } catch (err) {
      message.error("Error fetching data");
      setData([]);
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
      "Production Line": d.production_line,
      "Material Barcode": d.material_barcode,
      "Defect Barcode": d.defect_barcode,
      Reason: d.reason,
      Pic: d.user_id,
      "Date / Time": d.scan_time,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Defect");

    XLSX.writeFile(wb, "Defect_report.xlsx");
  };

  /* ================= Columns ================= */

  const columns = [
    {
      title: "Production Line",
      dataIndex: "production_line",
      width: 20,
      ...getColumnSearchProps("production_line"),
    },
    {
      title: "Material Barcode",
      dataIndex: "material_barcode",
      width: 30,
      ellipsis: true,
      ...getColumnSearchProps("material_barcode"),
    },
    {
      title: "Defect Barcode",
      dataIndex: "defect_barcode",
      width: 30,
      ellipsis: true,
      ...getColumnSearchProps("defect_barcode"),
    },
    {
      title: "Reason",
      dataIndex: "reason",
      width: 20,
      ...getColumnSearchProps("reason"),
    },
    {
      title: "Pic",
      dataIndex: "user_id",
      width: 15,
      ...getColumnSearchProps("user_id"),
    },
    {
      title: "Date / Time",
      dataIndex: "scan_time",
      width: 25,
    },
  ];

  /* ================= Render ================= */

  return (
    <div style={{ background: "#f5f7fa", minHeight: "100vh" }}>
      <Navbar />

      <Card style={{ margin: 16 }} bordered={false} bodyStyle={{ padding: 24 }}>
        {/* ===== Header ===== */}
        <Space align="center">
          <BugOutlined style={{ fontSize: 28, color: "#d4380d" }} />
          <Title level={3} style={{ margin: 0 }}>
            Defect
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

          <Button
            type="primary"
            icon={<SearchOutlined />}
            onClick={fetchData}
          >
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
          rowKey={(record, index) =>
            record.material_barcode + "_" + index
          }
          columns={columns}
          dataSource={data}
          loading={loading}
          bordered
          size="middle"
          scroll={{ x: 1400, y: 520 }}
          locale={{ emptyText: "No data" }}
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

export default Defect;
