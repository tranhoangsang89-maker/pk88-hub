import { supabase } from './supabase';
import { CustomerProfile, CustomerTier, CustomerCareReminder, CustomerCareLog, RepairTicket, POSOrder, CustomerLead, Branch } from '../types';
import { MOCK_REPAIR_TICKETS } from './mockData';

const CUSTOMER_CACHE_KEY = 'pk88_customer_profiles_cache';

/**
 * Chuẩn hóa số điện thoại: loại bỏ dấu cách, gạch nối, chấm, tiền tố +84 -> 0
 */
export function normalizePhone(rawPhone: string = ''): string {
  let p = rawPhone.replace(/[\s\.\-\(\)]+/g, '').trim();
  if (p.startsWith('+84')) {
    p = '0' + p.slice(3);
  } else if (p.startsWith('84') && p.length >= 11) {
    p = '0' + p.slice(2);
  }
  return p;
}

/**
 * Tính toán Hạng Hội Viên (Tier) theo tổng chi tiêu
 */
export function calculateCustomerTier(totalSpent: number): CustomerTier {
  if (totalSpent >= 5000000) return 'DIAMOND';
  if (totalSpent >= 2000000) return 'GOLD';
  if (totalSpent >= 500000) return 'SILVER';
  return 'NEW';
}

/**
 * Tự động phân tích và tạo lời nhắc Chăm Sóc Khách Hàng thông minh (AI Care Triggers)
 */
export function generateCustomerReminders(profile: {
  phone: string;
  fullName: string;
  deviceModel?: string;
  tier: CustomerTier;
  totalSpent: number;
  lastSeenAt: string;
  orders: any[];
  tickets: any[];
  birthday?: string;
}): CustomerCareReminder[] {
  const reminders: CustomerCareReminder[] = [];
  const now = new Date();
  const lastSeen = new Date(profile.lastSeenAt || now);
  const diffDays = Math.floor((now.getTime() - lastSeen.getTime()) / (1000 * 3600 * 24));

  // 1. Kiểm tra lịch sử thay pin (Chu kỳ 6 tháng = ~180 ngày)
  const batteryTicket = profile.tickets.find(t => {
    const s = (t.serviceType || '').toLowerCase();
    const d = (t.deviceModel || '').toLowerCase();
    return s.includes('pin') || d.includes('pin');
  });

  if (batteryTicket) {
    const ticketDate = new Date(batteryTicket.createdAt || batteryTicket.created_at || now);
    const batteryDays = Math.floor((now.getTime() - ticketDate.getTime()) / (1000 * 3600 * 24));
    if (batteryDays >= 90) {
      reminders.push({
        id: `battery-care-${profile.phone}`,
        type: 'BATTERY_HEALTH_CHECK',
        title: 'Bảo dưỡng pin & Vệ sinh máy định kỳ',
        message: `Khách đã thay pin được ${batteryDays} ngày. Mời khách ghé shop vệ sinh loa, chân sạc & đo độ chai pin miễn phí.`,
        suggestedAction: 'Nhắn Zalo tặng gói vệ sinh máy & kiểm tra pin miễn phí',
        dueDays: batteryDays,
        isUrgent: batteryDays >= 180
      });
    }
  }

  // 2. Kiểm tra lịch sử dán cường lực / ốp lưng (Chu kỳ 60 - 90 ngày)
  const screenProtectorOrder = profile.orders.find(o => {
    const items = o.items || [];
    return items.some((it: any) => {
      const name = (it.product?.name || '').toLowerCase();
      return name.includes('cường lực') || name.includes('kingkong') || name.includes('anank') || name.includes('kính');
    });
  });

  if (screenProtectorOrder || diffDays >= 60) {
    reminders.push({
      id: `screen-protector-${profile.phone}`,
      type: 'SCREEN_PROTECTOR_REPLACE',
      title: 'Nhắc dán lại cường lực chống trầy',
      message: `Khách đã dán cường lực được hơn ${Math.max(diffDays, 60)} ngày. Thường kính đã có vết xước hoặc mẻ mép viền.`,
      suggestedAction: 'Gửi voucher giảm 20% khi ghé dán lại kính cường lực mới',
      dueDays: Math.max(diffDays, 60),
      isUrgent: false
    });
  }

  // 3. Khách VIP sắp rời bỏ (Sau 60 ngày chưa quay lại)
  if ((profile.tier === 'GOLD' || profile.tier === 'DIAMOND') && diffDays >= 45) {
    reminders.push({
      id: `vip-winback-${profile.phone}`,
      type: 'VIP_WINBACK',
      title: 'Tri ân Khách Hàng VIP lâu ngày chưa ghé',
      message: `Khách VIP ${profile.fullName} (Đã chi tiêu ${(profile.totalSpent / 1000).toLocaleString('vi-VN')}k) đã ${diffDays} ngày chưa có đơn mới.`,
      suggestedAction: 'Gọi điện thoại hỏi thăm hoặc gửi E-Voucher tri ân VIP 15%',
      dueDays: diffDays,
      isUrgent: diffDays >= 90
    });
  }

  return reminders;
}

/**
 * Tải toàn bộ Hồ Sơ Khách Hàng từ Supabase Cloud kết hợp 3 nguồn: Leads, Tickets/POS và Profiles
 */
export async function fetchAllCustomerProfiles(branches: Branch[] = []): Promise<CustomerProfile[]> {
  try {
    // 1. Tải bảng customer_profiles từ Supabase
    const { data: dbProfiles } = await supabase
      .from('customer_profiles')
      .select('*');

    // 2. Tải bảng leads từ Supabase
    const { data: dbLeads } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    // 3. Tải bảng repair_tickets từ Supabase
    let dbTickets: any[] = [];
    try {
      const { data: ticketsData } = await supabase
        .from('repair_tickets')
        .select('*');
      if (ticketsData && ticketsData.length > 0) {
        dbTickets = ticketsData;
      } else {
        // Fallback mock repair tickets nếu DB rỗng
        dbTickets = MOCK_REPAIR_TICKETS;
      }
    } catch {
      dbTickets = MOCK_REPAIR_TICKETS;
    }

    // 4. Lấy đơn hàng POS từ LocalStorage
    let localPosOrders: POSOrder[] = [];
    try {
      const cachedOrders = localStorage.getItem('pk88_pos_orders');
      if (cachedOrders) {
        localPosOrders = JSON.parse(cachedOrders);
      }
    } catch (e) {
      console.warn('Lỗi đọc local pos orders:', e);
    }

    // 5. Tải nhật ký chăm sóc khách hàng
    let careLogsMap = new Map<string, CustomerCareLog[]>();
    try {
      const { data: careLogs } = await supabase
        .from('customer_care_logs')
        .select('*')
        .order('created_at', { ascending: false });
      if (careLogs) {
        careLogs.forEach((log: any) => {
          const norm = normalizePhone(log.phone);
          if (!careLogsMap.has(norm)) careLogsMap.set(norm, []);
          careLogsMap.get(norm)!.push(log);
        });
      }
    } catch {}

    // Bắt đầu Hợp Nhất (Merge) dữ liệu theo Số Điện Thoại
    const customerMap = new Map<string, CustomerProfile>();

    // A. Gom từ customer_profiles đã lưu trên Cloud
    if (dbProfiles) {
      dbProfiles.forEach((p: any) => {
        const norm = normalizePhone(p.phone);
        if (!norm) return;
        customerMap.set(norm, {
          id: p.id,
          phone: norm,
          fullName: p.full_name || 'Khách hàng',
          homeBranchId: p.home_branch_id,
          homeBranchName: p.home_branch_name,
          deviceModel: p.device_model || '',
          tier: (p.tier as CustomerTier) || 'NEW',
          totalSpent: Number(p.total_spent) || 0,
          orderCount: Number(p.order_count) || 0,
          ticketCount: 0,
          leadCount: 0,
          firstSeenAt: p.created_at || new Date().toISOString(),
          lastSeenAt: p.updated_at || p.created_at || new Date().toISOString(),
          notes: p.notes || '',
          birthday: p.birthday || '',
          orders: [],
          tickets: [],
          leads: [],
          careLogs: careLogsMap.get(norm) || [],
          reminders: []
        });
      });
    }

    // B. Gom từ Hóa Đơn POS
    localPosOrders.forEach((order) => {
      const norm = normalizePhone(order.customerPhone);
      if (!norm) return;

      const existing: CustomerProfile = customerMap.get(norm) || {
        phone: norm,
        fullName: order.customerName || 'Khách hàng POS',
        homeBranchId: order.branchId,
        homeBranchName: order.branchName,
        deviceModel: '',
        tier: 'NEW',
        totalSpent: 0,
        orderCount: 0,
        ticketCount: 0,
        leadCount: 0,
        firstSeenAt: order.createdAt,
        lastSeenAt: order.createdAt,
        orders: [],
        tickets: [],
        leads: [],
        careLogs: careLogsMap.get(norm) || [],
        reminders: []
      };

      existing.orders.push(order);
      existing.orderCount += 1;
      existing.totalSpent += Number(order.totalAmount) || 0;

      if (!existing.homeBranchName && order.branchName) {
        existing.homeBranchName = order.branchName;
        existing.homeBranchId = order.branchId;
      }
      if (order.customerName && existing.fullName === 'Khách hàng') {
        existing.fullName = order.customerName;
      }

      if (new Date(order.createdAt) > new Date(existing.lastSeenAt)) {
        existing.lastSeenAt = order.createdAt;
      }
      if (new Date(order.createdAt) < new Date(existing.firstSeenAt)) {
        existing.firstSeenAt = order.createdAt;
      }

      customerMap.set(norm, existing);
    });

    // C. Gom từ Phiếu Sửa Chữa (Tickets)
    dbTickets.forEach((ticket) => {
      const norm = normalizePhone(ticket.customerPhone || ticket.customer_phone);
      if (!norm) return;

      const branchObj = branches.find(b => b.id === (ticket.branchId || ticket.branch_id));
      const ticketTime = ticket.createdAt || ticket.created_at || new Date().toISOString();

      const existing: CustomerProfile = customerMap.get(norm) || {
        phone: norm,
        fullName: ticket.customerName || ticket.customer_name || 'Khách hàng Sửa Chữa',
        homeBranchId: ticket.branchId || ticket.branch_id,
        homeBranchName: branchObj?.name || 'Phụ Kiện 88',
        deviceModel: ticket.deviceModel || ticket.device_model || '',
        tier: 'NEW',
        totalSpent: 0,
        orderCount: 0,
        ticketCount: 0,
        leadCount: 0,
        firstSeenAt: ticketTime,
        lastSeenAt: ticketTime,
        orders: [],
        tickets: [],
        leads: [],
        careLogs: careLogsMap.get(norm) || [],
        reminders: []
      };

      existing.tickets.push(ticket);
      existing.ticketCount += 1;
      existing.totalSpent += Number(ticket.price) || 0;

      if (!existing.deviceModel && (ticket.deviceModel || ticket.device_model)) {
        existing.deviceModel = ticket.deviceModel || ticket.device_model;
      }
      if (!existing.homeBranchName && branchObj?.name) {
        existing.homeBranchName = branchObj.name;
        existing.homeBranchId = branchObj.id;
      }

      if (new Date(ticketTime) > new Date(existing.lastSeenAt)) {
        existing.lastSeenAt = ticketTime;
      }
      if (new Date(ticketTime) < new Date(existing.firstSeenAt)) {
        existing.firstSeenAt = ticketTime;
      }

      customerMap.set(norm, existing);
    });

    // D. Gom từ Leads Chatbot Bé 8
    if (dbLeads) {
      dbLeads.forEach((lead) => {
        const norm = normalizePhone(lead.phone);
        if (!norm) return;

        const leadTime = lead.created_at || new Date().toISOString();
        const existing: CustomerProfile = customerMap.get(norm) || {
          phone: norm,
          fullName: lead.customer_name || 'Khách hàng Chatbot',
          homeBranchName: lead.branch,
          deviceModel: '',
          tier: 'NEW',
          totalSpent: 0,
          orderCount: 0,
          ticketCount: 0,
          leadCount: 0,
          firstSeenAt: leadTime,
          lastSeenAt: leadTime,
          orders: [],
          tickets: [],
          leads: [],
          careLogs: careLogsMap.get(norm) || [],
          reminders: []
        };

        existing.leads.push(lead);
        existing.leadCount += 1;

        if (lead.customer_name && (!existing.fullName || existing.fullName.startsWith('Khách'))) {
          existing.fullName = lead.customer_name;
        }
        if (!existing.homeBranchName && lead.branch) {
          existing.homeBranchName = lead.branch;
        }

        if (new Date(leadTime) > new Date(existing.lastSeenAt)) {
          existing.lastSeenAt = leadTime;
        }

        customerMap.set(norm, existing);
      });
    }

    // E. Hoàn tất tính toán Tier & AI Care Reminders
    const result: CustomerProfile[] = [];
    customerMap.forEach((prof) => {
      prof.tier = calculateCustomerTier(prof.totalSpent);
      prof.reminders = generateCustomerReminders(prof);
      result.push(prof);
    });

    // Sắp xếp: Khách mới tương tác hoặc VIP lên đầu
    result.sort((a, b) => new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime());

    // Lưu vào LocalStorage làm cache
    try {
      localStorage.setItem(CUSTOMER_CACHE_KEY, JSON.stringify(result.slice(0, 100)));
    } catch {}

    return result;
  } catch (err) {
    console.warn('Lỗi fetchAllCustomerProfiles:', err);
    try {
      const cached = localStorage.getItem(CUSTOMER_CACHE_KEY);
      if (cached) return JSON.parse(cached);
    } catch {}
    return [];
  }
}

/**
 * Lưu ghi chú hoặc cập nhật hồ sơ khách hàng lên Supabase Cloud
 */
export async function saveCustomerProfileToCloud(profile: {
  phone: string;
  fullName: string;
  deviceModel?: string;
  notes?: string;
  homeBranchId?: string;
  homeBranchName?: string;
  birthday?: string;
}): Promise<boolean> {
  try {
    const normPhone = normalizePhone(profile.phone);
    if (!normPhone) return false;

    const payload: any = {
      phone: normPhone,
      full_name: profile.fullName,
      device_model: profile.deviceModel || '',
      notes: profile.notes || '',
      home_branch_id: profile.homeBranchId,
      home_branch_name: profile.homeBranchName,
      updated_at: new Date().toISOString()
    };
    if (profile.birthday) payload.birthday = profile.birthday;

    const { error } = await supabase
      .from('customer_profiles')
      .upsert(payload, { onConflict: 'phone' });

    if (error) {
      console.warn('Lỗi upsert customer_profiles trên Supabase:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.warn('Exception saveCustomerProfileToCloud:', err);
    return false;
  }
}

/**
 * Thêm một bản ghi nhật ký chăm sóc khách hàng (Call, Zalo, Voucher, Bảo hành)
 */
export async function addCustomerCareLogToCloud(params: {
  phone: string;
  actionType: string;
  content: string;
  staffName?: string;
}): Promise<boolean> {
  try {
    const normPhone = normalizePhone(params.phone);
    if (!normPhone) return false;

    const { error } = await supabase
      .from('customer_care_logs')
      .insert([{
        phone: normPhone,
        action_type: params.actionType,
        content: params.content,
        staff_name: params.staffName || 'Nhân sự PK88',
        created_at: new Date().toISOString()
      }]);

    if (error) {
      console.warn('Lỗi ghi nhật ký CSKH lên Supabase:', error.message);
      return false;
    }

    return true;
  } catch (err) {
    console.warn('Exception addCustomerCareLogToCloud:', err);
    return false;
  }
}
