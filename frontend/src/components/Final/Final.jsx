
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
  CheckSquareOutlined,
  DatabaseOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import axios from "axios";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
import Navbar from "../Navbar/Navbar";
import { API_URL } from "../../lib/config";
import "./Final.css";

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

/* ================= Column Search ================= */

const getColumnSearchProps = (dataIndex) => ({
  filterDropdown: ({
    setSelectedKeys,
    selectedKeys,
    confirm,
    clearFilters,
  }) => (
    <div className="final-filter-dropdown">
      <Input
        placeholder={`Search ${dataIndex}`}
        value={selectedKeys[0]}
        onChange={(e) =>
          setSelectedKeys(e.target.value ? [e.target.value] : [])
        }
        onPressEnter={() => confirm()}
        allowClear
        autoFocus
      />

      <Space className="final-filter-actions">
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
            clearFilters?.();
            setSelectedKeys([]);
            confirm();
          }}
        >
          Reset
        </Button>
      </Space>
    </div>
  ),

  filterIcon: (filtered) => (
    <SearchOutlined
      style={{ color: filtered ? "#1677ff" : undefined }}
    />
  ),

  onFilter: (value, record) =>
    String(record[dataIndex] ?? "")
      .toLowerCase()
      .includes(String(value ?? "").toLowerCase()),
});

/* ================= Component ================= */

function Final() {
  const [dateRange, setDateRange] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ================= Fetch ================= */

  const fetchData = async () => {
    if (
      !dateRange ||
      dateRange.length !== 2 ||
      !dateRange[0] ||
      !dateRange[1]
    ) {
      message.warning("Please select date range");
      return;
    }

    try {
      setLoading(true);

      const [start, end] = dateRange;

      const res = await axios.get(`${API_URL}/final`, {
        params: {
          startDate: start.format("YYYY-MM-DD"),
          endDate: end.format("YYYY-MM-DD"),
        },
      });

      const result = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
          ? res.data.data
          : [];

      const mapped = result.map((r, idx) => ({
        ...r,
        key:
          r.id ??
          r.ID ??
          `${r.barcode ?? "final"}-${r.scantime ?? "no-time"}-${idx}`,
        scantime: r.scantime
          ? dayjs(r.scantime).isValid()
            ? dayjs(r.scantime).format("YYYY-MM-DD HH:mm:ss")
            : r.scantime
          : "-",
      }));

      setData(mapped);

      if (mapped.length === 0) {
        message.info("No data in selected date range");
      } else {
        message.success(`Found ${mapped.length} records`);
      }
    } catch (err) {
      console.error("Error fetching final inspection data:", err);
      setData([]);
      message.error("Unable to retrieve final inspection data");
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
      "Production Line": d.WorkUser_LineName ?? "",
      Model: d.WorkUser_RightMostItemName ?? "",
      "Order No": d.WorkUser_MOrderCode ?? "",
      Barcode: d.barcode ?? "",
      "Date / Time": d.scantime ?? "",
      "Station Scan": d.station_scan ?? "",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);

    ws["!cols"] = [
      { wch: 20 },
      { wch: 28 },
      { wch: 22 },
      { wch: 28 },
      { wch: 22 },
      { wch: 32 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "FinalInspection");

    const fileName = `Final_appearance_inspection_${
      dateRange?.[0] ? dateRange[0].format("YYYYMMDD") : "all"
    }_${
      dateRange?.[1] ? dateRange[1].format("YYYYMMDD") : "data"
    }.xlsx`;

    XLSX.writeFile(wb, fileName);
    message.success("Export Excel successful");
  };

  /* ================= Columns ================= */

  const columns = [
    {
      title: "Production Line",
      dataIndex: "WorkUser_LineName",
      key: "WorkUser_LineName",
      width: 170,
      ...getColumnSearchProps("WorkUser_LineName"),
      render: (value) => value || "-",
    },
    {
      title: "Model",
      dataIndex: "WorkUser_RightMostItemName",
      key: "WorkUser_RightMostItemName",
      width: 210,
      ...getColumnSearchProps("WorkUser_RightMostItemName"),
      ellipsis: true,
      render: (value) => value || "-",
    },
    {
      title: "Order No",
      dataIndex: "WorkUser_MOrderCode",
      key: "WorkUser_MOrderCode",
      width: 180,
      ...getColumnSearchProps("WorkUser_MOrderCode"),
      render: (value) => value || "-",
    },
    {
      title: "Barcode",
      dataIndex: "barcode",
      key: "barcode",
      width: 230,
      ellipsis: true,
      ...getColumnSearchProps("barcode"),
      render: (value) => (
        <span className="final-barcode-value">{value || "-"}</span>
      ),
    },
    {
      title: "Date / Time",
      dataIndex: "scantime",
      key: "scantime",
      width: 190,
      sorter: (a, b) =>
        String(a.scantime ?? "").localeCompare(String(b.scantime ?? "")),
      render: (value) => (
        <span className="final-datetime">{value || "-"}</span>
      ),
    },
    {
      title: "Station Scan",
      dataIndex: "station_scan",
      key: "station_scan",
      width: 250,
      ellipsis: true,
      ...getColumnSearchProps("station_scan"),
      render: (value) => value || "-",
    },
  ];

  /* ================= Render ================= */

  return (
    <div className="final-page">
      <Navbar />

      <main className="final-main">
        {/* Header */}
        <div className="final-header">
          <div className="final-title-group">
            <div className="final-title-icon">
              <CheckSquareOutlined />
            </div>

            <div>
              <Title level={3} className="final-title">
                Final Appearance Inspection
              </Title>

              {/* <Text className="final-description">
                Final appearance inspection report
              </Text> */}
            </div>
          </div>

          {/* <div className="final-module-label">
            <DatabaseOutlined />
            <span>PRODUCTION REPORT</span>
          </div> */}
        </div>

        {/* Search toolbar */}
        <Card className="final-toolbar-card" bordered={false}>
          <div className="final-toolbar">
            <div className="final-date-group">
              <div className="final-field-label">
                <CalendarOutlined />
                <span>Date Range</span>
              </div>

              <RangePicker
                className="final-date-picker"
                value={dateRange}
                onChange={(dates) => setDateRange(dates || [])}
                format="YYYY-MM-DD"
                placeholder={["Start date", "End date"]}
                allowClear
              />
            </div>

            <div className="final-actions">
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={fetchData}
                loading={loading}
                className="final-search-button"
              >
                Search
              </Button>

              <Button
                icon={<ClearOutlined />}
                onClick={handleClear}
                className="final-clear-button"
              >
                Clear
              </Button>

              <Button
                icon={<DownloadOutlined />}
                onClick={handleExport}
                disabled={data.length === 0}
                className="final-export-button"
              >
                Export Excel
              </Button>
            </div>
          </div>
        </Card>

        {/* Table */}
        <Card className="final-table-card" bordered={false}>
          <div className="final-table-heading">
            <div>
              <Title level={5} className="final-table-title">
                Final Inspection Records
              </Title>

              <Text className="final-table-caption">
                View, search and export final inspection records
              </Text>
            </div>

            <div className="final-table-count">
              <DatabaseOutlined />
              <span>{data.length.toLocaleString()} records</span>
            </div>
          </div>

          <Divider className="final-table-divider" />

          <Table
            className="final-table"
            columns={columns}
            dataSource={data}
            loading={loading}
            bordered={false}
            size="middle"
            rowKey="key"
            scroll={{ x: 1240, y: 520 }}
            pagination={{
              showSizeChanger: true,
              pageSizeOptions: ["20", "50", "100", "200"],
              defaultPageSize: 20,
              showTotal: (total, range) =>
                `${range[0]}–${range[1]} of ${total} records`,
            }}
            locale={{
              emptyText: (
                <div className="final-empty">
                  <DatabaseOutlined />
                  <div className="final-empty-title">
                    No data available
                  </div>
                  <div className="final-empty-description">
                    Select a date range and click Search
                  </div>
                </div>
              ),
            }}
          />
        </Card>

        {/* Footer */}
        <div className="final-footer">
          <span>Final Inspection Report</span>
          <span>Production Monitoring System</span>
        </div>
      </main>
    </div>
  );
}

export default Final;
