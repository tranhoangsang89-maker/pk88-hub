import { supabase } from './supabase';
import { CustomerLead, CustomerLeadStatus } from '../types';

const LEADS_STORAGE_KEY = 'pk88_customer_leads';

/**
 * Tạo mã Voucher ngẫu nhiên chuẩn chuỗi PK88 (VD: PK88-VIP10 hoặc PK88-X9K2)
 */
export function generateVoucherCode(phone?: string): string {
  if (phone && phone.length >= 4) {
    const last4 = phone.slice(-4);
    return `PK88-VIP${last4}`;
  }
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `PK88-SALE${rand}`;
}

/**
 * Lưu khách hàng tiềm năng lên Supabase Cloud & LocalStorage
 */
export async function submitCustomerLead(params: {
  customerName: string;
  phone: string;
  need?: string;
  branchName?: string;
  branchId?: string;
  voucherCode?: string;
  conversationSummary?: string;
  productInterest?: string;
  source?: string;
  chatMessages?: Array<{ sender: 'be8' | 'user' | string; text: string; time: string }>;
}): Promise<{ success: boolean; lead?: CustomerLead; error?: string }> {
  try {
    const leadId = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : `lead-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // Định dạng lịch sử hội thoại thành văn bản đọc nhanh
    const formattedSummary = params.chatMessages && params.chatMessages.length > 0
      ? params.chatMessages.map(m => `[${m.time}] ${m.sender === 'user' ? 'Khách' : 'Bé 8'}: ${m.text}`).join('\n')
      : (params.conversationSummary || '');

    const newLead: Partial<CustomerLead> = {
      lead_id: leadId,
      customer_name: params.customerName.trim(),
      phone: params.phone.trim(),
      need: params.need?.trim() || 'Tư vấn phụ kiện / dịch vụ',
      branch: params.branchName || 'Phụ Kiện 88 - Phú Khương',
      branch_id: params.branchId,
      product_interest: params.productInterest || params.need,
      voucher_code: params.voucherCode || generateVoucherCode(params.phone),
      conversation_summary: formattedSummary,
      activity_log: params.chatMessages || [],
      source: params.source || 'web_chatbot',
      status: 'NEW',
      priority: 'HIGH',
      label: 'HOT LEAD',
      score: 100,
      created_at: new Date().toISOString()
    };

    // 1. Lưu dự phòng LocalStorage ngay lập tức
    try {
      const local = JSON.parse(localStorage.getItem(LEADS_STORAGE_KEY) || '[]');
      local.unshift({ ...newLead, id: Date.now() });
      localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(local.slice(0, 50)));
    } catch (e) {
      console.warn('Lỗi lưu cache lead:', e);
    }

    // 2. Gửi lên Supabase Cloud
    const { data, error } = await supabase
      .from('leads')
      .insert([newLead])
      .select()
      .single();

    if (error) {
      console.warn('Cảnh báo lưu Supabase Cloud leads:', error.message);
      // Dù Supabase có lỗi mạng, dữ liệu vẫn được bảo toàn trong LocalStorage
      return { success: true, lead: newLead as CustomerLead };
    }

    return { success: true, lead: data as CustomerLead };
  } catch (err: any) {
    console.error('Lỗi ngoại lệ submitCustomerLead:', err);
    return { success: false, error: err?.message || 'Lỗi kết nối' };
  }
}

/**
 * Tải danh sách khách hàng tiềm năng từ Supabase Cloud
 */
export async function fetchCustomerLeads(branchFilter?: string): Promise<CustomerLead[]> {
  try {
    let query = supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (branchFilter && branchFilter !== 'ALL') {
      query = query.ilike('branch', `%${branchFilter}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.warn('Lỗi đọc leads từ Supabase:', error.message);
      // Fallback về LocalStorage
      const local = JSON.parse(localStorage.getItem(LEADS_STORAGE_KEY) || '[]');
      return local;
    }

    if (data && Array.isArray(data)) {
      // Cập nhật lại cache LocalStorage
      localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(data.slice(0, 50)));
      return data as CustomerLead[];
    }
  } catch (err) {
    console.warn('Exception fetchCustomerLeads:', err);
  }

  // Fallback LocalStorage
  try {
    return JSON.parse(localStorage.getItem(LEADS_STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

/**
 * Cập nhật trạng thái khách hàng (Mới -> Đã gọi -> Đã hẹn shop -> Thành công -> Hủy)
 */
export async function updateCustomerLeadStatus(
  leadId: string | number,
  status: CustomerLeadStatus | string,
  notes?: string,
  assignedTo?: string
): Promise<boolean> {
  try {
    const updatePayload: Record<string, any> = {
      status,
      last_action_at: new Date().toISOString()
    };

    if (notes !== undefined) updatePayload.notes = notes;
    if (assignedTo !== undefined) updatePayload.assigned_to = assignedTo;

    // Cập nhật Cloud
    const { error } = await supabase
      .from('leads')
      .update(updatePayload)
      .eq('id', leadId);

    if (error) {
      console.warn('Lỗi cập nhật trạng thái lead trên Cloud:', error.message);
    }

    // Cập nhật LocalStorage
    try {
      const local: CustomerLead[] = JSON.parse(localStorage.getItem(LEADS_STORAGE_KEY) || '[]');
      const updated = local.map(item => {
        if (item.id === leadId || String(item.id) === String(leadId)) {
          return { ...item, ...updatePayload };
        }
        return item;
      });
      localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {}

    return true;
  } catch (err) {
    console.warn('Exception updateCustomerLeadStatus:', err);
    return false;
  }
}

/**
 * Xóa khách hàng tiềm năng khỏi hệ thống
 */
export async function deleteCustomerLead(leadId: string | number): Promise<boolean> {
  try {
    await supabase.from('leads').delete().eq('id', leadId);

    try {
      const local: CustomerLead[] = JSON.parse(localStorage.getItem(LEADS_STORAGE_KEY) || '[]');
      const filtered = local.filter(item => item.id !== leadId && String(item.id) !== String(leadId));
      localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(filtered));
    } catch (e) {}

    return true;
  } catch (err) {
    console.warn('Exception deleteCustomerLead:', err);
    return false;
  }
}
