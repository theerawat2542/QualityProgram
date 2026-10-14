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
  DatabaseOutlined,
  BarcodeOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import axios from "axios";
import * as XLSX from "xlsx";
import { API_URL } from "../../lib/config";
import Navbar from "../Navbar/Navbar";
import "./CompBarcode.css";

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
    <div className="comp-filter-dropdown">
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

      <Space className="comp-filter-actions">
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

function Compressor() {
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

      const res = await axios.get(`${API_URL}/compressor`, {
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
          `${r.compressor_barcode ?? "compressor"}-${idx}`,
        scan_time: r.scan_time
          ? dayjs(r.scan_time).isValid()
            ? dayjs(r.scan_time).format("YYYY-MM-DD HH:mm:ss")
            : r.scan_time
          : "-",
      }));

      setData(mapped);

      if (mapped.length === 0) {
        message.info("No data in selected date range");
      } else {
        message.success(`Found ${mapped.length} records`);
      }
    } catch (err) {
      console.error("Error fetching compressor data:", err);
      setData([]);
      message.error("Unable to retrieve compressor data");
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
      Line: d.WorkUser_LineName ?? "",
      Model: d.WorkUser_RightMostItemName ?? "",
      "Order No": d.WorkUser_MOrderCode ?? "",
      "Material Barcode": d.material_barcode ?? "",
      "Compressor Barcode": d.compressor_barcode ?? "",
      "Date / Time": d.scan_time ?? "",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);

    ws["!cols"] = [
      { wch: 18 },
      { wch: 24 },
      { wch: 22 },
      { wch: 28 },
      { wch: 28 },
      { wch: 22 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Compressor");

    const fileName = `Compressor_report_${
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
      title: "Line",
      dataIndex: "WorkUser_LineName",
      key: "WorkUser_LineName",
      width: 140,
      ...getColumnSearchProps("WorkUser_LineName"),
      render: (value) => value || "-",
    },
    {
      title: "Model",
      dataIndex: "WorkUser_RightMostItemName",
      key: "WorkUser_RightMostItemName",
      width: 190,
      ...getColumnSearchProps("WorkUser_RightMostItemName"),
      ellipsis: true,
      render: (value) => value || "-",
    },
    {
      title: "Order No",
      dataIndex: "WorkUser_MOrderCode",
      key: "WorkUser_MOrderCode",
      width: 170,
      ...getColumnSearchProps("WorkUser_MOrderCode"),
      render: (value) => value || "-",
    },
    {
      title: "Material Barcode",
      dataIndex: "material_barcode",
      key: "material_barcode",
      width: 230,
      ellipsis: true,
      ...getColumnSearchProps("material_barcode"),
      render: (value) => (
        <span className="comp-barcode-value">{value || "-"}</span>
      ),
    },
    {
      title: "Compressor Barcode",
      dataIndex: "compressor_barcode",
      key: "compressor_barcode",
      width: 230,
      ellipsis: true,
      ...getColumnSearchProps("compressor_barcode"),
      render: (value) => (
        <span className="comp-barcode-value">{value || "-"}</span>
      ),
    },
    {
      title: "Date / Time",
      dataIndex: "scan_time",
      key: "scan_time",
      width: 190,
      sorter: (a, b) =>
        String(a.scan_time ?? "").localeCompare(String(b.scan_time ?? "")),
      render: (value) => (
        <span className="comp-datetime">{value || "-"}</span>
      ),
    },
  ];

  /* ================= Render ================= */

  return (
    <div className="comp-page">
      <Navbar />

      <main className="comp-main">
        {/* Header */}
        <div className="comp-header">
          <div className="comp-title-group">
            <div className="comp-title-icon">
              <BarcodeOutlined />
            </div>

            <div>
              <Title level={3} className="comp-title">
                Compressor
              </Title>
              {/* <Text className="comp-description">
                Compressor barcode scanning report
              </Text> */}
            </div>
          </div>

          {/* <div className="comp-module-label">
            <DatabaseOutlined />
            <span>PRODUCTION REPORT</span>
          </div> */}
        </div>

        {/* Search toolbar */}
        <Card className="comp-toolbar-card" bordered={false}>
          <div className="comp-toolbar">
            <div className="comp-date-group">
              <div className="comp-field-label">
                <CalendarOutlined />
                <span>Date Range</span>
              </div>

              <RangePicker
                className="comp-date-picker"
                value={dateRange}
                onChange={(dates) => setDateRange(dates || [])}
                format="YYYY-MM-DD"
                placeholder={["Start date", "End date"]}
                allowClear
              />
            </div>

            <div className="comp-actions">
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={fetchData}
                loading={loading}
                className="comp-search-button"
              >
                Search
              </Button>

              <Button
                icon={<ClearOutlined />}
                onClick={handleClear}
                className="comp-clear-button"
              >
                Clear
              </Button>

              <Button
                icon={<DownloadOutlined />}
                onClick={handleExport}
                disabled={data.length === 0}
                className="comp-export-button"
              >
                Export Excel
              </Button>
            </div>
          </div>
        </Card>

        {/* Table */}
        <Card className="comp-table-card" bordered={false}>
          <div className="comp-table-heading">
            <div>
              <Title level={5} className="comp-table-title">
                Compressor Records
              </Title>
              <Text className="comp-table-caption">
                View, search and export compressor barcode records
              </Text>
            </div>

            <div className="comp-table-count">
              <DatabaseOutlined />
              <span>{data.length.toLocaleString()} records</span>
            </div>
          </div>

          <Divider className="comp-table-divider" />

          <Table
            className="comp-table"
            columns={columns}
            dataSource={data}
            loading={loading}
            bordered={false}
            size="middle"
            rowKey="key"
            scroll={{ x: 1150, y: 520 }}
            pagination={{
              showSizeChanger: true,
              pageSizeOptions: ["20", "50", "100", "200"],
              defaultPageSize: 20,
              showTotal: (total, range) =>
                `${range[0]}–${range[1]} of ${total} records`,
            }}
            locale={{
              emptyText: (
                <div className="comp-empty">
                  <DatabaseOutlined />
                  <div className="comp-empty-title">No data available</div>
                  <div className="comp-empty-description">
                    Select a date range and click Search
                  </div>
                </div>
              ),
            }}
          />
        </Card>

        {/* Footer */}
        <div className="comp-footer">
          <span>Compressor Report</span>
          <span>Production Monitoring System</span>
        </div>
      </main>
    </div>
  );
}

export default Compressor;