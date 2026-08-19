import {
  CompanySettings,
  ConstructionProject,
  ExportedGood,
  LaborDailyLog,
  MaterialItem,
  StaffMember,
  ActivityLog,
} from '../types';

export const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  orgId: 'chongtham36-main',
  orgName: 'CÔNG TY TNHH ĐẦU TƯ VÀ XÂY DỰNG CHỐNG THẤM 36',
  brandName: 'CHỐNG THẤM 36',
  tagline: 'Chuyên gia xử lý & thi công chống thấm công trình toàn quốc',
  phone: '0988 363 636',
  email: 'contact@chongtham36.vn',
  address: 'Số 36 Nguyễn Cơ Thạch, Phường Mỹ Đình 2, Quận Nam Từ Liêm, TP. Hà Nội',
  taxCode: '0109363636',
  customLogoUrl: null,
};

// Clean empty collections - no sample/demo data
export const INITIAL_MATERIALS: MaterialItem[] = [];
export const INITIAL_PROJECTS: ConstructionProject[] = [];
export const INITIAL_EXPORTED_GOODS: ExportedGood[] = [];
export const INITIAL_STAFF: StaffMember[] = [];
export const INITIAL_LABOR_LOGS: LaborDailyLog[] = [];
export const INITIAL_ACTIVITY_LOGS: ActivityLog[] = [];
