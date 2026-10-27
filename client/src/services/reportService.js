import api from "./api";

/**
 * Fetch financial report data for on-screen preview & charts
 */
export const getReportData = async (params = {}) => {
  const response = await api.get("/reports/data", { params });
  return response.data;
};

/**
 * Download CSV file
 */
export const downloadReportCSV = async (params = {}) => {
  const response = await api.get("/reports/export/csv", {
    params,
    responseType: "blob",
  });
  triggerFileDownload(response.data, `MoneyMate_${params.reportType || "statement"}_${new Date().toISOString().split("T")[0]}.csv`, "text/csv;charset=utf-8;");
};

/**
 * Download genuine Excel XLSX file
 */
export const downloadReportExcel = async (params = {}) => {
  const response = await api.get("/reports/export/excel", {
    params,
    responseType: "blob",
  });
  triggerFileDownload(
    response.data,
    `MoneyMate_${params.reportType || "statement"}_${new Date().toISOString().split("T")[0]}.xlsx`,
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
};

/**
 * Download genuine PDF report
 */
export const downloadReportPDF = async (params = {}) => {
  const response = await api.get("/reports/export/pdf", {
    params,
    responseType: "blob",
  });
  triggerFileDownload(
    response.data,
    `MoneyMate_${params.reportType || "statement"}_${new Date().toISOString().split("T")[0]}.pdf`,
    "application/pdf"
  );
};

/**
 * Helper to trigger browser download for binary blobs
 */
function triggerFileDownload(blobData, filename, mimeType) {
  const blob = new Blob([blobData], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 200);
}
