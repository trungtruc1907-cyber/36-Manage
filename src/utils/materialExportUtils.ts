import * as XLSX from 'xlsx';
import { MaterialItem, CompanySettings } from '../types';

/**
 * Export materials catalog to Excel (.xlsx) matching the 10-column database format from user reference
 */
export function exportMaterialsToExcel(
  materials: MaterialItem[],
  companySettings?: CompanySettings
) {
  const companyName = companySettings?.orgName || companySettings?.brandName || 'CÔNG TY TNHH CHỐNG THẤM TRƯỜNG SƠN - CHỐNG THẤM 36';
  const hotline = companySettings?.phone || '0915 586 234 - 0988 123 456';
  const address = companySettings?.address || 'TP. Thanh Hóa, Tỉnh Thanh Hóa';

  // 1. Data rows with 10 standard columns
  const dataRows = materials.map((m) => ({
    'Loại hàng': m.itemType || 'Hàng hóa',
    'Nhóm hàng': m.category || 'Vật tư chống thấm',
    'Mã hàng': m.code || '',
    'Tên hàng': m.name || '',
    'Thương hiệu': m.brand || 'Chống Thấm 36',
    'Giá bán': m.price || m.defaultPrice || 0,
    'Giá vốn': m.costPrice || 0,
    'Tồn kho': m.stockQty || 0,
    'ĐVT': m.unit || 'Bộ',
    'Mô tả': m.description || '',
  }));

  // Create worksheet from data
  const ws = XLSX.utils.json_to_sheet(dataRows);

  // Set column widths for readability
  ws['!cols'] = [
    { wch: 14 }, // Loại hàng
    { wch: 28 }, // Nhóm hàng
    { wch: 16 }, // Mã hàng
    { wch: 45 }, // Tên hàng
    { wch: 18 }, // Thương hiệu
    { wch: 16 }, // Giá bán
    { wch: 14 }, // Giá vốn
    { wch: 12 }, // Tồn kho
    { wch: 10 }, // ĐVT
    { wch: 40 }, // Mô tả
  ];

  // Create workbook and append sheet
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Danh_Muc_Vat_Tu');

  // Summary statistics sheet
  const totalItems = materials.length;
  const totalStockQty = materials.reduce((sum, m) => sum + (m.stockQty || 0), 0);
  const totalSellingVal = materials.reduce(
    (sum, m) => sum + (m.stockQty || 0) * (m.price || m.defaultPrice || 0),
    0
  );
  const totalCostVal = materials.reduce(
    (sum, m) => sum + (m.stockQty || 0) * (m.costPrice || 0),
    0
  );

  const summaryData = [
    ['BÁO CÁO TỔNG HỢP KHO VẬT TƯ & HÀNG HÓA CHỐNG THẤM'],
    ['Đơn vị:', companyName],
    ['Địa chỉ:', address],
    ['Hotline:', hotline],
    ['Ngày xuất dữ liệu:', new Date().toLocaleDateString('vi-VN')],
    [],
    ['Chỉ số thống kê', 'Giá trị'],
    ['Tổng số mặt hàng (SKU)', totalItems],
    ['Tổng số lượng tồn kho', totalStockQty],
    ['Tổng giá trị tồn kho (Theo giá bán)', totalSellingVal],
    ['Tổng giá trị tồn kho (Theo giá vốn)', totalCostVal],
    ['Chênh lệch giá trị dự kiến', totalSellingVal - totalCostVal],
  ];

  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
  summaryWs['!cols'] = [{ wch: 38 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Tong_Quan_Kho');

  // File naming
  const dateStr = new Date().toISOString().split('T')[0];
  const fileName = `Danh_Muc_Vat_Tu_Chong_Tham_${dateStr}.xlsx`;

  // Download trigger
  XLSX.writeFile(wb, fileName);
}

/**
 * Print clean A4 report for Materials Price List & Inventory
 */
export function printMaterialsCatalog(
  materials: MaterialItem[],
  companySettings?: CompanySettings
) {
  const companyName = companySettings?.orgName || companySettings?.brandName || 'CÔNG TY TNHH CHỐNG THẤM TRƯỜNG SƠN - CHỐNG THẤM 36';
  const hotline = companySettings?.phone || '0915 586 234 - 0988 123 456';
  const address = companySettings?.address || 'TP. Thanh Hóa, Tỉnh Thanh Hóa';
  const email = companySettings?.email || 'kinhdoanh@chongtham36.vn';
  const website = 'www.chongtham36.vn';
  const logoUrl = companySettings?.customLogoUrl || '';

  const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN').format(val);
  const printDate = new Date().toLocaleDateString('vi-VN');

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Trình duyệt đã chặn cửa sổ in (pop-up). Vui lòng cấp quyền cho phép mở tab mới.');
    return;
  }

  // Group materials by category
  const categoriesMap: Record<string, MaterialItem[]> = {};
  materials.forEach((m) => {
    const cat = m.category || 'Khác';
    if (!categoriesMap[cat]) {
      categoriesMap[cat] = [];
    }
    categoriesMap[cat].push(m);
  });

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="utf-8" />
      <title>Bảng Báo Giá & Danh Mục Vật Tư Chống Thấm 36</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 12mm 15mm;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          color: #1e293b;
          background: #fff;
          font-size: 11.5px;
          line-height: 1.4;
          padding: 10px;
        }
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 2px solid #0284c7;
          padding-bottom: 12px;
          margin-bottom: 16px;
        }
        .company-info h1 {
          font-size: 16px;
          font-weight: 800;
          color: #0369a1;
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        .company-info p {
          font-size: 11px;
          color: #475569;
          margin-bottom: 2px;
        }
        .report-title {
          text-align: center;
          margin: 14px 0 16px 0;
        }
        .report-title h2 {
          font-size: 18px;
          font-weight: 800;
          color: #0f172a;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .report-title p {
          font-size: 11px;
          color: #64748b;
          margin-top: 3px;
        }
        .summary-boxes {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
        }
        .box {
          flex: 1;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 8px 12px;
        }
        .box-label {
          font-size: 10px;
          color: #64748b;
          text-transform: uppercase;
          font-weight: 600;
        }
        .box-value {
          font-size: 14px;
          font-weight: 700;
          color: #0284c7;
          margin-top: 2px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 16px;
        }
        th, td {
          border: 1px solid #cbd5e1;
          padding: 6px 8px;
          text-align: left;
        }
        th {
          background-color: #f1f5f9;
          color: #1e293b;
          font-weight: 700;
          font-size: 11px;
          text-transform: uppercase;
        }
        tr:nth-child(even) td {
          background-color: #f8fafc;
        }
        .cat-row td {
          background-color: #e0f2fe;
          color: #0369a1;
          font-weight: 700;
          font-size: 12px;
          padding: 6px 10px;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-mono { font-family: monospace; font-size: 11px; font-weight: 600; }
        .price { font-weight: 700; color: #0f172a; }
        .signatures {
          margin-top: 24px;
          display: flex;
          justify-content: space-between;
          page-break-inside: avoid;
        }
        .sig-col {
          text-align: center;
          width: 30%;
        }
        .sig-title {
          font-weight: 700;
          font-size: 11px;
          margin-bottom: 4px;
        }
        .sig-desc {
          font-size: 10px;
          color: #64748b;
          font-style: italic;
          margin-bottom: 50px;
        }
        .sig-name {
          font-weight: 700;
          border-top: 1px dashed #cbd5e1;
          padding-top: 4px;
          display: inline-block;
          min-width: 140px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-info">
          <h1>${companyName}</h1>
          <p><strong>Địa chỉ:</strong> ${address}</p>
          <p><strong>Hotline kỹ thuật & kho hàng:</strong> ${hotline} | <strong>Email:</strong> ${email}</p>
          <p><strong>Website:</strong> ${website}</p>
        </div>
        ${logoUrl ? `<img src="${logoUrl}" style="max-height: 55px; max-width: 150px; object-fit: contain;" alt="Logo" />` : ''}
      </div>

      <div class="report-title">
        <h2>BẢNG BÁO GIÁ & DANH MỤC VẬT TƯ CHỐNG THẤM</h2>
        <p>Cập nhật ngày ${printDate} | Hệ thống quản lý kho & định mức vật tư</p>
      </div>

      <div class="summary-boxes">
        <div class="box">
          <div class="box-label">Tổng số mặt hàng</div>
          <div class="box-value">${materials.length} sản phẩm</div>
        </div>
        <div class="box">
          <div class="box-label">Số nhóm hàng</div>
          <div class="box-value">${Object.keys(categoriesMap).length} nhóm</div>
        </div>
        <div class="box">
          <div class="box-label">Tổng tồn kho</div>
          <div class="box-value">${materials.reduce((s, m) => s + (m.stockQty || 0), 0)} đơn vị</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th class="text-center" style="width: 35px;">STT</th>
            <th style="width: 90px;">Mã hàng</th>
            <th>Tên hàng / Vật tư</th>
            <th style="width: 100px;">Thương hiệu</th>
            <th class="text-center" style="width: 50px;">ĐVT</th>
            <th class="text-right" style="width: 95px;">Đơn giá (VNĐ)</th>
            <th class="text-center" style="width: 60px;">Tồn kho</th>
            <th>Quy cách / Mô tả</th>
          </tr>
        </thead>
        <tbody>
          ${(() => {
            let stt = 1;
            return Object.entries(categoriesMap)
              .map(([cat, items]) => {
                const headerRow = `
                  <tr class="cat-row">
                    <td colspan="8"><strong>▶ NHÓM: ${cat.toUpperCase()} (${items.length} mặt hàng)</strong></td>
                  </tr>
                `;
                const itemRows = items
                  .map((item) => {
                    const row = `
                      <tr>
                        <td class="text-center">${stt++}</td>
                        <td class="font-mono text-center">${item.code || '-'}</td>
                        <td><strong>${item.name}</strong></td>
                        <td>${item.brand || 'Chống Thấm 36'}</td>
                        <td class="text-center"><strong>${item.unit}</strong></td>
                        <td class="text-right price">${formatCurrency(item.price || item.defaultPrice || 0)}</td>
                        <td class="text-center">${item.stockQty || 0}</td>
                        <td style="font-size: 10.5px; color: #475569;">${item.description || '-'}</td>
                      </tr>
                    `;
                    return row;
                  })
                  .join('');
                return headerRow + itemRows;
              })
              .join('');
          })()}
        </tbody>
      </table>

      <div class="signatures">
        <div class="sig-col">
          <div class="sig-title">NGƯỜI LẬP BẢNG</div>
          <div class="sig-desc">(Ký và ghi rõ họ tên)</div>
          <div class="sig-name">Thủ Kho / Kế Toán</div>
        </div>
        <div class="sig-col">
          <div class="sig-title">PHÒNG KỸ THUẬT - VẬT TƯ</div>
          <div class="sig-desc">(Ký và ghi rõ họ tên)</div>
          <div class="sig-name">Chỉ Huy Trưởng</div>
        </div>
        <div class="sig-col">
          <div class="sig-title">BAN GIÁM ĐỐC DUYỆT</div>
          <div class="sig-desc">(Ký tên & đóng dấu)</div>
          <div class="sig-name">Giám Đốc Điều Hành</div>
        </div>
      </div>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();

  printWindow.onload = () => {
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  };
}

/**
 * Download standard Excel template for importing materials (.xlsx)
 */
export function downloadMaterialsTemplateExcel() {
  const templateRows = [
    {
      'Loại hàng': 'Hàng hóa',
      'Nhóm hàng': 'Hai thành phần gốc xi măng',
      'Mã hàng': 'SP2511175',
      'Tên hàng': 'Quicseal 104s (Bộ 40kg: 20kg Bột + 20kg Nhựa)',
      'Thương hiệu': 'Quicseal',
      'Giá bán': 1385000,
      'Giá vốn': 1150000,
      'Tồn kho': 45,
      'ĐVT': 'Bộ',
      'Mô tả': 'Màng chống thấm gốc xi măng dẻo hai thành phần chất lượng cao',
    },
    {
      'Loại hàng': 'Hàng hóa',
      'Nhóm hàng': 'Hai thành phần gốc xi măng',
      'Mã hàng': 'SP2511158',
      'Tên hàng': 'Quicseal 111 (Bộ 20kg: 10kg Bột + 10kg Nhựa)',
      'Thương hiệu': 'Quicseal',
      'Giá bán': 1485000,
      'Giá vốn': 1200000,
      'Tồn kho': 30,
      'ĐVT': 'Bộ',
      'Mô tả': 'Màng chống thấm tinh thể thẩm thấu và tạo màng dẻo',
    },
    {
      'Loại hàng': 'Hàng hóa',
      'Nhóm hàng': 'Hai thành phần gốc xi măng',
      'Mã hàng': 'SP2511157',
      'Tên hàng': 'Quicseal 103 (Thùng 20kg)',
      'Thương hiệu': 'Quicseal',
      'Giá bán': 1850000,
      'Giá vốn': 1550000,
      'Tồn kho': 25,
      'ĐVT': 'Thùng',
      'Mô tả': 'Màng chống thấm Acrylic đàn hồi cao chống tia UV',
    },
    {
      'Loại hàng': 'Hàng hóa',
      'Nhóm hàng': 'Hai thành phần gốc xi măng',
      'Mã hàng': 'SP2511156',
      'Tên hàng': 'SikaTop Seal 107 (Bộ 25kg: 5kg Nhựa + 20kg Bột)',
      'Thương hiệu': 'Sika',
      'Giá bán': 820000,
      'Giá vốn': 690000,
      'Tồn kho': 50,
      'ĐVT': 'Bộ',
      'Mô tả': 'Vữa chống thấm và bảo vệ đàn hồi gốc xi măng polyme',
    },
    {
      'Loại hàng': 'Hàng hóa',
      'Nhóm hàng': 'Gốc Polyurethane (PU)',
      'Mã hàng': 'SP2511140',
      'Tên hàng': 'Mariseal 250 (Thùng 25kg)',
      'Thương hiệu': 'Maris Polymers',
      'Giá bán': 3250000,
      'Giá vốn': 2850000,
      'Tồn kho': 15,
      'ĐVT': 'Thùng',
      'Mô tả': 'Màng chống thấm Polyurethane nguyên chất một thành phần lộ thiên',
    },
    {
      'Loại hàng': 'Hàng hóa',
      'Nhóm hàng': 'Băng cản nước / Khớp nối',
      'Mã hàng': 'SP2511135',
      'Tên hàng': 'Sika Waterbar V20 (Cuộn 20m)',
      'Thương hiệu': 'Sika',
      'Giá bán': 1650000,
      'Giá vốn': 1350000,
      'Tồn kho': 12,
      'ĐVT': 'Cuộn',
      'Mô tả': 'Băng cản nước PVC đàn hồi dùng cho mạch ngừng bê tông',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(templateRows);
  ws['!cols'] = [
    { wch: 14 }, // Loại hàng
    { wch: 28 }, // Nhóm hàng
    { wch: 16 }, // Mã hàng
    { wch: 45 }, // Tên hàng
    { wch: 18 }, // Thương hiệu
    { wch: 16 }, // Giá bán
    { wch: 14 }, // Giá vốn
    { wch: 12 }, // Tồn kho
    { wch: 10 }, // ĐVT
    { wch: 45 }, // Mô tả
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Danh_Muc_Vat_Tu');

  const instructions = [
    ['HƯỚNG DẪN ĐIỀN FILE EXCEL NHẬP DANH MỤC VẬT TƯ CHỐNG THẤM'],
    [''],
    ['1. CÁC CỘT BẮT BUỘC:'],
    ['  - "Tên hàng": Tên đầy đủ của vật tư (Bắt buộc)'],
    ['  - "Mã hàng": Mã định danh SKU duy nhất (ví dụ: SP2511175, vitecxp02 HS...). Nếu để trống hệ thống sẽ tự sinh mã.'],
    ['  - "ĐVT": Đơn vị tính (Bộ, kg, Thùng, Bao, Cuộn, Can, Tuýp, Mét...)'],
    ['  - "Giá bán": Giá niêm yết bán ra (nhập số, không kèm ký tự đ/VND)'],
    [''],
    ['2. CÁC CỘT TÙY CHỌN & MẶC ĐỊNH:'],
    ['  - "Loại hàng": Mặc định là "Hàng hóa" nếu để trống'],
    ['  - "Nhóm hàng": Phân loại (Hai thành phần gốc xi măng, Gốc PU, Màng chống thấm, Phụ gia...)'],
    ['  - "Thương hiệu": Tên hãng sản xuất (Chống Thấm 36, Quicseal, Sika, Mapei, Conmik...)'],
    ['  - "Giá vốn": Giá nhập hàng phục vụ quản lý chi phí & lợi nhuận'],
    ['  - "Tồn kho": Số lượng thực tế có trong kho hàng'],
    ['  - "Mô tả": Quy cách đóng gói, định mức thi công và ghi chú kỹ thuật'],
    [''],
    ['3. LƯU Ý KHI NHẬP VÀO HỆ THỐNG:'],
    ['  - Nếu chọn chế độ "Cập nhật & Bổ sung", các mặt hàng có "Mã hàng" trùng với hệ thống sẽ được cập nhật Giá và Tồn kho mới nhất.'],
  ];

  const guideWs = XLSX.utils.aoa_to_sheet(instructions);
  guideWs['!cols'] = [{ wch: 80 }];
  XLSX.utils.book_append_sheet(wb, guideWs, 'Huong_Dan_Nhap');

  XLSX.writeFile(wb, 'Mau_Nhap_Lieu_Vat_Tu_ChongTham36.xlsx');
}

export interface ParsedMaterialRow {
  tempId: string;
  itemType: string;
  category: string;
  code: string;
  name: string;
  brand: string;
  price: number;
  costPrice: number;
  stockQty: number;
  unit: string;
  description: string;
  minStock: number;
  status: 'new' | 'update' | 'error';
  errorMsg?: string;
  selected: boolean;
}

export interface ParsedExcelResult {
  fileName: string;
  totalRows: number;
  validRows: number;
  newCount: number;
  updateCount: number;
  errorCount: number;
  rows: ParsedMaterialRow[];
}

/**
 * Helper to clean numeric values from formatted Excel strings (e.g. "1,385,000", "1.385.000 đ")
 */
function cleanNumeric(val: any): number {
  if (typeof val === 'number') {
    return isNaN(val) ? 0 : val;
  }
  if (!val) return 0;
  const str = String(val).trim().replace(/[^\d.,-]/g, '');
  if (!str) return 0;

  // Handle European/Vietnamese 1.385.000 vs English 1,385,000
  if (str.includes('.') && !str.includes(',')) {
    const parts = str.split('.');
    if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) {
      return Number(str.replace(/\./g, '')) || 0;
    }
  }

  const normalized = str.replace(/,/g, '');
  const num = Number(normalized);
  return isNaN(num) ? 0 : num;
}

/**
 * Helper to normalize string lookup keys
 */
function normalizeKey(key: string): string {
  return key
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Advanced parser and validator for Excel files
 */
export async function parseAndValidateMaterialsExcel(
  file: File,
  existingMaterials: MaterialItem[]
): Promise<ParsedExcelResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const jsonRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        const existingCodesMap = new Map<string, MaterialItem>();
        const existingNamesMap = new Map<string, MaterialItem>();

        existingMaterials.forEach((m) => {
          if (m.code) existingCodesMap.set(m.code.trim().toLowerCase(), m);
          if (m.name) existingNamesMap.set(m.name.trim().toLowerCase(), m);
        });

        const seenCodesInFile = new Set<string>();
        const parsedRows: ParsedMaterialRow[] = [];

        let validCount = 0;
        let newCount = 0;
        let updateCount = 0;
        let errorCount = 0;

        jsonRows.forEach((row, idx) => {
          // Normalize row keys for flexible column matching
          const normalizedRow: Record<string, any> = {};
          Object.keys(row).forEach((k) => {
            normalizedRow[normalizeKey(k)] = row[k];
          });

          // Match columns
          const rawName = String(
            normalizedRow['tenhang'] ||
            normalizedRow['tenvattu'] ||
            normalizedRow['tensanpham'] ||
            normalizedRow['name'] ||
            normalizedRow['ten'] ||
            row['Tên hàng'] ||
            row['Ten hang'] ||
            ''
          ).trim();

          let rawCode = String(
            normalizedRow['mahang'] ||
            normalizedRow['mavattu'] ||
            normalizedRow['masanpham'] ||
            normalizedRow['code'] ||
            normalizedRow['sku'] ||
            row['Mã hàng'] ||
            row['Ma hang'] ||
            ''
          ).trim();

          const rawCat = String(
            normalizedRow['nhomhang'] ||
            normalizedRow['nhomvattu'] ||
            normalizedRow['category'] ||
            normalizedRow['phanloai'] ||
            row['Nhóm hàng'] ||
            'Hai thành phần gốc xi măng'
          ).trim();

          const rawItemType = String(
            normalizedRow['loaihang'] ||
            normalizedRow['itemtype'] ||
            normalizedRow['type'] ||
            row['Loại hàng'] ||
            'Hàng hóa'
          ).trim();

          const rawBrand = String(
            normalizedRow['thuonghieu'] ||
            normalizedRow['brand'] ||
            normalizedRow['hang'] ||
            row['Thương hiệu'] ||
            'Chống Thấm 36'
          ).trim();

          const rawPrice = cleanNumeric(
            normalizedRow['giaban'] ||
            normalizedRow['dongia'] ||
            normalizedRow['price'] ||
            normalizedRow['gia'] ||
            row['Giá bán']
          );

          const rawCost = cleanNumeric(
            normalizedRow['giavon'] ||
            normalizedRow['gianhap'] ||
            normalizedRow['costprice'] ||
            row['Giá vốn']
          );

          const rawStock = cleanNumeric(
            normalizedRow['tonkho'] ||
            normalizedRow['soluong'] ||
            normalizedRow['stockqty'] ||
            normalizedRow['ton'] ||
            row['Tồn kho']
          );

          const rawUnit = String(
            normalizedRow['dvt'] ||
            normalizedRow['donvitinh'] ||
            normalizedRow['unit'] ||
            row['ĐVT'] ||
            'Bộ'
          ).trim();

          const rawDesc = String(
            normalizedRow['mota'] ||
            normalizedRow['ghichu'] ||
            normalizedRow['description'] ||
            normalizedRow['quycach'] ||
            row['Mô tả'] ||
            ''
          ).trim();

          // Skip completely empty rows
          if (!rawName && !rawCode && rawPrice === 0 && rawStock === 0) {
            return;
          }

          // Validation
          let status: 'new' | 'update' | 'error' = 'new';
          let errorMsg = '';

          if (!rawName) {
            status = 'error';
            errorMsg = 'Thiếu tên hàng / vật tư';
            errorCount++;
          } else {
            if (!rawCode) {
              rawCode = `SP2511${String(100 + idx).slice(-3)}`;
            }

            const codeKey = rawCode.toLowerCase();
            const nameKey = rawName.toLowerCase();

            if (seenCodesInFile.has(codeKey)) {
              status = 'error';
              errorMsg = `Mã hàng "${rawCode}" bị trùng trong file Excel`;
              errorCount++;
            } else {
              seenCodesInFile.add(codeKey);

              const matchedByCode = existingCodesMap.get(codeKey);
              const matchedByName = existingNamesMap.get(nameKey);

              if (matchedByCode || matchedByName) {
                status = 'update';
                updateCount++;
                validCount++;
              } else {
                status = 'new';
                newCount++;
                validCount++;
              }
            }
          }

          parsedRows.push({
            tempId: `row_${idx}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            itemType: rawItemType || 'Hàng hóa',
            category: rawCat || 'Vật tư chống thấm',
            code: rawCode,
            name: rawName,
            brand: rawBrand || 'Chống Thấm 36',
            price: rawPrice,
            costPrice: rawCost,
            stockQty: rawStock,
            unit: rawUnit || 'Bộ',
            description: rawDesc,
            minStock: 5,
            status,
            errorMsg,
            selected: status !== 'error',
          });
        });

        resolve({
          fileName: file.name,
          totalRows: parsedRows.length,
          validRows: validCount,
          newCount,
          updateCount,
          errorCount,
          rows: parsedRows,
        });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Import materials from Excel/CSV file matching the 10-column database format (Quick helper)
 */
export async function importMaterialsFromExcelFile(file: File): Promise<MaterialItem[]> {
  const parsed = await parseAndValidateMaterialsExcel(file, []);
  return parsed.rows
    .filter((r) => r.status !== 'error')
    .map((r) => ({
      id: `mat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      itemType: r.itemType,
      category: r.category,
      code: r.code,
      name: r.name,
      brand: r.brand,
      price: r.price,
      defaultPrice: r.price,
      costPrice: r.costPrice,
      stockQty: r.stockQty,
      unit: r.unit,
      description: r.description,
      minStock: r.minStock,
      updatedAt: new Date().toISOString(),
    }));
}
