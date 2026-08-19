import {
  CompanySettings,
  ConstructionProject,
  ExportedGood,
  LaborDailyLog,
  MaterialItem,
  StaffMember,
} from '../types';

export const INITIAL_PROJECTS: ConstructionProject[] = [];

export const INITIAL_MATERIALS: MaterialItem[] = [];

export const INITIAL_EXPORTED_GOODS: ExportedGood[] = [];

export const INITIAL_LABOR_LOGS: LaborDailyLog[] = [];

export const INITIAL_STAFF: StaffMember[] = [];

export const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  orgId: 'CT36',
  orgName: 'Công Ty Trường Sơn - Waterproofing 36',
  brandName: 'Trường Sơn Co.',
  tagline: 'Hệ thống Quản lý Thi công & Vật tư Chống thấm Chuyên nghiệp',
  phone: '0915 586 234',
  email: 'contact@chongtham36.vn',
  address: 'Số 36 Đại Lộ Lê Lợi, TP. Thanh Hóa',
  taxCode: '2801987654',
  customLogoUrl: null,
  tenantId: 'tenant_ct36',
};

export const INITIAL_TENANTS: import('../types').TenantOrganization[] = [
  {
    id: 'tenant_ct36',
    code: 'CT36',
    name: 'Công Ty Trường Sơn - Waterproofing 36',
    brandName: 'Trường Sơn Co.',
    tagline: 'Hệ thống Quản lý Thi công & Vật tư Chống thấm Chuyên nghiệp',
    phone: '0915 586 234',
    email: 'contact@chongtham36.vn',
    address: 'Số 36 Đại Lộ Lê Lợi, TP. Thanh Hóa',
    taxCode: '2801987654',
    customLogoUrl: null,
    status: 'active',
    isDefault: true,
    createdAt: '01/01/2026',
  },
];
