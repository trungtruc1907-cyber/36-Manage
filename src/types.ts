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
  name: string;
  category: string;
  unit: string;
  defaultPrice: number;
  stockQty: number;
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
  endDate?: string;
  status: 'active' | 'completed' | 'pending';
  totalExportsValue: number;
  workdaysLogged: number;
  supervisor?: string;
  category?: string;
  phone?: string;
  budget?: number;
  notes?: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  phone: string;
  exp: string;
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
