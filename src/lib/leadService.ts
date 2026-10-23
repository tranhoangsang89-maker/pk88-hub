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
 * Lưu hoặc Cập nhật Khách Hàng Tiềm Năng theo phiên chat (Upsert by sessionId / lead_id)
 * Hỗ trợ lưu realtime từ tin nhắn đầu tiên khi khách chưa để lại SĐT (status: 'CHATTING', phone: '')
 * Tự động nâng cấp thành 'NEW' (HOT LEAD) khi khách cung cấp SĐT mà không làm mất lịch sử chat hay trùng lặp.
 */
export async function submitOrUpdateCustomerLead(params: {
  sessionId: string;
  chatMessages?: Array<{ sender: 'be8' | 'user' | string; text: string; time: string; imageUrl?: string }>;
  phone?: string;
  customerName?: string;
  need?: string;
  branchName?: string;
  branchId?: string;
  voucherCode?: string;
  conversationSummary?: string;
  productInterest?: string;
  source?: string;
  status?: CustomerLeadStatus | string;
}): Promise<{ success: boolean; lead?: CustomerLead; error?: string }> {
  try {
    const sessionId = params.sessionId || `lead-${Date.now()}`;
    const cleanPhone = (params.phone || '').trim();
    const hasPhone = cleanPhone.replace(/\D/g, '').length >= 8;

    // Định dạng lịch sử hội thoại thành văn bản đọc nhanh
    const formattedSummary = params.chatMessages && params.chatMessages.length > 0
      ? params.chatMessages.map(m => `[${m.time}] ${m.sender === 'user' ? 'Khách' : 'Bé 8'}: ${m.text}`).join('\n')
      : (params.conversationSummary || '');

    // 1. Kiểm tra xem session này đã có trong Supabase Cloud chưa
    let existingLead: any = null;
    try {
      const { data } = await supabase
        .from('leads')
        .select('*')
        .eq('lead_id', sessionId)
        .limit(1);
      if (data && data.length > 0) {
        existingLead = data[0];
      }
    } catch (e) {
      console.warn('Lỗi kiểm tra existing lead:', e);
    }

    // 2. Nếu đã có lead_id này -> Thực hiện UPDATE
    if (existingLead) {
      const updatePayload: Record<string, any> = {
        last_action_at: new Date().toISOString()
      };

      if (params.customerName && params.customerName.trim() && params.customerName !== 'Khách đang chat') {
        updatePayload.customer_name = params.customerName.trim();
      }
      if (params.need && params.need.trim()) {
        updatePayload.need = params.need.trim();
      }
      if (params.branchName) {
        updatePayload.branch = params.branchName;
      }
      if (params.branchId) {
        updatePayload.branch_id = params.branchId;
      }
      if (params.productInterest) {
        updatePayload.product_interest = params.productInterest;
      }
      if (params.source) {
        updatePayload.source = params.source;
      }
      if (formattedSummary) {
        updatePayload.conversation_summary = formattedSummary;
      }
      if (params.chatMessages && params.chatMessages.length > 0) {
        updatePayload.activity_log = params.chatMessages;
      }

      // Nếu khách vừa cung cấp SĐT -> NÂNG CẤP LÊN HOT LEAD
      if (hasPhone) {
        updatePayload.phone = cleanPhone;
        updatePayload.status = 'NEW';
        updatePayload.priority = 'HIGH';
        updatePayload.label = 'HOT LEAD';
        updatePayload.score = 100;
        if (params.voucherCode || !existingLead.voucher_code) {
          updatePayload.voucher_code = params.voucherCode || generateVoucherCode(cleanPhone);
        }
      } else if (params.status) {
        updatePayload.status = params.status;
      }

      // Cập nhật Cloud
      const { data: updatedCloud, error: updateError } = await supabase
        .from('leads')
        .update(updatePayload)
        .eq('id', existingLead.id)
        .select()
        .single();

      if (updateError) {
        console.warn('Cảnh báo cập nhật lead Supabase:', updateError.message);
      }

      const mergedLead = { ...existingLead, ...updatePayload, ...(updatedCloud || {}) };

      // Cập nhật LocalStorage
      try {
        const local: any[] = JSON.parse(localStorage.getItem(LEADS_STORAGE_KEY) || '[]');
        const updatedLocal = local.map(l => (l.lead_id === sessionId || l.id === existingLead.id) ? { ...l, ...updatePayload } : l);
        localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(updatedLocal.slice(0, 50)));
      } catch (e) {}

      return { success: true, lead: mergedLead as CustomerLead };
    }

    // 3. Nếu chưa có -> Tạo MỚI (INSERT)
    const newLead: Partial<CustomerLead> = {
      lead_id: sessionId,
      customer_name: params.customerName?.trim() || (hasPhone ? 'Khách hàng Web Chat' : 'Khách đang chat'),
      phone: hasPhone ? cleanPhone : '',
      need: params.need?.trim() || 'Tư vấn phụ kiện / dịch vụ',
      branch: params.branchName || 'Phụ Kiện 88 - Phú Khương',
      branch_id: params.branchId,
      product_interest: params.productInterest || params.need,
      voucher_code: params.voucherCode || (hasPhone ? generateVoucherCode(cleanPhone) : ''),
      conversation_summary: formattedSummary,
      activity_log: params.chatMessages || [],
      source: params.source || 'web_chatbot',
      status: hasPhone ? 'NEW' : (params.status || 'CHATTING'),
      priority: hasPhone ? 'HIGH' : 'MEDIUM',
      label: hasPhone ? 'HOT LEAD' : 'ĐANG TƯ VẤN',
      score: hasPhone ? 100 : 50,
      created_at: new Date().toISOString()
    };

    // Lưu LocalStorage
    try {
      const local = JSON.parse(localStorage.getItem(LEADS_STORAGE_KEY) || '[]');
      local.unshift({ ...newLead, id: Date.now() });
      localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(local.slice(0, 50)));
    } catch (e) {
      console.warn('Lỗi lưu cache lead:', e);
    }

    // Gửi lên Supabase Cloud
    const { data, error } = await supabase
      .from('leads')
      .insert([newLead])
      .select()
      .single();

    if (error) {
      console.warn('Cảnh báo lưu Supabase Cloud leads:', error.message);
      return { success: true, lead: newLead as CustomerLead };
    }

    return { success: true, lead: data as CustomerLead };
  } catch (err: any) {
    console.error('Lỗi ngoại lệ submitOrUpdateCustomerLead:', err);
    return { success: false, error: err?.message || 'Lỗi kết nối' };
  }
}

/**
 * Lưu khách hàng tiềm năng lên Supabase Cloud & LocalStorage (Tương thích ngược)
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
  chatMessages?: Array<{ sender: 'be8' | 'user' | string; text: string; time: string; imageUrl?: string }>;
  sessionId?: string;
}): Promise<{ success: boolean; lead?: CustomerLead; error?: string }> {
  const sessionId = params.sessionId || (typeof crypto !== 'undefined' && crypto.randomUUID 
    ? crypto.randomUUID() 
    : `lead-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`);

  return submitOrUpdateCustomerLead({
    ...params,
    sessionId
  });
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
