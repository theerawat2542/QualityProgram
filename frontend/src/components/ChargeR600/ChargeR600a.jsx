// eslint-disable-next-line no-unused-vars
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
  Tag,
} from "antd";
import {
  SearchOutlined,
  DownloadOutlined,
  ClearOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  AlertOutlined,
  DatabaseOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import axios from "axios";
import * as XLSX from "xlsx";
import { API_URL } from "../../lib/config";
import Navbar from "../Navbar/Navbar";
import "./OilBarcode.css";

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

const Charge = () => {
  const [dateRange, setDateRange] = useState([]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Column search
  const getColumnSearchProps = (dataIndex) => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
    }) => (
      <div className="charge-filter-dropdown">
        <Input
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(event) =>
            setSelectedKeys(event.target.value ? [event.target.value] : [])
          }
          onPressEnter={() => confirm()}
          allowClear
          autoFocus
        />

        <Space className="charge-filter-actions">
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

  // Fetch data by date range
  const fetchChargeData = async () => {
    if (
      !dateRange ||
      dateRange.length !== 2 ||
      !dateRange[0] ||
      !dateRange[1]
    ) {
      message.warning("Please select a date range before searching.");
      return;
    }

    setLoading(true);

    try {
      const startDate = dateRange[0].format("YYYY-MM-DD");
      const endDate = dateRange[1].format("YYYY-MM-DD");

      const response = await axios.get(`${API_URL}/oilcharger`, {
        params: {
          startDate,
          endDate,
        },
      });

      const result = Array.isArray(response.data)
        ? response.data
        : Array.isArray(response.data?.data)
          ? response.data.data
          : [];

      const formattedData = result.map((item, index) => {
        const rawDate =
          item.datetime ?? item.DateTime ?? item.time_create ?? "";

        return {
          ...item,
          key: item.id ?? item.ID ?? `${item.barcode ?? "record"}-${index}`,
          datetime:
            rawDate && dayjs(rawDate).isValid()
              ? dayjs(rawDate).format("YYYY-MM-DD HH:mm:ss")
              : rawDate,
        };
      });

      setData(formattedData);

      if (formattedData.length === 0) {
        message.info("No records found for the selected date range.");
      } else {
        message.success(`Found ${formattedData.length} records.`);
      }
    } catch (error) {
      console.error("Error fetching Charge R600a data:", error);
      setData([]);
      message.error(
        "Failed to retrieve data. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Summary statistics
  const summary = useMemo(() => {
    const total = data.length;

    const ok = data.filter(
      (item) => String(item.status ?? "").trim().toUpperCase() === "OK"
    ).length;

    const ng = total - ok;

    const alarm = data.filter((item) => {
      const value = item.alarm ?? item.Alarm;
      return (
        value !== null &&
        value !== undefined &&
        String(value).trim() !== ""
      );
    }).length;

    return { total, ok, ng, alarm };
  }, [data]);

  // Clear filters and table data
  const handleClear = () => {
    setDateRange([]);
    setData([]);
    message.success("Date range and table data cleared.");
  };

  // Export to Excel
  const handleExport = () => {
    if (data.length === 0) {
      message.warning("No data available to export.");
      return;
    }

    const exportData = data.map((item) => ({
      Line: item.WorkUser_LineName ?? "",
      Model: item.Model ?? item.model ?? "",
      "Order No": item.WorkUser_MOrderCode ?? "",
      Barcode: item.barcode ?? item.Barcode ?? "",
      "Date / Time": item.datetime ?? "",
      Program: item.program ?? item.Program ?? "",
      "R600 Setpoint": item.R600_Setpoint ?? item.r600_setpoint ?? "",
      "R600 Actum": item.R600_Actum ?? item.r600_actum ?? "",
      Status: item.status ?? "",
      Alarm: item.alarm ?? item.Alarm ?? "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);

    worksheet["!cols"] = [
      { wch: 18 },
      { wch: 18 },
      { wch: 22 },
      { wch: 24 },
      { wch: 22 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 14 },
      { wch: 30 },
    ];

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Charge R600a");

    const fileName = `ChargeR600a_report_${
      dateRange?.[0] ? dateRange[0].format("YYYYMMDD") : "all"
    }_${
      dateRange?.[1] ? dateRange[1].format("YYYYMMDD") : "data"
    }.xlsx`;

    XLSX.writeFile(workbook, fileName);
    message.success("Excel export completed successfully.");
  };

  // Table columns
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
      dataIndex: "Model",
      key: "Model",
      width: 130,
      ...getColumnSearchProps("Model"),
      render: (value, record) => value ?? record.model ?? "-",
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
      title: "Barcode",
      dataIndex: "barcode",
      key: "barcode",
      width: 190,
      ellipsis: true,
      ...getColumnSearchProps("barcode"),
      render: (value, record) => value ?? record.Barcode ?? "-",
    },
    {
      title: "Date / Time",
      dataIndex: "datetime",
      key: "datetime",
      width: 180,
      sorter: (a, b) =>
        String(a.datetime ?? "").localeCompare(String(b.datetime ?? "")),
      render: (value) => value || "-",
    },
    {
      title: "Program",
      dataIndex: "program",
      key: "program",
      width: 120,
      ...getColumnSearchProps("program"),
      render: (value, record) => value ?? record.Program ?? "-",
    },
    {
      title: "R600 Setpoint",
      dataIndex: "R600_Setpoint",
      key: "R600_Setpoint",
      width: 135,
      align: "right",
      render: (value, record) => value ?? record.r600_setpoint ?? "-",
    },
    {
      title: "R600 Actum",
      dataIndex: "R600_Actum",
      key: "R600_Actum",
      width: 135,
      align: "right",
      render: (value, record) => value ?? record.r600_actum ?? "-",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 110,
      align: "center",
      filters: [
        { text: "OK", value: "OK" },
        { text: "NG", value: "NG" },
      ],
      onFilter: (value, record) => {
        const status = String(record.status ?? "").trim().toUpperCase();
        return value === "OK" ? status === "OK" : status !== "OK";
      },
      render: (value) => {
        const isOk = String(value ?? "").trim().toUpperCase() === "OK";

        return (
          <Tag className={`charge-status ${isOk ? "status-ok" : "status-ng"}`}>
            {isOk ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
            <span>{value || "NG"}</span>
          </Tag>
        );
      },
    },
    {
      title: "Alarm",
      dataIndex: "alarm",
      key: "alarm",
      width: 200,
      ellipsis: true,
      ...getColumnSearchProps("alarm"),
      render: (value, record) => {
        const alarmValue = value ?? record.Alarm;

        return alarmValue ? (
          <span className="charge-alarm">
            <AlertOutlined />
            <span>{alarmValue}</span>
          </span>
        ) : (
          <Text type="secondary">-</Text>
        );
      },
    },
  ];

  return (
    <div className="charge-page">
      <Navbar />

      <main className="charge-main">
        {/* Page Header */}
        <div className="charge-header">
          <div className="charge-title-group">
            <div className="charge-title-icon">
              <ThunderboltOutlined />
            </div>

            <div>
              <Title level={3} className="charge-title">
                Charge R600a
              </Title>
              {/* <Text className="charge-description">
                R600a charging inspection report
              </Text> */}
            </div>
          </div>

          {/* <div className="charge-module-label">
            <DatabaseOutlined />
            <span>PRODUCTION REPORT</span>
          </div> */}
        </div>

        {/* Date Filter and Actions */}
        <Card className="charge-toolbar-card" bordered={false}>
          <div className="charge-toolbar">
            <div className="charge-date-group">
              <div className="charge-field-label">Date Range</div>

              <RangePicker
                className="charge-date-picker"
                value={dateRange}
                onChange={(dates) => setDateRange(dates || [])}
                format="DD/MM/YYYY"
                placeholder={["Start date", "End date"]}
                allowClear
              />
            </div>

            <div className="charge-actions">
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={fetchChargeData}
                loading={loading}
                className="charge-search-button"
              >
                Search
              </Button>

              <Button
                icon={<ClearOutlined />}
                onClick={handleClear}
                className="charge-clear-button"
              >
                Clear
              </Button>

              <Button
                icon={<DownloadOutlined />}
                onClick={handleExport}
                disabled={data.length === 0}
                className="charge-export-button"
              >
                Export Excel
              </Button>
            </div>
          </div>
        </Card>

        {/* Summary */}
        <div className="charge-summary-heading">
          <Text className="charge-section-title">Overview</Text>

          <Text className="charge-summary-note">
            {dateRange?.[0] && dateRange?.[1]
              ? `${dateRange[0].format("DD/MM/YYYY")} – ${dateRange[1].format(
                  "DD/MM/YYYY"
                )}`
              : "Summary of the currently loaded records"}
          </Text>
        </div>

        <Row gutter={[12, 12]} className="charge-summary">
          <Col xs={12} sm={12} md={6}>
            <Card className="charge-summary-card total-card" bordered={false}>
              <div className="charge-stat-top">
                <span className="charge-stat-label">Total Records</span>
                <span className="charge-stat-icon total-icon">
                  <DatabaseOutlined />
                </span>
              </div>
              <Statistic value={summary.total} />
              <div className="charge-stat-caption">All records</div>
            </Card>
          </Col>

          <Col xs={12} sm={12} md={6}>
            <Card className="charge-summary-card ok-card" bordered={false}>
              <div className="charge-stat-top">
                <span className="charge-stat-label">Pass</span>
                <span className="charge-stat-icon ok-icon">
                  <CheckCircleOutlined />
                </span>
              </div>
              <Statistic value={summary.ok} />
              <div className="charge-stat-caption">OK status</div>
            </Card>
          </Col>

          <Col xs={12} sm={12} md={6}>
            <Card className="charge-summary-card ng-card" bordered={false}>
              <div className="charge-stat-top">
                <span className="charge-stat-label">Fail</span>
                <span className="charge-stat-icon ng-icon">
                  <CloseCircleOutlined />
                </span>
              </div>
              <Statistic value={summary.ng} />
              <div className="charge-stat-caption">Non-OK status</div>
            </Card>
          </Col>

          <Col xs={12} sm={12} md={6}>
            <Card className="charge-summary-card alarm-card" bordered={false}>
              <div className="charge-stat-top">
                <span className="charge-stat-label">Alarms</span>
                <span className="charge-stat-icon alarm-icon">
                  <AlertOutlined />
                </span>
              </div>
              <Statistic value={summary.alarm} />
              <div className="charge-stat-caption">Records with alarms</div>
            </Card>
          </Col>
        </Row>

        {/* Data Table */}
        <Card className="charge-table-card" bordered={false}>
          <div className="charge-table-heading">
            <div>
              <Title level={5} className="charge-table-title">
                Record Details
              </Title>
              <Text className="charge-table-caption">
                Review and search Charge R600a records
              </Text>
            </div>

            <div className="charge-table-count">
              <DatabaseOutlined />
              <span>{data.length.toLocaleString()} records</span>
            </div>
          </div>

          <Divider className="charge-table-divider" />

          <Table
            className="charge-table"
            columns={columns}
            dataSource={data}
            loading={loading}
            bordered={false}
            size="middle"
            rowKey="key"
            scroll={{ x: 1450, y: 480 }}
            pagination={{
              defaultPageSize: 20,
              pageSizeOptions: ["20", "50", "100", "200"],
              showSizeChanger: true,
              showTotal: (total, range) =>
                `${range[0]}–${range[1]} of ${total} records`,
            }}
            locale={{
              emptyText: (
                <div className="charge-empty">
                  <DatabaseOutlined />
                  <div className="charge-empty-title">No Data Available</div>
                  <div className="charge-empty-description">
                    Select a date range and click Search to load records.
                  </div>
                </div>
              ),
            }}
          />
        </Card>

        <div className="charge-footer">
          <span>Charge R600a Report</span>
          <span>Production Monitoring System</span>
        </div>
      </main>
    </div>
  );
};

export default Charge;