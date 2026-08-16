import * as XLSX from 'xlsx';
import { ConstructionProject, ExportedGood, LaborDailyLog, CompanySettings } from '../types';

export function exportProjectToExcel(
  project: ConstructionProject,
  exportsList: ExportedGood[],
  laborList: LaborDailyLog[],
  companySettings?: CompanySettings
) {
  const wb = XLSX.utils.book_new();
  const formatCurrency = (v: number) => new Intl.NumberFormat('vi-VN').format(v);

  const totalExportsVal = exportsList.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  const totalLaborCost = laborList.reduce((sum, item) => sum + (item.totalCost || 0), 0);
  const totalWorkdays = laborList.reduce((sum, item) => sum + (item.totalWorkdays || 0), 0);

  // 1. SHEET TỔNG QUAN
  const statusText =
    project.status === 'completed'
      ? 'ĐÃ NGHIỆM THU HOÀN THÀNH'
      : project.status === 'pending'
      ? 'CHUẨN BỊ / SẮP KHỞI CÔNG'
      : 'ĐANG THI CÔNG';

  const overviewData: any[][] = [
    [companySettings?.orgName || 'CÔNG TY TNHH XÂY DỰNG & CHỐNG THẤM 36'],
    [`Địa chỉ: ${companySettings?.address || 'Hồ Chí Minh'} | Hotline: ${companySettings?.phone || '0901234567'}`],
    [''],
    ['BÁO CÁO CHI TIẾT CÔNG TRÌNH & TIẾN ĐỘ THI CÔNG'],
    [`Ngày xuất báo cáo: ${new Date().toLocaleDateString('vi-VN')}`],
    [''],
    ['THÔNG TIN DỰ ÁN', 'GIÁ TRỊ CHI TIẾT'],
    ['Mã Công Trình / Dự Án', project.code],
    ['Tên Công Trình', project.name],
    ['Chủ Đầu Tư / Đối Tác', project.partner || 'N/A'],
    ['Địa Chỉ Thi Công', project.address || 'N/A'],
    ['Ngày Khởi Công', project.startDate || 'N/A'],
    ['Trạng Thái Công Trình', statusText],
    ['Tổng Giá Trị Nghiệm Thu', project.completedValue ? `${formatCurrency(project.completedValue)} VNĐ` : 'Chưa nghiệm thu'],
    ['Tổng Giá Trị Vật Tư Xuất Kho', `${formatCurrency(totalExportsVal)} VNĐ`],
    ['Tổng Số Ngày Công Chấm', `${totalWorkdays} Công`],
    ['Tổng Chi Phí Nhân Công', `${formatCurrency(totalLaborCost)} VNĐ`],
    ['Ghi Chú Công Trình', project.notes || 'Không có'],
  ];

  const wsOverview = XLSX.utils.aoa_to_sheet(overviewData);
  wsOverview['!cols'] = [{ wch: 30 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, wsOverview, 'Tong_Quan_Du_An');

  // 2. SHEET VẬT TƯ XUẤT KHO
  const exportsData: any[][] = [
    [`DANH SÁCH VẬT TƯ ĐÃ XUẤT KHO - ${project.name} (${project.code})`],
    [''],
    ['STT', 'Ngày Xuất', 'Tên Vật Tư Chống Thấm', 'Đơn Vị Tính', 'Số Lượng', 'Đơn Giá (VNĐ)', 'Thành Tiền (VNĐ)', 'Người Nhận Hàng'],
  ];

  exportsList.forEach((item, idx) => {
    const unitPrice = item.quantity > 0 ? Math.round(item.totalPrice / item.quantity) : 0;
    exportsData.push([
      idx + 1,
      item.date,
      item.materialName,
      item.unit,
      item.quantity,
      unitPrice,
      item.totalPrice,
      item.recipient || 'N/A',
    ]);
  });

  exportsData.push([
    '',
    '',
    'TỔNG CỘNG VẬT TƯ',
    '',
    exportsList.reduce((s, i) => s + (i.quantity || 0), 0),
    '',
    totalExportsVal,
    '',
  ]);

  const wsExports = XLSX.utils.aoa_to_sheet(exportsData);
  wsExports['!cols'] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 32 },
    { wch: 12 },
    { wch: 12 },
    { wch: 16 },
    { wch: 20 },
    { wch: 24 },
  ];
  XLSX.utils.book_append_sheet(wb, wsExports, 'Vat_Tu_Xuat_Kho');

  // 3. SHEET NHẬT KÝ CHẤM CÔNG
  const laborData: any[][] = [
    [`NHẬT KÝ CHẤM CÔNG NHÂN CÔNG - ${project.name} (${project.code})`],
    [''],
    ['STT', 'Ngày', 'Thứ', 'Thợ Chính (người)', 'Thợ Phụ (người)', 'Tổng Công', 'Chi Phí Nhân Công (VNĐ)', 'Hạng Mục / Nội Dung Công Việc'],
  ];

  laborList.forEach((log, idx) => {
    laborData.push([
      idx + 1,
      log.date,
      log.dayOfWeek,
      log.mainWorkers,
      log.helperWorkers,
      log.totalWorkdays,
      log.totalCost,
      log.notes || 'Thi công chống thấm',
    ]);
  });

  laborData.push([
    '',
    '',
    'TỔNG CỘNG NHÂN CÔNG',
    laborList.reduce((s, i) => s + (i.mainWorkers || 0), 0),
    laborList.reduce((s, i) => s + (i.helperWorkers || 0), 0),
    totalWorkdays,
    totalLaborCost,
    '',
  ]);

  const wsLabor = XLSX.utils.aoa_to_sheet(laborData);
  wsLabor['!cols'] = [
    { wch: 6 },
    { wch: 12 },
    { wch: 8 },
    { wch: 18 },
    { wch: 18 },
    { wch: 14 },
    { wch: 22 },
    { wch: 40 },
  ];
  XLSX.utils.book_append_sheet(wb, wsLabor, 'Nhat_Ky_Cham_Cong');

  // Generate binary and trigger download
  const dateStr = new Date().toISOString().slice(0, 10);
  const cleanCode = (project.code || 'CT').replace(/[^a-zA-Z0-9_-]/g, '');
  XLSX.writeFile(wb, `Bao_Cao_Cong_Trinh_${cleanCode}_${dateStr}.xlsx`);
}

export function printProjectReport(
  project: ConstructionProject,
  exportsList: ExportedGood[],
  laborList: LaborDailyLog[],
  companySettings?: CompanySettings
) {
  const formatCurrency = (v: number) => new Intl.NumberFormat('vi-VN').format(v);
  const totalExportsVal = exportsList.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  const totalLaborCost = laborList.reduce((sum, item) => sum + (item.totalCost || 0), 0);
  const totalWorkdays = laborList.reduce((sum, item) => sum + (item.totalWorkdays || 0), 0);

  const statusText =
    project.status === 'completed'
      ? 'ĐÃ NGHIỆM THU HOÀN THÀNH'
      : project.status === 'pending'
      ? 'CHUẨN BỊ / SẮP KHỞI CÔNG'
      : 'ĐANG THI CÔNG';

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <title>Báo Cáo Chi Tiết Công Trình - ${project.code}</title>
      <style>
        @page {
          size: A4;
          margin: 15mm 15mm 15mm 15mm;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          color: #1e293b;
          margin: 0;
          padding: 0;
          font-size: 13px;
          line-height: 1.45;
        }
        .header {
          display: flex;
          justify-content: space-between;
          border-bottom: 2px solid #0c59be;
          padding-bottom: 12px;
          margin-bottom: 16px;
        }
        .company-name {
          font-size: 16px;
          font-weight: 800;
          color: #0c59be;
          text-transform: uppercase;
        }
        .company-meta {
          font-size: 11px;
          color: #64748b;
          margin-top: 2px;
        }
        .doc-title {
          text-align: center;
          margin: 14px 0 16px 0;
        }
        .doc-title h1 {
          font-size: 18px;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .doc-title p {
          font-size: 11px;
          color: #64748b;
          margin-top: 4px;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px 16px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 16px;
        }
        .info-item {
          display: flex;
          font-size: 12px;
        }
        .info-label {
          width: 140px;
          color: #64748b;
          font-weight: 600;
        }
        .info-value {
          font-weight: 700;
          color: #0f172a;
          flex: 1;
        }
        .highlight-box {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 8px;
          padding: 10px 14px;
          margin-bottom: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .highlight-title {
          font-size: 12px;
          font-weight: 700;
          color: #1e40af;
        }
        .highlight-value {
          font-size: 16px;
          font-weight: 800;
          color: #1d4ed8;
          font-family: monospace;
        }
        .section-title {
          font-size: 13px;
          font-weight: 800;
          color: #0f172a;
          margin: 16px 0 8px 0;
          text-transform: uppercase;
          border-left: 3px solid #0c59be;
          padding-left: 8px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 16px;
          font-size: 11.5px;
        }
        th, td {
          border: 1px solid #cbd5e1;
          padding: 6px 8px;
          text-align: left;
        }
        th {
          background: #f1f5f9;
          font-weight: 700;
          color: #334155;
          text-transform: uppercase;
          font-size: 10px;
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
        .signatures {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          text-align: center;
          margin-top: 32px;
          page-break-inside: avoid;
        }
        .sig-title {
          font-weight: 700;
          font-size: 12px;
          color: #0f172a;
        }
        .sig-sub {
          font-size: 10px;
          color: #94a3b8;
          font-style: italic;
          margin-top: 2px;
        }
        .sig-space {
          height: 55px;
        }
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="company-name">${companySettings?.orgName || 'CÔNG TY TNHH XÂY DỰNG & CHỐNG THẤM 36'}</div>
          <div class="company-meta">Địa chỉ: ${companySettings?.address || 'Hồ Chí Minh'} | Hotline: ${companySettings?.phone || '0901234567'} | MST: ${companySettings?.taxCode || '0318999888'}</div>
        </div>
        <div style="text-align: right; font-size: 11px; color: #64748b;">
          <div>Mã: <strong>${project.code}</strong></div>
          <div>Ngày in: ${new Date().toLocaleDateString('vi-VN')}</div>
        </div>
      </div>

      <div class="doc-title">
        <h1>BÁO CÁO CHI TIẾT CÔNG TRÌNH & TIẾN ĐỘ THI CÔNG</h1>
        <p>Hồ sơ lưu trữ quản lý vật tư xuất kho, chi phí nhân công & giá trị nghiệm thu</p>
      </div>

      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Mã dự án:</span>
          <span class="info-value">${project.code}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Trạng thái:</span>
          <span class="info-value" style="color: ${project.status === 'completed' ? '#047857' : '#0c59be'};">${statusText}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Tên công trình:</span>
          <span class="info-value">${project.name}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Ngày khởi công:</span>
          <span class="info-value">${project.startDate}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Chủ đầu tư / Đối tác:</span>
          <span class="info-value">${project.partner || 'N/A'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Địa chỉ thi công:</span>
          <span class="info-value">${project.address || 'N/A'}</span>
        </div>
      </div>

      ${
        project.status === 'completed' && project.completedValue
          ? `
        <div class="highlight-box">
          <div>
            <div class="highlight-title">TỔNG GIÁ TRỊ NGHIỆM THU HOÀN THÀNH</div>
            <div style="font-size: 11px; color: #60a5fa;">Đã xác nhận biên bản nghiệm thu bàn giao</div>
          </div>
          <div class="highlight-value">${formatCurrency(project.completedValue)} VNĐ</div>
        </div>
        `
          : ''
      }

      <div class="section-title">1. BẢNG TỔNG HỢP VẬT TƯ ĐÃ XUẤT KHO (${exportsList.length} lượt xuất)</div>
      <table>
        <thead>
          <tr>
            <th class="text-center" style="width: 30px;">STT</th>
            <th style="width: 80px;">Ngày</th>
            <th>Tên Vật Tư Chống Thấm</th>
            <th class="text-center" style="width: 50px;">ĐVT</th>
            <th class="text-right" style="width: 60px;">Số Lượng</th>
            <th class="text-right" style="width: 90px;">Đơn Giá</th>
            <th class="text-right" style="width: 100px;">Thành Tiền</th>
            <th style="width: 110px;">Người Nhận</th>
          </tr>
        </thead>
        <tbody>
          ${
            exportsList.length === 0
              ? `<tr><td colspan="8" class="text-center" style="color: #94a3b8; padding: 12px;">Chưa có vật tư nào được xuất cho công trình này.</td></tr>`
              : exportsList
                  .map(
                    (exp, i) => `
                <tr>
                  <td class="text-center">${i + 1}</td>
                  <td>${exp.date}</td>
                  <td><strong>${exp.materialName}</strong></td>
                  <td class="text-center">${exp.unit}</td>
                  <td class="text-right">${exp.quantity}</td>
                  <td class="text-right">${formatCurrency(exp.quantity > 0 ? Math.round(exp.totalPrice / exp.quantity) : 0)} đ</td>
                  <td class="text-right"><strong>${formatCurrency(exp.totalPrice)} đ</strong></td>
                  <td>${exp.recipient || ''}</td>
                </tr>
              `
                  )
                  .join('')
          }
          <tr class="total-row">
            <td colspan="4" class="text-right">TỔNG CỘNG TIỀN VẬT TƯ:</td>
            <td class="text-right">${exportsList.reduce((s, i) => s + (i.quantity || 0), 0)}</td>
            <td></td>
            <td class="text-right" style="color: #0c59be;">${formatCurrency(totalExportsVal)} đ</td>
            <td></td>
          </tr>
        </tbody>
      </table>

      <div class="section-title">2. NHẬT KÝ CHẤM CÔNG NHÂN CÔNG (${laborList.length} ngày thi công)</div>
      <table>
        <thead>
          <tr>
            <th class="text-center" style="width: 30px;">STT</th>
            <th style="width: 70px;">Ngày</th>
            <th class="text-center" style="width: 40px;">Thứ</th>
            <th class="text-center" style="width: 70px;">Thợ chính</th>
            <th class="text-center" style="width: 70px;">Thợ phụ</th>
            <th class="text-center" style="width: 75px;">Tổng công</th>
            <th class="text-right" style="width: 100px;">Chi Phí (VNĐ)</th>
            <th>Nội Dung Thi Công</th>
          </tr>
        </thead>
        <tbody>
          ${
            laborList.length === 0
              ? `<tr><td colspan="8" class="text-center" style="color: #94a3b8; padding: 12px;">Chưa có nhật ký chấm công cho công trình này.</td></tr>`
              : laborList
                  .map(
                    (log, i) => `
                <tr>
                  <td class="text-center">${i + 1}</td>
                  <td>${log.date}</td>
                  <td class="text-center">${log.dayOfWeek}</td>
                  <td class="text-center">${log.mainWorkers}</td>
                  <td class="text-center">${log.helperWorkers}</td>
                  <td class="text-center" style="font-weight: 700; color: #1d4ed8;">${log.totalWorkdays} Công</td>
                  <td class="text-right" style="color: #e11d48; font-weight: 700;">${formatCurrency(log.totalCost)} đ</td>
                  <td>${log.notes || ''}</td>
                </tr>
              `
                  )
                  .join('')
          }
          <tr class="total-row">
            <td colspan="3" class="text-right">TỔNG CỘNG NHÂN CÔNG:</td>
            <td class="text-center">${laborList.reduce((s, i) => s + (i.mainWorkers || 0), 0)}</td>
            <td class="text-center">${laborList.reduce((s, i) => s + (i.helperWorkers || 0), 0)}</td>
            <td class="text-center" style="color: #1d4ed8;">${totalWorkdays} Công</td>
            <td class="text-right" style="color: #e11d48;">${formatCurrency(totalLaborCost)} đ</td>
            <td></td>
          </tr>
        </tbody>
      </table>

      ${
        project.notes
          ? `
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 8px 12px; margin-bottom: 16px; font-size: 11.5px;">
          <strong>Ghi chú bổ sung:</strong> ${project.notes}
        </div>
      `
          : ''
      }

      <div class="signatures">
        <div>
          <div class="sig-title">Người Lập Báo Cáo</div>
          <div class="sig-sub">(Ký và ghi rõ họ tên)</div>
          <div class="sig-space"></div>
        </div>
        <div>
          <div class="sig-title">Chỉ Huy Trưởng Công Trình</div>
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
