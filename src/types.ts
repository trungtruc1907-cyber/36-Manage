export interface UserAccount {
  username: string;
  role: 'admin' | 'supervisor' | 'storekeeper';
  orgId: string;
  orgName: string;
  name: string;
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
