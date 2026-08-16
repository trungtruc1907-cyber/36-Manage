export interface UserAccount {
  username: string;
  role: 'admin' | 'supervisor' | 'storekeeper';
  orgId: string;
  orgName: string;
  name: string;
  phone?: string;
  email?: string;
}

export interface UserAccountRecord extends UserAccount {
  password?: string;
  createdAt?: string;
  lastLoginAt?: string;
}

export interface LoginHistoryRecord {
  id: string;
  username: string;
  name: string;
  role: string;
  orgId: string;
  timestamp: number;
  timeFormatted: string;
  status: 'success' | 'failed';
  userAgent?: string;
  device?: string;
  notes?: string;
}

export interface MaterialItem {
  id: string;
  itemType?: string;      // Loại hàng (Hàng hóa, Dịch vụ, ...)
  category: string;       // Nhóm hàng (Hai thành phần gốc xi măng, Gốc PU, ...)
  code: string;           // Mã hàng (SP2511175, SP2511158, vitecxp02 HS, ...)
  name: string;           // Tên hàng
  brand?: string;         // Thương hiệu (Chống Thấm 36, Sika, ...)
  price?: number;         // Giá bán
  defaultPrice: number;   // Giá bán (backward compatible)
  costPrice?: number;     // Giá vốn
  stockQty: number;       // Tồn kho
  unit: string;           // ĐVT (Bộ, kg, Thùng, Bao, Cuộn, Can, ...)
  description?: string;   // Mô tả
  minStock?: number;      // Định mức tồn kho tối thiểu
  location?: string;      // Vị trí lưu kho
  updatedAt?: string;
}

export interface ExportedGood {
  id: string;
  materialName: string;
  projectName: string;
  projectCode: string;
  quantity: number;
  unit: string;
  totalPrice: number;
  date: string;
  recipient: string;
}

export interface LaborDailyLog {
  date: string;
  dayOfWeek: string;
  mainWorkers: number;
  helperWorkers: number;
  totalWorkdays: number;
  totalCost: number;
  notes: string;
  projectName?: string;
}

export interface ConstructionProject {
  id: string;
  code: string;
  name: string;
  partner: string;
  address: string;
  startDate: string;
  status: 'active' | 'completed' | 'pending';
  totalExportsValue: number;
  workdaysLogged: number;
  completedValue?: number; // Tổng giá trị hoàn thành khi đã nghiệm thu
  notes?: string;
  endDate?: string;
  supervisor?: string;
  category?: string;
  phone?: string;
  budget?: number;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  phone: string;
  dailyWage?: number; // Lương ngày (VNĐ/ngày)
  status: string;
}

export interface CompanySettings {
  orgId: string;
  orgName: string;
  brandName: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  taxCode: string;
  customLogoUrl: string | null;
}
