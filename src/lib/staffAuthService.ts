import { supabase } from './supabase';
import { Staff } from '../types';

export const STAFF_METADATA_RECORD_ID = '00000000-0000-0000-0000-000000000005';
export const PASSWORDS_STORAGE_KEY = 'pk88_passwords';
export const STAFF_OVERRIDES_STORAGE_KEY = 'pk88_staff_overrides';

export interface StaffAuthMetadata {
  passwords: Record<string, string>; // { [phone]: password }
  profiles: Record<string, any>;
  updatedAt?: string;
  updatedBy?: string;
}

// 1. Lấy mật khẩu từ bộ nhớ đệm (hoặc mặc định)
export function getStaffPasswordSync(phone: string): string {
  try {
    const raw = localStorage.getItem(PASSWORDS_STORAGE_KEY);
    if (raw) {
      const map = JSON.parse(raw);
      if (map && map[phone.trim()]) {
        return map[phone.trim()];
      }
    }
  } catch (e) {
    console.warn('Lỗi đọc cache mật khẩu:', e);
  }

  // Mật khẩu mặc định hệ thống
  const p = phone.trim();
  if (p === '0777888688') return '888888'; // Founder
  if (p === '0888003205' || p === '0888803285') return 'admin88'; // Admin
  if (p === '0394336726') return 'hr88'; // HR
  return '123456'; // Nhân viên chuỗi
}

// 2. Lấy thông tin mở rộng (birthDate, joinDate, email) đã cache
export function getStaffOverridesSync(): Record<string, any> {
  try {
    const raw = localStorage.getItem(STAFF_OVERRIDES_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) || {};
    }
  } catch (e) {
    console.warn('Lỗi đọc cache staff overrides:', e);
  }
  return {};
}

// 3. Tải toàn bộ metadata Mật khẩu & Hồ sơ từ Supabase Cloud
export async function fetchStaffAuthMetadataFromCloud(): Promise<StaffAuthMetadata> {
  try {
    const { data, error } = await supabase
      .from('job_applications')
      .select('notes')
      .eq('id', STAFF_METADATA_RECORD_ID)
      .maybeSingle();

    if (error) {
      console.warn('Chưa đọc được staff auth metadata từ Supabase:', error.message);
      return {
        passwords: JSON.parse(localStorage.getItem(PASSWORDS_STORAGE_KEY) || '{}'),
        profiles: JSON.parse(localStorage.getItem(STAFF_OVERRIDES_STORAGE_KEY) || '{}')
      };
    }

    if (data && data.notes) {
      const parsed: StaffAuthMetadata = JSON.parse(data.notes);
      
      // Đồng bộ vào LocalStorage để truy xuất tức thời không trễ
      if (parsed.passwords) {
        const localPasswords = JSON.parse(localStorage.getItem(PASSWORDS_STORAGE_KEY) || '{}');
        const mergedPasswords = { ...localPasswords, ...parsed.passwords };
        localStorage.setItem(PASSWORDS_STORAGE_KEY, JSON.stringify(mergedPasswords));
      }

      if (parsed.profiles) {
        const localOverrides = JSON.parse(localStorage.getItem(STAFF_OVERRIDES_STORAGE_KEY) || '{}');
        const mergedProfiles = { ...localOverrides, ...parsed.profiles };
        localStorage.setItem(STAFF_OVERRIDES_STORAGE_KEY, JSON.stringify(mergedProfiles));
      }

      return parsed;
    }
  } catch (err) {
    console.warn('Fetch staff auth metadata exception:', err);
  }

  return {
    passwords: JSON.parse(localStorage.getItem(PASSWORDS_STORAGE_KEY) || '{}'),
    profiles: JSON.parse(localStorage.getItem(STAFF_OVERRIDES_STORAGE_KEY) || '{}')
  };
}

// 4. Lưu Mật Khẩu mới lên Supabase Cloud + LocalStorage
export async function saveStaffPasswordToCloud(phone: string, newPassword: string): Promise<boolean> {
  const p = phone.trim();
  const pwd = newPassword.trim();

  // Lưu trước vào LocalStorage
  const localPasswords = JSON.parse(localStorage.getItem(PASSWORDS_STORAGE_KEY) || '{}');
  localPasswords[p] = pwd;
  localStorage.setItem(PASSWORDS_STORAGE_KEY, JSON.stringify(localPasswords));

  // Đồng bộ lên Supabase Cloud
  try {
    const meta = await fetchStaffAuthMetadataFromCloud();
    meta.passwords = { ...meta.passwords, [p]: pwd };
    meta.updatedAt = new Date().toISOString();
    meta.updatedBy = p;

    const { error } = await supabase
      .from('job_applications')
      .upsert({
        id: STAFF_METADATA_RECORD_ID,
        branch_id: '11111111-2222-3333-4444-555555555555',
        full_name: 'SYSTEM_STAFF_AUTH_METADATA',
        phone: '0000000000',
        role_applied: 'system_metadata',
        status: 'pending',
        notes: JSON.stringify(meta)
      });

    if (error) {
      console.error('Lỗi lưu mật khẩu lên Supabase:', error);
      return false;
    }
    console.log('✅ Đã lưu mật khẩu thành công lên Supabase Cloud cho SĐT:', p);
    return true;
  } catch (e) {
    console.error('Ngoại lệ khi lưu mật khẩu lên Cloud:', e);
    return false;
  }
}

// 5. Lưu thông tin mở rộng (ngày sinh, ngày vào làm, email) lên Supabase Cloud + LocalStorage
export async function saveStaffProfileToCloud(phone: string, profileData: {
  birthDate?: string;
  joinDate?: string;
  email?: string;
  fullName?: string;
  branchId?: string;
  role?: string;
  id?: string;
}): Promise<boolean> {
  const p = phone.trim();

  // Lưu trước vào LocalStorage
  const localOverrides = JSON.parse(localStorage.getItem(STAFF_OVERRIDES_STORAGE_KEY) || '{}');
  localOverrides[p] = { ...(localOverrides[p] || {}), ...profileData };
  if (profileData.id) {
    localOverrides[profileData.id] = { ...(localOverrides[profileData.id] || {}), ...profileData };
  }
  localStorage.setItem(STAFF_OVERRIDES_STORAGE_KEY, JSON.stringify(localOverrides));

  // Đồng bộ lên Supabase Cloud
  try {
    const meta = await fetchStaffAuthMetadataFromCloud();
    meta.profiles = meta.profiles || {};
    meta.profiles[p] = { ...(meta.profiles[p] || {}), ...profileData };
    meta.updatedAt = new Date().toISOString();
    meta.updatedBy = p;

    const { error } = await supabase
      .from('job_applications')
      .upsert({
        id: STAFF_METADATA_RECORD_ID,
        branch_id: '11111111-2222-3333-4444-555555555555',
        full_name: 'SYSTEM_STAFF_AUTH_METADATA',
        phone: '0000000000',
        role_applied: 'system_metadata',
        status: 'pending',
        notes: JSON.stringify(meta)
      });

    if (error) {
      console.error('Lỗi lưu profile metadata lên Supabase:', error);
      return false;
    }
    console.log('✅ Đã lưu profile metadata thành công lên Supabase Cloud cho SĐT:', p);
    return true;
  } catch (e) {
    console.error('Ngoại lệ khi lưu profile metadata lên Cloud:', e);
    return false;
  }
}
