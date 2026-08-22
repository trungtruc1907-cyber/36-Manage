import * as XLSX from 'xlsx';
import { ConstructionProject, ExportedGood, LaborDailyLog, StaffMember, CompanySettings } from '../types';

export interface ReportSummaryData {
  timeFilterLabel: string;
  projectFilterLabel: string;
  totalCost: number;
  totalMaterialCost: number;
  totalLaborCost: number;
  totalExportsCount: number;
  totalWorkdays: number;
  activeProjectsCount: number;
  totalProjectsCount: number;
  filteredProjects: {
    project: ConstructionProject;
    materialCost: number;
    laborCost: number;
    totalCost: number;
    workdays: number;
    budget: number;
  }[];
  materialBreakdown: {
    code: string;
    name: string;
    category: string;
    unit: string;
    totalQty: number;
    totalAmount: number;
  }[];
  laborBreakdown: {
    staffName: string;
    role: string;
    workdays: number;
    totalCost: number;
    projectsUsed: string[];
  }[];
}

export function exportComprehensiveReportToExcel(
  reportData: ReportSummaryData,
  companySettings?: CompanySettings
) {
  const wb = XLSX.utils.book_new();
  const formatCurrency = (v: number) => new Intl.NumberFormat('vi-VN').format(v);
  const nowStr = new Date().toLocaleDateString('vi-VN');

  // ================= 1. SHEET TỔNG HỢP (Overview) =================
  const overviewSheetData: any[][] = [
    [companySettings?.orgName || 'CÔNG TY TRƯỜNG SƠN - WATERPROOFING 36'],
    [`Địa chỉ: ${companySettings?.address || 'Việt Nam'} | Hotline: ${companySettings?.phone || '0915 586 234'}`],
    [''],
    ['BÁO CÁO TỔNG HỢP CHI PHÍ & TIẾN ĐỘ THI CÔNG'],
    [`Thời gian áp dụng: ${reportData.timeFilterLabel} | Phạm vi: ${reportData.projectFilterLabel}`],
    [`Ngày xuất báo cáo: ${nowStr}`],
    [''],
    ['CHỈ SỐ TỔNG QUAN', 'GIÁ TRỊ TỔNG HỢP'],
    ['Tổng Chi Phí Phát Sinh (Vật tư + Nhân công)', `${formatCurrency(reportData.totalCost)} VNĐ`],
    ['Chi Phí Vật Tư Xuất Kho', `${formatCurrency(reportData.totalMaterialCost)} VNĐ`],
    ['Số Lượng Phiếu Xuất Vật Tư', `${reportData.totalExportsCount} phiếu`],
    ['Chi Phí Nhân Công & Lương Thợ', `${formatCurrency(reportData.totalLaborCost)} VNĐ`],
    ['Tổng Số Ngày Công Ghi Nhận', `${reportData.totalWorkdays} công`],
    ['Số Lượng Công Trình Đang Thi Công', `${reportData.activeProjectsCount} / ${reportData.totalProjectsCount} công trình`],
    [''],
    ['--- CHI TIẾT TỪNG DỰ ÁN ---'],
    ['STT', 'Mã Dự Án', 'Tên Công Trình', 'Chủ Đầu Tư', 'Trạng Thái', 'Chi Phí Vật Tư (VNĐ)', 'Chi Phí Nhân Công (VNĐ)', 'Tổng Chi Phí (VNĐ)', 'Tổng Giá Trị Hoàn Thành (VNĐ)', 'Tỷ Trọng Chi Phí (%)'],
  ];

  reportData.filteredProjects.forEach((item, idx) => {
    const statusText =
      item.project.status === 'completed'
        ? 'Đã hoàn thành'
        : item.project.status === 'pending'
        ? 'Sắp khởi công'
        : 'Đang thi công';

    const completedVal = item.budget || item.project.budget || 0;
    const costRatio =
      completedVal > 0
        ? ((item.totalCost / completedVal) * 100).toFixed(1) + '%'
        : '-';

    overviewSheetData.push([
      idx + 1,
      item.project.code,
      item.project.name,
      item.project.partner || 'Chưa có thông tin',
      statusText,
      item.materialCost,
      item.laborCost,
      item.totalCost,
      completedVal,
      costRatio,
    ]);
  });

  const wsOverview = XLSX.utils.aoa_to_sheet(overviewSheetData);
  wsOverview['!cols'] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 30 },
    { wch: 25 },
    { wch: 16 },
    { wch: 22 },
    { wch: 22 },
    { wch: 22 },
    { wch: 20 },
    { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(wb, wsOverview, 'Tong_Hop_Bao_Cao');

  // ================= 2. SHEET VẬT TƯ (Materials Breakdown) =================
  const materialsSheetData: any[][] = [
    ['BÁO CÁO TIÊU HAO & XUẤT KHO VẬT TƯ CHỐNG THẤM'],
    [`Thời gian: ${reportData.timeFilterLabel} | Phạm vi: ${reportData.projectFilterLabel}`],
    [''],
    ['STT', 'Mã Vật Tư', 'Tên Hàng Hóa / Vật Tư', 'Nhóm Hàng', 'Đơn Vị Tính', 'Tổng SL Xuất', 'Tổng Giá Trị Xuất (VNĐ)', 'Tỷ Trọng (%)'],
  ];

  reportData.materialBreakdown.forEach((mat, idx) => {
    const ratio = reportData.totalMaterialCost > 0 ? ((mat.totalAmount / reportData.totalMaterialCost) * 100).toFixed(1) : '0';
    materialsSheetData.push([
      idx + 1,
      mat.code,
      mat.name,
      mat.category,
      mat.unit,
      mat.totalQty,
      mat.totalAmount,
      `${ratio}%`,
    ]);
  });

  const wsMaterials = XLSX.utils.aoa_to_sheet(materialsSheetData);
  wsMaterials['!cols'] = [
    { wch: 6 },
    { wch: 16 },
    { wch: 35 },
    { wch: 25 },
    { wch: 12 },
    { wch: 15 },
    { wch: 24 },
    { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, wsMaterials, 'Tieu_Hao_Vat_Tu');

  // ================= 3. SHEET CHẤM CÔNG (Labor Breakdown) =================
  const laborSheetData: any[][] = [
    ['BÁO CÁO NHÂN LỰC & CHI PHÍ CHẤM CÔNG'],
    [`Thời gian: ${reportData.timeFilterLabel} | Phạm vi: ${reportData.projectFilterLabel}`],
    [''],
    ['STT', 'Họ Và Tên Thợ', 'Vị Trí / Chức Danh', 'Tổng Số Ngày Công', 'Tổng Chi Phí Lương (VNĐ)', 'Các Công Trình Tham Gia'],
  ];

  reportData.laborBreakdown.forEach((lab, idx) => {
    laborSheetData.push([
      idx + 1,
      lab.staffName,
      lab.role,
      lab.workdays,
      lab.totalCost,
      lab.projectsUsed.join(', '),
    ]);
  });

  const wsLabor = XLSX.utils.aoa_to_sheet(laborSheetData);
  wsLabor['!cols'] = [
    { wch: 6 },
    { wch: 26 },
    { wch: 18 },
    { wch: 18 },
    { wch: 24 },
    { wch: 40 },
  ];
  XLSX.utils.book_append_sheet(wb, wsLabor, 'Nhat_Ky_Nhan_Cong');

  // Write file
  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `Bao_Cao_Tong_Hop_Chi_Phi_${dateStr}.xlsx`);
}

export function printComprehensiveReport(
  reportData: ReportSummaryData,
  companySettings?: CompanySettings
) {
  const formatCurrency = (v: number) => new Intl.NumberFormat('vi-VN').format(v || 0);
  const nowStr = new Date().toLocaleDateString('vi-VN');

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <title>Báo Cáo Tổng Hợp Chi Phí & Tiến Độ Thi Công - ${nowStr}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 12mm 12mm 12mm 12mm;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          color: #0f172a;
          margin: 0;
          padding: 0;
          font-size: 12px;
          line-height: 1.4;
        }
        .header {
          display: flex;
          justify-content: space-between;
          border-bottom: 2px solid #0b5ed7;
          padding-bottom: 10px;
          margin-bottom: 14px;
        }
        .company-name {
          font-size: 15px;
          font-weight: 800;
          color: #0b5ed7;
          text-transform: uppercase;
        }
        .company-meta {
          font-size: 10.5px;
          color: #64748b;
          margin-top: 2px;
        }
        .doc-title {
          text-align: center;
          margin: 12px 0 14px 0;
        }
        .doc-title h1 {
          font-size: 17px;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .doc-title p {
          font-size: 11px;
          color: #475569;
          margin-top: 3px;
        }
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          margin-bottom: 14px;
        }
        .kpi-card {
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          padding: 8px 10px;
        }
        .kpi-label {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          color: #64748b;
        }
        .kpi-value {
          font-size: 14px;
          font-weight: 800;
          margin-top: 2px;
          font-family: monospace;
        }
        .kpi-sub {
          font-size: 9.5px;
          color: #64748b;
          margin-top: 1px;
        }
        .section-title {
          font-size: 12px;
          font-weight: 800;
          color: #0f172a;
          margin: 14px 0 6px 0;
          text-transform: uppercase;
          border-left: 3px solid #0b5ed7;
          padding-left: 8px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 14px;
          font-size: 11px;
        }
        th, td {
          border: 1px solid #cbd5e1;
          padding: 5px 6px;
          text-align: left;
        }
        th {
          background: #f1f5f9;
          font-weight: 700;
          color: #334155;
          text-transform: uppercase;
          font-size: 9.5px;
        }
        .text-right {
          text-align: right;
        }
        .text-center {
          text-align: center;
        }
        .total-row {
          background: #f8fafc;
          font-weight: 800;
        }
        .badge {
          display: inline-block;
          padding: 1px 5px;
          border-radius: 4px;
          font-size: 9.5px;
          font-weight: 700;
        }
        .badge-completed {
          background: #ecfdf5;
          color: #047857;
          border: 1px solid #a7f3d0;
        }
        .badge-active {
          background: #fffbeb;
          color: #b45309;
          border: 1px solid #fde68a;
        }
        .badge-pending {
          background: #f1f5f9;
          color: #475569;
          border: 1px solid #e2e8f0;
        }
        .signatures {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          text-align: center;
          margin-top: 24px;
          page-break-inside: avoid;
        }
        .sig-title {
          font-weight: 700;
          font-size: 11.5px;
          color: #0f172a;
        }
        .sig-sub {
          font-size: 10px;
          color: #94a3b8;
          font-style: italic;
          margin-top: 2px;
        }
        .sig-space {
          height: 50px;
        }
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .page-break {
            page-break-before: always;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="company-name">${companySettings?.orgName || 'CÔNG TY TRƯỜNG SƠN - WATERPROOFING 36'}</div>
          <div class="company-meta">Địa chỉ: ${companySettings?.address || 'Hồ Chí Minh'} | Hotline: ${companySettings?.phone || '0915 586 234'} | MST: ${companySettings?.taxCode || '0318999888'}</div>
        </div>
        <div style="text-align: right; font-size: 10.5px; color: #64748b;">
          <div>Ngày in: <strong>${nowStr}</strong></div>
          <div>Kỳ báo cáo: <strong>${reportData.timeFilterLabel}</strong></div>
        </div>
      </div>

      <div class="doc-title">
        <h1>BÁO CÁO TỔNG HỢP CHI PHÍ & TIẾN ĐỘ THI CÔNG</h1>
        <p>Phạm vi: <strong>${reportData.projectFilterLabel}</strong> | Thời gian áp dụng: <strong>${reportData.timeFilterLabel}</strong></p>
      </div>

      <!-- KPI Summary Cards -->
      <div class="kpi-grid">
        <div class="kpi-card" style="border-left: 3px solid #0b5ed7;">
          <div class="kpi-label">Tổng Chi Phí</div>
          <div class="kpi-value" style="color: #0b5ed7;">${formatCurrency(reportData.totalCost)} đ</div>
          <div class="kpi-sub">Vật tư + Nhân công</div>
        </div>
        <div class="kpi-card" style="border-left: 3px solid #d97706;">
          <div class="kpi-label">Chi Phí Vật Tư</div>
          <div class="kpi-value" style="color: #d97706;">${formatCurrency(reportData.totalMaterialCost)} đ</div>
          <div class="kpi-sub">${reportData.totalExportsCount} lượt xuất kho</div>
        </div>
        <div class="kpi-card" style="border-left: 3px solid #059669;">
          <div class="kpi-label">Chi Phí Nhân Công</div>
          <div class="kpi-value" style="color: #059669;">${formatCurrency(reportData.totalLaborCost)} đ</div>
          <div class="kpi-sub">${reportData.totalWorkdays} ngày công</div>
        </div>
        <div class="kpi-card" style="border-left: 3px solid #6366f1;">
          <div class="kpi-label">Công Trình Đang Thi Công</div>
          <div class="kpi-value" style="color: #4f46e5;">${reportData.activeProjectsCount} / ${reportData.totalProjectsCount}</div>
          <div class="kpi-sub">Tổng số dự án quản lý</div>
        </div>
      </div>

      <!-- SECTION 1: DỰ ÁN & TIẾN ĐỘ CHI PHÍ -->
      <div class="section-title">1. TIẾN ĐỘ & CHI PHÍ TỪNG CÔNG TRÌNH (${reportData.filteredProjects.length} công trình)</div>
      <table>
        <thead>
          <tr>
            <th class="text-center" style="width: 28px;">STT</th>
            <th style="width: 70px;">Mã DA</th>
            <th>Tên Công Trình</th>
            <th>Chủ Đầu Tư</th>
            <th class="text-center" style="width: 80px;">Trạng Thái</th>
            <th class="text-right" style="width: 80px;">Vật Tư (VNĐ)</th>
            <th class="text-right" style="width: 80px;">Nhân Công (VNĐ)</th>
            <th class="text-right" style="width: 90px;">Tổng CP (VNĐ)</th>
            <th class="text-right" style="width: 90px;">Tổng GT Hoàn Thành</th>
            <th class="text-right" style="width: 58px;">Tỷ Trọng</th>
          </tr>
        </thead>
        <tbody>
          ${
            reportData.filteredProjects.length === 0
              ? `<tr><td colspan="10" class="text-center" style="color: #94a3b8; padding: 10px;">Không có dự án nào trong khoảng thời gian này.</td></tr>`
              : reportData.filteredProjects
                  .map((item, idx) => {
                    const statusClass =
                      item.project.status === 'completed'
                        ? 'badge badge-completed'
                        : item.project.status === 'pending'
                        ? 'badge badge-pending'
                        : 'badge badge-active';
                    const statusText =
                      item.project.status === 'completed'
                        ? 'Hoàn thành'
                        : item.project.status === 'pending'
                        ? 'Sắp khởi công'
                        : 'Đang thi công';

                    const costRatio =
                      item.budget > 0
                        ? `${((item.totalCost / item.budget) * 100).toFixed(1)}%`
                        : '-';

                    return `
                    <tr>
                      <td class="text-center">${idx + 1}</td>
                      <td><strong>${item.project.code}</strong></td>
                      <td><strong>${item.project.name}</strong></td>
                      <td>${item.project.partner || '-'}</td>
                      <td class="text-center"><span class="${statusClass}">${statusText}</span></td>
                      <td class="text-right" style="color: #d97706;">${formatCurrency(item.materialCost)} đ</td>
                      <td class="text-right" style="color: #059669;">${formatCurrency(item.laborCost)} đ</td>
                      <td class="text-right" style="font-weight: 700; color: #0b5ed7;">${formatCurrency(item.totalCost)} đ</td>
                      <td class="text-right">${item.budget > 0 ? `${formatCurrency(item.budget)} đ` : '-'}</td>
                      <td class="text-right" style="font-weight: 600;">${costRatio}</td>
                    </tr>
                  `;
                  })
                  .join('')
          }
          <tr class="total-row">
            <td colspan="5" class="text-right">TỔNG CỘNG CÁC CÔNG TRÌNH:</td>
            <td class="text-right" style="color: #d97706;">${formatCurrency(reportData.totalMaterialCost)} đ</td>
            <td class="text-right" style="color: #059669;">${formatCurrency(reportData.totalLaborCost)} đ</td>
            <td class="text-right" style="color: #0b5ed7;">${formatCurrency(reportData.totalCost)} đ</td>
            <td class="text-right">${formatCurrency(reportData.filteredProjects.reduce((s, i) => s + (i.budget || 0), 0))} đ</td>
            <td class="text-right">${(() => {
              const totalCompleted = reportData.filteredProjects.reduce((s, i) => s + (i.budget || 0), 0);
              return totalCompleted > 0 ? `${((reportData.totalCost / totalCompleted) * 100).toFixed(1)}%` : '-';
            })()}</td>
          </tr>
        </tbody>
      </table>

      <!-- SECTION 2: VẬT TƯ -->
      <div class="section-title">2. BÁO CÁO TIÊU HAO & XUẤT KHO VẬT TƯ (${reportData.materialBreakdown.length} loại vật tư)</div>
      <table>
        <thead>
          <tr>
            <th class="text-center" style="width: 28px;">STT</th>
            <th style="width: 80px;">Mã VT</th>
            <th>Tên Hàng Hóa / Vật Tư Chống Thấm</th>
            <th style="width: 100px;">Nhóm Hàng</th>
            <th class="text-center" style="width: 45px;">ĐVT</th>
            <th class="text-right" style="width: 65px;">Tổng SL</th>
            <th class="text-right" style="width: 100px;">Thành Tiền (VNĐ)</th>
            <th class="text-right" style="width: 60px;">Tỷ Trọng</th>
          </tr>
        </thead>
        <tbody>
          ${
            reportData.materialBreakdown.length === 0
              ? `<tr><td colspan="8" class="text-center" style="color: #94a3b8; padding: 10px;">Chưa có dữ liệu vật tư xuất kho.</td></tr>`
              : reportData.materialBreakdown
                  .map((mat, idx) => {
                    const ratio =
                      reportData.totalMaterialCost > 0
                        ? ((mat.totalAmount / reportData.totalMaterialCost) * 100).toFixed(1)
                        : '0';
                    return `
                    <tr>
                      <td class="text-center">${idx + 1}</td>
                      <td><strong>${mat.code}</strong></td>
                      <td>${mat.name}</td>
                      <td>${mat.category || 'Chống thấm'}</td>
                      <td class="text-center">${mat.unit}</td>
                      <td class="text-right"><strong>${mat.totalQty.toLocaleString('vi-VN')}</strong></td>
                      <td class="text-right" style="font-weight: 700; color: #d97706;">${formatCurrency(mat.totalAmount)} đ</td>
                      <td class="text-right">${ratio}%</td>
                    </tr>
                  `;
                  })
                  .join('')
          }
          <tr class="total-row">
            <td colspan="5" class="text-right">TỔNG CỘNG GIÁ TRỊ VẬT TƯ:</td>
            <td class="text-right">${reportData.materialBreakdown.reduce((s, i) => s + i.totalQty, 0).toLocaleString('vi-VN')}</td>
            <td class="text-right" style="color: #d97706;">${formatCurrency(reportData.totalMaterialCost)} đ</td>
            <td class="text-right">100%</td>
          </tr>
        </tbody>
      </table>

      <!-- SECTION 3: NHÂN CÔNG -->
      <div class="section-title">3. BÁO CÁO NHÂN LỰC & CHI PHÍ CHẤM CÔNG (${reportData.laborBreakdown.length} thợ / nhân sự)</div>
      <table>
        <thead>
          <tr>
            <th class="text-center" style="width: 28px;">STT</th>
            <th>Họ Và Tên Thợ</th>
            <th style="width: 110px;">Vị Trí / Chức Danh</th>
            <th class="text-center" style="width: 80px;">Số Ngày Công</th>
            <th class="text-right" style="width: 105px;">Tổng Lương (VNĐ)</th>
            <th>Công Trình Tham Gia</th>
          </tr>
        </thead>
        <tbody>
          ${
            reportData.laborBreakdown.length === 0
              ? `<tr><td colspan="6" class="text-center" style="color: #94a3b8; padding: 10px;">Chưa có dữ liệu chấm công.</td></tr>`
              : reportData.laborBreakdown
                  .map((lab, idx) => `
                    <tr>
                      <td class="text-center">${idx + 1}</td>
                      <td><strong>${lab.staffName}</strong></td>
                      <td>${lab.role}</td>
                      <td class="text-center" style="font-weight: 700; color: #059669;">${lab.workdays} công</td>
                      <td class="text-right" style="font-weight: 700; color: #e11d48;">${formatCurrency(lab.totalCost)} đ</td>
                      <td>${lab.projectsUsed.join(', ') || 'Công trình chung'}</td>
                    </tr>
                  `)
                  .join('')
          }
          <tr class="total-row">
            <td colspan="3" class="text-right">TỔNG CỘNG NHÂN CÔNG & LƯƠNG:</td>
            <td class="text-center" style="color: #059669;">${reportData.totalWorkdays} công</td>
            <td class="text-right" style="color: #e11d48;">${formatCurrency(reportData.totalLaborCost)} đ</td>
            <td></td>
          </tr>
        </tbody>
      </table>

      <!-- SIGNATURES -->
      <div class="signatures">
        <div>
          <div class="sig-title">Người Lập Báo Cáo</div>
          <div class="sig-sub">(Ký và ghi rõ họ tên)</div>
          <div class="sig-space"></div>
        </div>
        <div>
          <div class="sig-title">Kế Toán Trưởng / Chỉ Huy Trưởng</div>
          <div class="sig-sub">(Ký và ghi rõ họ tên)</div>
          <div class="sig-space"></div>
        </div>
        <div>
          <div class="sig-title">Ban Giám Đốc Duyệt</div>
          <div class="sig-sub">(Ký, đóng dấu)</div>
          <div class="sig-space"></div>
        </div>
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  }
}

