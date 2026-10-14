/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
"use client";

import React, { useState, useMemo } from "react";
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
  Statistic,
  Row,
  Col,
} from "antd";
import {
  SearchOutlined,
  DownloadOutlined,
  ClearOutlined,
  BugOutlined,
  DatabaseOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import axios from "axios";
import * as XLSX from "xlsx";
import Navbar from "../Navbar/Navbar";
import { API_URL } from "../../lib/config";
import "./Defect.css";

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
    <div className="defect-filter-dropdown">
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

      <Space className="defect-filter-actions">
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

function Defect() {
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
      message.warning("Please select a date range before searching.");
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

      const result = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
          ? res.data.data
          : [];

      if (result.length === 0) {
        setData([]);
        message.info("No records found for the selected date range.");
        return;
      }

      const mapped = result.map((r, idx) => ({
        ...r,
        key: r.id ?? `${r.material_barcode ?? "defect"}-${idx}`,
        scan_time:
          r.scan_time && dayjs(r.scan_time).isValid()
            ? dayjs(r.scan_time).format("YYYY-MM-DD HH:mm:ss")
            : r.scan_time || "-",
        production_line:
          r.production_line === "RA"
            ? "A"
            : r.production_line === "RB"
              ? "B"
              : r.production_line ?? "-",
      }));

      setData(mapped);
      message.success(`Found ${mapped.length} records.`);
    } catch (err) {
      console.error("Error fetching defect data:", err);
      setData([]);
      message.error("Failed to retrieve data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ================= Summary ================= */

  const summary = useMemo(
    () => ({
      total: data.length,
      lineA: data.filter((item) => item.production_line === "A").length,
      lineB: data.filter((item) => item.production_line === "B").length,
      uniqueReasons: new Set(
        data
          .map((item) => String(item.reason ?? "").trim())
          .filter(Boolean)
      ).size,
    }),
    [data]
  );

  /* ================= Clear ================= */

  const handleClear = () => {
    setDateRange([]);
    setData([]);
    message.success("Date range and table data cleared.");
  };

  /* ================= Export ================= */

  const handleExport = () => {
    if (data.length === 0) {
      message.warning("No data available to export.");
      return;
    }

    const exportData = data.map((d) => ({
      "Production Line": d.production_line ?? "",
      "Material Barcode": d.material_barcode ?? "",
      "Defect Barcode": d.defect_barcode ?? "",
      Reason: d.reason ?? "",
      PIC: d.user_id ?? "",
      "Date / Time": d.scan_time ?? "",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);

    ws["!cols"] = [
      { wch: 18 },
      { wch: 28 },
      { wch: 28 },
      { wch: 30 },
      { wch: 18 },
      { wch: 22 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Defect");

    const fileName = `Defect_report_${
      dateRange?.[0] ? dateRange[0].format("YYYYMMDD") : "all"
    }_${
      dateRange?.[1] ? dateRange[1].format("YYYYMMDD") : "data"
    }.xlsx`;

    XLSX.writeFile(wb, fileName);
    message.success("Excel export completed successfully.");
  };

  /* ================= Columns ================= */

  const columns = [
    {
      title: "Production Line",
      dataIndex: "production_line",
      key: "production_line",
      width: 150,
      align: "center",
      ...getColumnSearchProps("production_line"),
      render: (value) => (
        <span className={`defect-line defect-line-${String(value).toLowerCase()}`}>
          {value || "-"}
        </span>
      ),
    },
    {
      title: "Material Barcode",
      dataIndex: "material_barcode",
      key: "material_barcode",
      width: 230,
      ellipsis: true,
      ...getColumnSearchProps("material_barcode"),
      render: (value) => (
        <span className="defect-barcode-value">{value || "-"}</span>
      ),
    },
    {
      title: "Defect Barcode",
      dataIndex: "defect_barcode",
      key: "defect_barcode",
      width: 230,
      ellipsis: true,
      ...getColumnSearchProps("defect_barcode"),
      render: (value) => (
        <span className="defect-barcode-value">{value || "-"}</span>
      ),
    },
    {
      title: "Reason",
      dataIndex: "reason",
      key: "reason",
      width: 220,
      ellipsis: true,
      ...getColumnSearchProps("reason"),
      render: (value) => value || "-",
    },
    {
      title: "PIC",
      dataIndex: "user_id",
      key: "user_id",
      width: 140,
      ...getColumnSearchProps("user_id"),
      render: (value) => value || "-",
    },
    {
      title: "Date / Time",
      dataIndex: "scan_time",
      key: "scan_time",
      width: 190,
      sorter: (a, b) =>
        String(a.scan_time ?? "").localeCompare(String(b.scan_time ?? "")),
      render: (value) => (
        <span className="defect-datetime">{value || "-"}</span>
      ),
    },
  ];

  /* ================= Render ================= */

  return (
    <div className="defect-page">
      <Navbar />

      <main className="defect-main">
        {/* Page Header */}
        <div className="defect-header">
          <div className="defect-title-group">
            <div className="defect-title-icon">
              <BugOutlined />
            </div>

            <div>
              <Title level={3} className="defect-title">
                Defect Report
              </Title>
              {/* <Text className="defect-description">
                Defect barcode tracking and inspection report
              </Text> */}
            </div>
          </div>

          {/* <div className="defect-module-label">
            <DatabaseOutlined />
            <span>PRODUCTION REPORT</span>
          </div> */}
        </div>

        {/* Date Filter and Actions */}
        <Card className="defect-toolbar-card" bordered={false}>
          <div className="defect-toolbar">
            <div className="defect-date-group">
              <div className="defect-field-label">
                <CalendarOutlined />
                <span>Date Range</span>
              </div>

              <RangePicker
                className="defect-date-picker"
                value={dateRange}
                onChange={(dates) => setDateRange(dates || [])}
                format="YYYY-MM-DD"
                placeholder={["Start date", "End date"]}
                allowClear
              />
            </div>

            <div className="defect-actions">
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={fetchData}
                loading={loading}
                className="defect-search-button"
              >
                Search
              </Button>

              <Button
                icon={<ClearOutlined />}
                onClick={handleClear}
                className="defect-clear-button"
              >
                Clear
              </Button>

              <Button
                icon={<DownloadOutlined />}
                onClick={handleExport}
                disabled={data.length === 0}
                className="defect-export-button"
              >
                Export Excel
              </Button>
            </div>
          </div>
        </Card>

        {/* Summary */}
        <div className="defect-summary-heading">
          <Text className="defect-section-title">Overview</Text>

          <Text className="defect-summary-note">
            {dateRange?.[0] && dateRange?.[1]
              ? `${dateRange[0].format("DD/MM/YYYY")} – ${dateRange[1].format(
                  "DD/MM/YYYY"
                )}`
              : "Summary of the currently loaded records"}
          </Text>
        </div>

        <Row gutter={[12, 12]} className="defect-summary">
          <Col xs={12} sm={12} md={6}>
            <Card className="defect-summary-card total-card" bordered={false}>
              <div className="defect-stat-top">
                <span className="defect-stat-label">Total Records</span>
                <span className="defect-stat-icon total-icon">
                  <DatabaseOutlined />
                </span>
              </div>
              <Statistic value={summary.total} />
              <div className="defect-stat-caption">All defect records</div>
            </Card>
          </Col>

          <Col xs={12} sm={12} md={6}>
            <Card className="defect-summary-card line-a-card" bordered={false}>
              <div className="defect-stat-top">
                <span className="defect-stat-label">Production Line A</span>
                <span className="defect-stat-icon line-a-icon">
                  <BugOutlined />
                </span>
              </div>
              <Statistic value={summary.lineA} />
              <div className="defect-stat-caption">Line A records</div>
            </Card>
          </Col>

          <Col xs={12} sm={12} md={6}>
            <Card className="defect-summary-card line-b-card" bordered={false}>
              <div className="defect-stat-top">
                <span className="defect-stat-label">Production Line B</span>
                <span className="defect-stat-icon line-b-icon">
                  <BugOutlined />
                </span>
              </div>
              <Statistic value={summary.lineB} />
              <div className="defect-stat-caption">Line B records</div>
            </Card>
          </Col>

          <Col xs={12} sm={12} md={6}>
            <Card className="defect-summary-card reason-card" bordered={false}>
              <div className="defect-stat-top">
                <span className="defect-stat-label">Defect Reasons</span>
                <span className="defect-stat-icon reason-icon">
                  <DatabaseOutlined />
                </span>
              </div>
              <Statistic value={summary.uniqueReasons} />
              <div className="defect-stat-caption">Unique reasons recorded</div>
            </Card>
          </Col>
        </Row>

        {/* Data Table */}
        <Card className="defect-table-card" bordered={false}>
          <div className="defect-table-heading">
            <div>
              <Title level={5} className="defect-table-title">
                Defect Records
              </Title>
              <Text className="defect-table-caption">
                Search, review and export defect barcode records
              </Text>
            </div>

            <div className="defect-table-count">
              <DatabaseOutlined />
              <span>{data.length.toLocaleString()} records</span>
            </div>
          </div>

          <Divider className="defect-table-divider" />

          <Table
            className="defect-table"
            rowKey="key"
            columns={columns}
            dataSource={data}
            loading={loading}
            bordered={false}
            size="middle"
            scroll={{ x: 1150, y: 520 }}
            locale={{
              emptyText: (
                <div className="defect-empty">
                  <DatabaseOutlined />
                  <div className="defect-empty-title">No Data Available</div>
                  <div className="defect-empty-description">
                    Select a date range and click Search to load records.
                  </div>
                </div>
              ),
            }}
            pagination={{
              showSizeChanger: true,
              pageSizeOptions: ["20", "50", "100", "200"],
              defaultPageSize: 20,
              showTotal: (total, range) =>
                `${range[0]}–${range[1]} of ${total} records`,
            }}
          />
        </Card>

        <div className="defect-footer">
          <span>Defect Report</span>
          <span>Production Monitoring System</span>
        </div>
      </main>
    </div>
  );
}

export default Defect;