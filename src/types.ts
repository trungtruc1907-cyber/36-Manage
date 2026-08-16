export interface TenantOrganization {
  id: string;
  code: string;
  name: string;
  brandName: string;
  tagline?: string;
  phone: string;
  email: string;
  address: string;
  taxCode: string;
  customLogoUrl?: string | null;
  status: 'active' | 'inactive' | 'archived';
  isDefault?: boolean;
  createdBy?: string;
  ownerUsername?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface UserAccount {
  username: string;
  role: 'admin' | 'supervisor' | 'storekeeper';
  orgId: string;
  orgName: string;
  name: string;
  phone?: string;
  email?: string;
  allowedTenants?: string[];
  isTenantOwner?: boolean;
  createdTenantId?: string;
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
  tenantId?: string;
  tenantName?: string;
  timestamp: number;
  timeFormatted: string;
  status: 'success' | 'failed';
  userAgent?: string;
  device?: string;
  notes?: string;
}

export interface MaterialItem {
  id: string;
  tenantId?: string;
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
  tenantId?: string;
  materialName: string;
  materialCode?: string;
  projectName: string;
  projectCode: string;
  quantity: number;
  unit: string;
  unitPrice?: number;
  totalPrice: number;
  date: string;
  recipient: string;
  exportedBy?: string;
  notes?: string;
}

export interface LaborWorkerDetail {
  name: string;
  role: string;
  dailyWage: number;
  workdays: number;
  cost: number;
}

export interface LaborDailyLog {
  id?: string;
  tenantId?: string;
  date: string;
  dayOfWeek: string;
  mainWorkers: number;
  helperWorkers: number;
  totalWorkdays: number;
  totalCost: number;
  notes: string;
  projectName?: string;
  projectCode?: string;
  session?: 'morning' | 'afternoon' | 'full';
  workerNames?: string[];
  workerDetails?: LaborWorkerDetail[];
}

export interface ConstructionProject {
  id: string;
  tenantId?: string;
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
  tenantId?: string;
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
  tenantId?: string;
}

export type ActivityCategory = 'all' | 'project' | 'export' | 'labor' | 'material' | 'staff' | 'auth' | 'settings' | 'tenant';

export interface ActivityLog {
  id: string;
  tenantId?: string;
  tenantName?: string;
  category: 'project' | 'export' | 'labor' | 'material' | 'staff' | 'auth' | 'settings' | 'tenant';
  action: string;
  title: string;
  description: string;
  userName: string;
  userRole?: string;
  timestamp: number;
  timeFormatted: string;
  status?: 'success' | 'warning' | 'info';
}
