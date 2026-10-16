import React, { useState, useEffect, useRef } from 'react';
import { Branch, AttendanceRecord, Staff, ShiftType } from '../types';
import { getDistanceMeters, formatDistance } from '../lib/geoUtils';
import { supabase } from '../lib/supabase';
import L from 'leaflet';
import { 
  MapPin, 
  Navigation, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ShieldCheck, 
  Building2, 
  Sun, 
  Moon, 
  Zap, 
  Sparkles,
  Play,
  StopCircle,
  AlertTriangle,
  Sliders,
  ShieldAlert,
  FileText,
  Camera,
  Calendar
} from 'lucide-react';
import { AttendanceDisputeModal } from './AttendanceDisputeModal';
import { getAllAssignments } from '../lib/shiftService';

interface AttendanceCardProps {
  currentBranch: Branch;
  currentStaff: Staff;
  onCheckInSuccess: (record: AttendanceRecord) => void;
  attendanceHistory: AttendanceRecord[];
  onDisputeSubmit?: (record: AttendanceRecord) => Promise<void> | void;
  onOpenMyShiftsModal?: () => void;
  onOpenLeaveModal?: () => void;
}

export const AttendanceCard: React.FC<AttendanceCardProps> = ({
  currentBranch,
  currentStaff,
  onCheckInSuccess,
  attendanceHistory,
  onDisputeSubmit,
  onOpenMyShiftsModal,
  onOpenLeaveModal,
}) => {
  const isOffice = 
    currentBranch.code === 'PK88_VANPHONG' || 
    currentBranch.name?.toLowerCase().includes('văn phòng') ||
    ['founder', 'admin', 'hr', 'accountant', 'warehouse_accountant', 'marketing', 'media', 'sales_head'].includes(currentStaff.role) ||
    currentStaff.branchId === '11111111-2222-3333-4444-555555555555';

  const defaultShift: ShiftType = isOffice ? 'HANH_CHINH' : 'CA_SANG';
  const [selectedShift, setSelectedShift] = useState<ShiftType>(defaultShift);
  const [isOverrideShift, setIsOverrideShift] = useState<boolean>(false);

  // Custom Shift Time states (Bắt buộc giờ bắt đầu & kết thúc)
  const [customStartTime, setCustomStartTime] = useState<string>('');
  const [customEndTime, setCustomEndTime] = useState<string>('');

  // Attendance Dispute Modal States
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState<boolean>(false);
  const [disputeInitialType, setDisputeInitialType] = useState<any>('OUTSIDE_GEOFENCE');
  const [disputeExistingRecord, setDisputeExistingRecord] = useState<AttendanceRecord | null>(null);

  const todayYmd = React.useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Tìm kiếm ca làm việc đã được xếp trước trên Ma Trận Chia Ca cho hôm nay
  const rawTodayAssignment = React.useMemo(() => {
    try {
      const all = getAllAssignments();
      return all.find(a => {
        const matchId = a.staffId === currentStaff.id;
        const matchPhone = !!a.staffPhone && !!currentStaff.phone && a.staffPhone.trim() === currentStaff.phone.trim();
        const matchName = !!a.staffName && !!currentStaff.fullName && a.staffName.trim().toLowerCase() === currentStaff.fullName.trim().toLowerCase();
        return (matchId || matchPhone || matchName) && a.date === todayYmd;
      });
    } catch (e) {
      return null;
    }
  }, [currentStaff.id, currentStaff.phone, currentStaff.fullName, todayYmd]);

  const isTodayOff = rawTodayAssignment?.status === 'OFF';
  const todayAssignment = rawTodayAssignment && rawTodayAssignment.status !== 'OFF' ? rawTodayAssignment : null;

  useEffect(() => {
    if (todayAssignment) {
      if (todayAssignment.shiftCode === 'CA_SANG') setSelectedShift('CA_SANG');
      else if (todayAssignment.shiftCode === 'CA_CHIEU') setSelectedShift('CA_CHIEU');
      else if (todayAssignment.shiftCode === 'HANH_CHINH') setSelectedShift('HANH_CHINH');
      else if (todayAssignment.shiftCode === 'TANG_CUONG') setSelectedShift('TANG_CUONG');
      else {
        setSelectedShift('TUY_CHINH');
      }
      setCustomStartTime(todayAssignment.startTime);
      setCustomEndTime(todayAssignment.endTime);
    } else {
      setSelectedShift(isOffice ? 'HANH_CHINH' : 'CA_SANG');
    }
  }, [isOffice, currentStaff.id, currentBranch.id, todayAssignment]);

  const getShiftDisplayName = (shift: ShiftType) => {
    switch (shift) {
      case 'HANH_CHINH':
        return 'Ca Văn Phòng (07:30 - 17:30)';
      case 'CA_SANG':
        return 'Ca Sáng (07:00 - 15:30)';
      case 'CA_CHIEU':
        return 'Ca Chiều (13:30 - 22:00)';
      case 'TANG_CUONG':
        return 'Ca Tăng Cường (Linh hoạt)';
      case 'TUY_CHINH':
        return `Ca Tùy Chỉnh (${customStartTime || '--:--'} - ${customEndTime || '--:--'})`;
      default:
        return shift;
    }
  };

  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loadingLoc, setLoadingLoc] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const [simulatedOffsetMeters, setSimulatedOffsetMeters] = useState<number>(15);
  const [showSuccessMsg, setShowSuccessMsg] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const isDevelopment = import.meta.env.DEV;
  const canViewAllAttendance = currentStaff.role === 'admin' || currentStaff.role === 'founder';
  const visibleAttendanceHistory = canViewAllAttendance
    ? attendanceHistory
    : attendanceHistory.filter(record =>
        record.staffId === currentStaff.id || record.notes?.includes(`(${currentStaff.phone})`)
      );

  const todayDateStr = new Date().toDateString();
  const todayRecords = attendanceHistory.filter(r => 
    (r.staffId === currentStaff.id || (r.notes && r.notes.includes(currentStaff.phone))) && 
    new Date(r.checkIn).toDateString() === todayDateStr
  );
  const activeRecord = todayRecords.find(r => !r.checkOut);
  const isCurrentlyCheckedIn = !!activeRecord;

  // Geofence Radius: 100 meters standard (cập nhật từ 200m xuống 100m)
  const ALLOWED_RADIUS = 100;
  const hasRealGps = userCoords !== null;
  const currentLat = userCoords ? userCoords.lat : currentBranch.lat + (simulatedOffsetMeters / 111000);
  const currentLng = userCoords ? userCoords.lng : currentBranch.lng;
  const distance = getDistanceMeters(currentLat, currentLng, currentBranch.lat, currentBranch.lng);
  const isValidGeofence = distance <= ALLOWED_RADIUS;
  const isOutsideGeofence = !isValidGeofence;
  const canCheckIn = isValidGeofence;

  // Realtime Work Clock Timer (Live Work Timer)
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  useEffect(() => {
    if (!activeRecord) {
      setElapsedSeconds(0);
      return;
    }

    const calcElapsed = () => {
      const startTime = new Date(activeRecord.checkIn).getTime();
      const now = Date.now();
      const diffSec = Math.max(0, Math.floor((now - startTime) / 1000));
      setElapsedSeconds(diffSec);
    };

    calcElapsed();
    const timerInterval = setInterval(calcElapsed, 1000);
    return () => clearInterval(timerInterval);
  }, [activeRecord]);

  const formatTimerString = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Leaflet Map Refs
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const circleLayerRef = useRef<L.Circle | null>(null);
  const shopMarkerRef = useRef<L.Marker | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  // Initialize and update Leaflet Interactive Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [currentBranch.lat, currentBranch.lng],
        zoom: 16,
        zoomControl: false,
        attributionControl: false
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // 1. Geofence Circle (Emerald)
    if (circleLayerRef.current) {
      circleLayerRef.current.setLatLng([currentBranch.lat, currentBranch.lng]);
      circleLayerRef.current.setRadius(ALLOWED_RADIUS);
    } else {
      circleLayerRef.current = L.circle([currentBranch.lat, currentBranch.lng], {
        radius: ALLOWED_RADIUS,
        color: '#10b981',
        fillColor: '#10b981',
        fillOpacity: 0.18,
        weight: 2,
        dashArray: '5, 5'
      }).addTo(map);
    }

    // 2. Shop Marker
    const shopHtml = `
      <div style="transform: translate(-50%, -100%);">
        <div style="background: #090d16; border: 2px solid #06b6d4; border-radius: 10px; padding: 4px 8px; box-shadow: 0 4px 14px rgba(6, 182, 212, 0.4); display: flex; align-items: center; gap: 4px;">
          <span style="font-size: 14px;">🏪</span>
          <span style="color: #38bdf8; font-size: 11px; font-weight: 800; white-space: nowrap;">${currentBranch.name.replace('Phụ Kiện 88 - ', '')}</span>
        </div>
        <div style="width: 2px; height: 6px; background: #06b6d4; margin: 0 auto;"></div>
      </div>
    `;
    const shopIcon = L.divIcon({
      className: 'custom-shop-pin',
      html: shopHtml,
      iconSize: [0, 0]
    });

    if (shopMarkerRef.current) {
      shopMarkerRef.current.setLatLng([currentBranch.lat, currentBranch.lng]);
      shopMarkerRef.current.setIcon(shopIcon);
    } else {
      shopMarkerRef.current = L.marker([currentBranch.lat, currentBranch.lng], { icon: shopIcon }).addTo(map);
    }

    // 3. User Marker (Emerald if inside, Rose if outside)
    const userColor = isValidGeofence ? '#10b981' : '#f43f5e';
    const userShadow = isValidGeofence ? 'rgba(16, 185, 129, 0.8)' : 'rgba(244, 63, 94, 0.8)';
    const userHtml = `
      <div style="transform: translate(-50%, -50%); position: relative;">
        <div style="width: 18px; height: 18px; border-radius: 50%; background: ${userColor}; border: 3px solid #ffffff; box-shadow: 0 0 14px ${userShadow};"></div>
        <div style="position: absolute; top: 100%; left: 50%; transform: translateX(-50%); margin-top: 3px; background: #090d16; color: #f8fafc; border-radius: 6px; padding: 2px 6px; font-size: 9px; font-weight: 800; white-space: nowrap; border: 1px solid #334155;">
          ${currentStaff.fullName.split(' ').pop()} (${Math.round(distance)}m)
        </div>
      </div>
    `;
    const userIcon = L.divIcon({
      className: 'custom-user-pin',
      html: userHtml,
      iconSize: [0, 0]
    });

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([currentLat, currentLng]);
      userMarkerRef.current.setIcon(userIcon);
    } else {
      userMarkerRef.current = L.marker([currentLat, currentLng], { icon: userIcon }).addTo(map);
    }

    // Fit map bounds to show both shop & user
    const bounds = L.latLngBounds([
      [currentBranch.lat, currentBranch.lng],
      [currentLat, currentLng]
    ]);
    map.fitBounds(bounds, { padding: [35, 35], maxZoom: 17 });

  }, [currentBranch.lat, currentBranch.lng, currentBranch.name, currentLat, currentLng, ALLOWED_RADIUS, isValidGeofence, distance, currentStaff.fullName]);

  // Cleanup Leaflet Map on Unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const handleGetLocation = () => {
    setLoadingLoc(true);
    setLocError(null);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLoadingLoc(false);
          showToast(`📍 Đã định vị GPS thực tế thành công!`);
        },
        (err) => {
          setLocError('Không thể lấy vị trí GPS thực tế. Hãy bật quyền vị trí và thử lại.');
          setLoadingLoc(false);
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } else {
      setLocError('Trình duyệt không hỗ trợ Geolocation.');
      setLoadingLoc(false);
    }
  };

  // Check late arrival helper
  const checkLateArrival = (shift: ShiftType, date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const currentTotalMinutes = hours * 60 + minutes;

    let targetMinutes = 0;
    // Ưu tiên 1: Lấy trực tiếp giờ bắt đầu của ca đã được sắp xếp từ trước
    if (todayAssignment && !isOverrideShift && todayAssignment.startTime) {
      const [sH, sM] = todayAssignment.startTime.split(':').map(Number);
      targetMinutes = sH * 60 + sM;
    } else if (shift === 'CA_SANG') targetMinutes = 7 * 60; // 07:00
    else if (shift === 'CA_CHIEU') targetMinutes = 13 * 60 + 30; // 13:30
    else if (shift === 'HANH_CHINH') targetMinutes = 7 * 60 + 30; // 07:30
    else if (shift === 'TUY_CHINH') {
      if (!customStartTime) return { isLate: false, lateMinutes: 0 };
      const [sH, sM] = customStartTime.split(':').map(Number);
      targetMinutes = sH * 60 + sM;
    } else {
      return { isLate: false, lateMinutes: 0 }; // TANG_CUONG: Linh hoạt
    }

    const GRACE_PERIOD_MINUTES = 10;
    if (currentTotalMinutes > targetMinutes + GRACE_PERIOD_MINUTES) {
      return {
        isLate: true,
        lateMinutes: currentTotalMinutes - targetMinutes
      };
    }
    return { isLate: false, lateMinutes: 0 };
  };

  const handleCheckAction = async () => {
    if (!isValidGeofence) {
      showToast('⚠️ Bạn đang ở ngoài bán kính cho phép (200m). Vui lòng đến gần cửa hàng!');
      return;
    }

    const now = new Date();
    const nowIso = now.toISOString();
    const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    if (isCurrentlyCheckedIn && activeRecord) {
      // TAN CA (Check-out)
      const checkInTime = new Date(activeRecord.checkIn);
      const diffMs = now.getTime() - checkInTime.getTime();
      const workHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
      
      const noteText = `${currentStaff.fullName} - Tan Ca lúc ${timeStr} (${workHours}h)`;
      
      setShowSuccessMsg(true);
      setActionMessage(`Đã Tan Ca thành công! Số giờ làm: ${workHours}h`);
      showToast(`✅ Đã chốt ca làm việc thành công! Tổng giờ: ${workHours}h`);
      
      try {
        const { error } = await supabase.from('attendance')
          .update({
            check_out: nowIso,
            work_hours: workHours,
            notes: (activeRecord.notes || '') + ` | ${noteText}`
          })
          .eq('id', activeRecord.id);
          
        if (error) console.error('Supabase Update Error:', error);
      } catch (err) {
        console.error('Supabase error:', err);
      }
      
      onCheckInSuccess({
        ...activeRecord,
        checkOut: nowIso,
        workHours,
        notes: (activeRecord.notes || '') + ` | ${noteText}`
      });
      
    } else {
      // Validate Custom Shift mandatory start and end times
      if (selectedShift === 'TUY_CHINH') {
        if (!customStartTime || !customEndTime) {
          showToast('⚠️ Bắt buộc phải điền đầy đủ giờ bắt đầu và giờ kết thúc cho Ca Tùy Chỉnh!');
          return;
        }
        if (customStartTime === customEndTime) {
          showToast('⚠️ Giờ kết thúc ca không được trùng với giờ bắt đầu!');
          return;
        }
      }

      // VAO CA (Check-in)
      const { isLate, lateMinutes } = checkLateArrival(selectedShift, now);
      const lateNote = isLate ? ` | Đi trễ ${lateMinutes} phút` : ' | Đúng giờ';
      const shiftDisplayName = (todayAssignment && !isOverrideShift)
        ? `${todayAssignment.shiftName} (${todayAssignment.startTime} - ${todayAssignment.endTime})`
        : selectedShift === 'TUY_CHINH'
        ? `Ca Tùy Chỉnh (${customStartTime} - ${customEndTime})`
        : getShiftDisplayName(selectedShift);
      const noteText = `${currentStaff.fullName} (${currentStaff.phone}) - Check-in ${shiftDisplayName} Hợp lệ (${currentBranch.name})${lateNote}`;

      const newRecord: AttendanceRecord = {
        id: `att-${Date.now()}`,
        staffId: currentStaff.id,
        branchId: currentBranch.id,
        checkIn: nowIso,
        shiftType: selectedShift,
        lat: currentLat,
        lng: currentLng,
        distanceMeters: distance,
        isVerified: true,
        notes: noteText,
        isLate,
        isOutsideGeofence: false
      };

      setShowSuccessMsg(true);
      setActionMessage(`Đã Chấm Công Vào Ca thành công lúc ${timeStr} ${isLate ? `(Đi trễ ${lateMinutes}p)` : '(Đúng giờ)'}`);
      showToast(`✅ Đã Chấm Công Vào Ca thành công! ${isLate ? `(⚠️ Đi trễ ${lateMinutes}p)` : '(Đúng giờ)'}`);

      try {
        let dbBranchId = null;
        const { data: bData } = await supabase.from('branches').select('id').eq('name', currentBranch.name).single();
        if (bData) dbBranchId = bData.id;
        else {
          const { data: bFallback } = await supabase.from('branches').select('id').limit(1).single();
          dbBranchId = bFallback?.id;
        }

        let dbStaffId = null;
        const { data: sData } = await supabase.from('staff').select('id').eq('phone', currentStaff.phone).single();
        if (sData) dbStaffId = sData.id;
        else {
          const { data: newStaff } = await supabase.from('staff').insert([{ full_name: currentStaff.fullName, phone: currentStaff.phone, role: currentStaff.role }]).select().single();
          if (newStaff) dbStaffId = newStaff.id;
        }

        if (dbBranchId && dbStaffId) {
          await supabase.from('attendance').insert([{
            staff_id: dbStaffId,
            branch_id: dbBranchId,
            check_in: nowIso,
            shift_type: selectedShift,
            lat: currentLat,
            lng: currentLng,
            distance_meters: distance,
            is_verified: true,
            notes: noteText
          }]);
        }
      } catch (e) {
        console.error('Supabase attendance insert:', e);
      }

      onCheckInSuccess(newRecord);
    }
  };

  const handleDisputeSubmit = async (disputeData: {
    disputeType: any;
    shiftType: ShiftType;
    workDate: string;
    checkInTime: string;
    checkOutTime?: string;
    disputeReason: string;
    proofImageUrl: string;
    lat?: number;
    lng?: number;
    distanceMeters?: number;
    existingRecordId?: string;
  }) => {
    const checkInDateTime = `${disputeData.workDate}T${disputeData.checkInTime}:00`;
    const checkInIso = new Date(checkInDateTime).toISOString();
    let checkOutIso: string | undefined = undefined;
    let workHours: number | undefined = undefined;

    if (disputeData.checkOutTime) {
      const checkOutDateTime = `${disputeData.workDate}T${disputeData.checkOutTime}:00`;
      const outD = new Date(checkOutDateTime);
      const inD = new Date(checkInDateTime);
      if (outD.getTime() < inD.getTime()) {
        outD.setDate(outD.getDate() + 1);
      }
      checkOutIso = outD.toISOString();
      const diffMs = outD.getTime() - inD.getTime();
      workHours = Math.max(0.1, +(diffMs / (1000 * 60 * 60)).toFixed(1));
    }

    const dist = disputeData.distanceMeters ?? distance;
    const isOut = dist > ALLOWED_RADIUS;
    const noteText = `${currentStaff.fullName} (${currentStaff.phone}) - [GIẢI TRÌNH CHỜ DUYỆT]: ${disputeData.disputeReason}`;

    const record: AttendanceRecord = {
      id: disputeData.existingRecordId || `att-disp-${Date.now()}`,
      staffId: currentStaff.id,
      branchId: currentBranch.id,
      checkIn: checkInIso,
      checkOut: checkOutIso,
      shiftType: disputeData.shiftType,
      workHours,
      lat: disputeData.lat ?? currentLat,
      lng: disputeData.lng ?? currentLng,
      distanceMeters: Math.round(dist),
      isVerified: false,
      isOutsideGeofence: isOut,
      notes: noteText,
      disputeStatus: 'PENDING',
      disputeType: disputeData.disputeType,
      disputeReason: disputeData.disputeReason,
      proofImageUrl: disputeData.proofImageUrl,
      disputedAt: new Date().toISOString()
    };

    try {
      let dbBranchId = null;
      const { data: bData } = await supabase.from('branches').select('id').eq('name', currentBranch.name).single();
      if (bData) dbBranchId = bData.id;
      else {
        const { data: bFallback } = await supabase.from('branches').select('id').limit(1).single();
        dbBranchId = bFallback?.id;
      }

      let dbStaffId = null;
      const { data: sData } = await supabase.from('staff').select('id').eq('phone', currentStaff.phone).single();
      if (sData) dbStaffId = sData.id;
      else {
        const { data: newStaff } = await supabase.from('staff').insert([{ full_name: currentStaff.fullName, phone: currentStaff.phone, role: currentStaff.role }]).select().single();
        if (newStaff) dbStaffId = newStaff.id;
      }

      if (dbBranchId && dbStaffId) {
        await supabase.from('attendance').insert([{
          staff_id: dbStaffId,
          branch_id: dbBranchId,
          check_in: checkInIso,
          check_out: checkOutIso || null,
          shift_type: disputeData.shiftType,
          work_hours: workHours || null,
          lat: record.lat,
          lng: record.lng,
          distance_meters: Math.round(dist),
          is_verified: false,
          notes: noteText
        }]);
      }
    } catch (err) {
      console.error('Supabase dispute insert error:', err);
    }

    if (onDisputeSubmit) {
      await onDisputeSubmit(record);
    } else {
      onCheckInSuccess(record);
    }

    showToast('✅ Đã gửi phiếu giải trình chấm công! Quản lý sẽ sớm phê duyệt.');
  };

  return (
    <div className="glass-card rounded-2xl p-5 border border-cyan-500/30 bg-slate-900/95 shadow-2xl space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-slate-900 border border-emerald-500 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 backdrop-blur-xl animate-in fade-in">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <MapPin className="w-5 h-5 text-emerald-400 animate-pulse" />
          <div>
            <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
              <span>Chấm Công Định Vị GPS</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-bold">
                Geofence {ALLOWED_RADIUS}m
              </span>
            </h3>
            <p className="text-xs text-slate-400">Xác thực tọa độ {currentBranch.name}</p>
          </div>
        </div>

        {/* Live Work Status Badge */}
        {isCurrentlyCheckedIn ? (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Đang Trong Ca</span>
          </span>
        ) : (
          <span className="text-[11px] font-medium text-slate-500">Chưa Vào Ca</span>
        )}
      </div>

      {/* Current Staff Context Banner */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold text-sm">
            {currentStaff.fullName.charAt(0)}
          </div>
          <div>
            <div className="text-xs font-extrabold text-slate-200">{currentStaff.fullName}</div>
            <div className="text-[10px] text-slate-400 font-mono">{currentStaff.phone} • {currentStaff.role.toUpperCase()}</div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Bán kính an toàn</div>
          <div className="text-xs font-mono font-bold text-emerald-400">{ALLOWED_RADIUS} mét</div>
        </div>
      </div>

      {/* Quick Action Buttons for Shift Schedule & Leave Request */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onOpenMyShiftsModal}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-all cursor-pointer shadow-sm active:scale-95"
        >
          <Calendar className="w-3.5 h-3.5 text-cyan-400" />
          <span>Lịch Chia Ca 15 Ngày</span>
        </button>
        <button
          type="button"
          onClick={onOpenLeaveModal}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-extrabold bg-pink-500/10 hover:bg-pink-500/20 text-pink-300 border border-pink-500/30 transition-all cursor-pointer shadow-sm active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5 text-pink-400" />
          <span>Xin Nghỉ Phép (AI Chị 8)</span>
        </button>
      </div>

      {/* LIVE WORK TIMER BANNER (When Checked In) */}
      {isCurrentlyCheckedIn && activeRecord && (
        <div className="bg-gradient-to-r from-emerald-950/70 via-slate-950 to-emerald-950/70 border border-emerald-500/50 rounded-2xl p-4 text-center space-y-2 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 animate-pulse"></div>
          
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-400">
            <Clock className="w-4 h-4 animate-spin" style={{ animationDuration: '6s' }} />
            <span>THỜI GIAN LÀM VIỆC THỰC TẾ (REALTIME)</span>
          </div>

          <div className="text-4xl font-black font-mono tracking-widest text-emerald-300 drop-shadow-[0_0_12px_rgba(16,185,129,0.4)]">
            {formatTimerString(elapsedSeconds)}
          </div>

          <div className="flex items-center justify-center gap-4 text-xs text-slate-400 pt-1 border-t border-slate-800/80">
            <span>Vào ca: <strong className="text-slate-200">{new Date(activeRecord.checkIn).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</strong></span>
            <span>•</span>
            <span>Ca: <strong className="text-slate-200">{getShiftDisplayName(activeRecord.shiftType || selectedShift)}</strong></span>
          </div>
        </div>
      )}

      {/* 1. KHU VỰC CA LÀM VIỆC CỦA BẠN (Ưu tiên ca đã được xếp lịch) */}
      {!isCurrentlyCheckedIn && (
        <div className="space-y-3">
          {/* TRƯỜNG HỢP 1: CÓ CA ĐÃ ĐƯỢC XẾP TRƯỚC (SCHEDULED) VÀ CHƯA CHỌN ĐỔI CA */}
          {todayAssignment && !isOverrideShift ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
                  <span>1. CA LÀM VIỆC ĐÃ ĐƯỢC XẾP LỊCH HÔM NAY</span>
                </label>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
                  ✓ ĐÃ LÊN LỊCH
                </span>
              </div>

              {/* Thẻ Ca VIP Đã Được Xếp Lịch */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-950/80 via-slate-900 to-indigo-950/80 border-2 border-cyan-500/60 shadow-xl shadow-cyan-500/10 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex flex-col items-center justify-center text-cyan-300 shrink-0">
                      <Clock className="w-5 h-5 text-cyan-400 mb-0.5" />
                      <span className="text-[9px] font-mono font-black">{todayAssignment.hours}h</span>
                    </div>
                    <div>
                      <div className="text-base font-black text-white flex items-center gap-2 flex-wrap">
                        <span>{todayAssignment.shiftName}</span>
                        {todayAssignment.isCrossBranch && (
                          <span className="text-[9px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/40 font-bold">
                            ✈️ Tăng Cường
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-cyan-300 font-mono font-bold mt-1">
                        Khung giờ quy định: <span className="text-white text-sm bg-slate-950/90 px-2.5 py-0.5 rounded-md border border-cyan-500/30 font-mono font-black">{todayAssignment.startTime} - {todayAssignment.endTime}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-500" />
                        <span>Tại: <strong className="text-slate-300">{todayAssignment.workingBranchName || currentBranch.name}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
                    <span className="text-xs font-black text-emerald-400 flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full shadow-sm">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Đã tự động chọn</span>
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1">Tính trễ sau {todayAssignment.startTime}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Được quản lý đổi ca hoặc làm thêm ca khác?</span>
                  <button
                    type="button"
                    onClick={() => setIsOverrideShift(true)}
                    className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                  >
                    ▼ Đổi ca khác / Tùy chỉnh
                  </button>
                </div>
              </div>
            </div>
          ) : isTodayOff && !isOverrideShift ? (
            /* TRƯỜNG HỢP 2: LỊCH HÔM NAY LÀ NGÀY NGHỈ (OFF) */
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                  <span>🏖️ LỊCH HÔM NAY: NGHỈ LUÂN PHIÊN (OFF)</span>
                </label>
                <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold">
                  NGÀY NGHỈ
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/60 border border-purple-500/40 shadow-xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-2xl shrink-0">
                    🏖️
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-purple-200">Hôm nay bạn được xếp lịch nghỉ luân phiên (OFF)</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Hệ thống ghi nhận bạn được nghỉ hôm nay, không tính trễ hay vắng mặt. Nếu bạn tự nguyện đi làm tăng ca để hỗ trợ cửa hàng, vui lòng bấm nút bên dưới.
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setIsOverrideShift(true);
                      setSelectedShift(isOffice ? 'HANH_CHINH' : 'CA_SANG');
                    }}
                    className="px-4 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-purple-500/20"
                  >
                    <Zap className="w-3.5 h-3.5 text-purple-400" />
                    <span>🙋 Đi Làm Tăng Ca Ngày OFF</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* TRƯỜNG HỢP 3: CHƯA CÓ LỊCH HOẶC ĐANG CHỌN ĐỔI CA THỦ CÔNG */
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-slate-300 uppercase tracking-wider block">
                  1. CHỌN CA LÀM VIỆC CỦA BẠN
                </label>
                <div className="flex items-center gap-2">
                  {todayAssignment && isOverrideShift && (
                    <button
                      type="button"
                      onClick={() => setIsOverrideShift(false)}
                      className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                    >
                      ▲ Dùng lại ca được xếp ({todayAssignment.shiftName})
                    </button>
                  )}
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/60">
                    {isOffice ? '🏢 Khối Văn Phòng' : '🏪 Khối Chi Nhánh'}
                  </span>
                </div>
              </div>

              {!todayAssignment && !isTodayOff && (
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-400 flex items-center gap-2">
                  <span className="text-amber-400 font-bold">ℹ️</span>
                  <span>Hôm nay ({todayYmd.split('-').reverse().slice(0, 2).join('/')}) bạn chưa có lịch phân sẵn trên ma trận. Vui lòng chọn ca thực tế bạn đang trực:</span>
                </div>
              )}

          {isOffice ? (
            <div className="space-y-2">
              <button
                onClick={() => setSelectedShift('HANH_CHINH')}
                className={`w-full p-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-between ${
                  selectedShift === 'HANH_CHINH'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md ring-1 ring-amber-500/30'
                    : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-amber-400" />
                  <span className="font-extrabold text-sm">Ca Văn Phòng (07:30 - 17:30)</span>
                </div>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold border border-amber-500/30">
                  Chuẩn Văn Phòng
                </span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSelectedShift('CA_SANG')}
                  className={`p-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    selectedShift === 'CA_SANG'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md'
                      : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Ca Sáng (07:00 - 15:30)</span>
                </button>

                <button
                  onClick={() => setSelectedShift('CA_CHIEU')}
                  className={`p-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    selectedShift === 'CA_CHIEU'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md'
                      : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Ca Chiều (13:30 - 22:00)</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSelectedShift('CA_SANG')}
                  className={`p-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    selectedShift === 'CA_SANG'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md ring-1 ring-amber-500/30'
                      : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Sun className="w-4 h-4 text-amber-400" />
                  <div>Ca Sáng (07:00 - 15:30)</div>
                </button>

                <button
                  onClick={() => setSelectedShift('CA_CHIEU')}
                  className={`p-3 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    selectedShift === 'CA_CHIEU'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md ring-1 ring-amber-500/30'
                      : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Moon className="w-4 h-4 text-indigo-400" />
                  <div>Ca Chiều (13:30 - 22:00)</div>
                </button>
              </div>

              {/* Ca Tăng cường / Part-time option */}
              <button
                type="button"
                onClick={() => setSelectedShift('TANG_CUONG')}
                className={`w-full p-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center justify-between ${
                  selectedShift === 'TANG_CUONG'
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-md ring-1 ring-purple-500/30'
                    : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-purple-400" />
                  <span>Ca Tăng Cường / Part-time (Giờ linh hoạt)</span>
                </div>
                <span className="text-[10px] font-mono text-purple-300">Không tính trễ</span>
              </button>
            </div>
          )}

          {/* Ca Làm Việc Tùy Chỉnh (Bắt buộc nhập giờ bắt đầu & kết thúc) */}
          <button
            type="button"
            onClick={() => setSelectedShift('TUY_CHINH')}
            className={`w-full p-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center justify-between ${
              selectedShift === 'TUY_CHINH'
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/50 shadow-md ring-1 ring-blue-500/30'
                : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-bold">Ca Làm Việc Tùy Chỉnh</span>
            </div>
            <span className="text-[10px] font-mono text-blue-300">Tự nhập giờ vào &amp; ra</span>
          </button>

          {/* Form cấu hình giờ cho Ca Tùy Chỉnh */}
          {selectedShift === 'TUY_CHINH' && (
            <div className="p-3.5 bg-blue-950/30 border border-blue-500/40 rounded-xl space-y-2.5 animate-in fade-in">
              <div className="text-[11px] font-bold text-blue-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  <span>Thiết Lập Thời Gian Ca Tùy Chỉnh:</span>
                </span>
                <span className="text-[10px] text-rose-400 font-bold">* Bắt buộc cả 2</span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-300 block mb-1">
                    Giờ Bắt Đầu <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="time"
                    value={customStartTime}
                    onChange={(e) => setCustomStartTime(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono text-xs font-bold focus:outline-none focus:border-blue-400"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-300 block mb-1">
                    Giờ Kết Thúc <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="time"
                    value={customEndTime}
                    onChange={(e) => setCustomEndTime(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 font-mono text-xs font-bold focus:outline-none focus:border-blue-400"
                    required
                  />
                </div>
              </div>
              {(!customStartTime || !customEndTime) ? (
                <p className="text-[10px] text-amber-400 flex items-center gap-1 font-semibold">
                  <AlertTriangle className="w-3 h-3 shrink-0" /> Bạn phải nhập đầy đủ giờ bắt đầu và kết thúc mới có thể bấm chấm công
                </p>
              ) : (
                <p className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3 h-3 shrink-0" /> Ca làm việc: {customStartTime} đến {customEndTime}
                </p>
              )}
            </div>
          )}
            </div>
          )}
        </div>
      )}

      {/* 2. Interactive Leaflet GPS Map Container */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <label className="font-extrabold text-slate-300 uppercase tracking-wider block">
            2. BẢN ĐỒ GEOFENCING (BÁN KÍNH 100M)
          </label>
          <span className={`font-mono text-xs font-black ${isValidGeofence ? 'text-emerald-400' : 'text-rose-400'}`}>
            Khoảng cách: {formatDistance(distance)}
          </span>
        </div>

        {/* Map Window */}
        <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner">
          <div 
            ref={mapContainerRef} 
            className="w-full h-56 z-0"
            style={{ background: '#0b1120' }}
          ></div>

          {/* Floating Map Status Overlay */}
          <div className="absolute top-2.5 left-2.5 z-[400] flex items-center gap-1.5 bg-slate-950/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 shadow-lg text-[11px]">
            {isValidGeofence ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-emerald-300 font-extrabold">Trong phạm vi hợp lệ (&le; 100m)</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span className="text-rose-400 font-extrabold">Ngoài phạm vi (&gt; 100m)</span>
              </>
            )}
          </div>
        </div>

        {/* Test/Demo Mode & Real GPS Controls */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-semibold flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 text-cyan-400" />
              <span>Chế độ kiểm thử (Test / Demo GPS):</span>
            </span>
            <button
              onClick={handleGetLocation}
              disabled={loadingLoc}
              className="text-xs font-bold text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
            >
              {loadingLoc ? 'Đang định vị...' : '📍 Lấy GPS Thật'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setUserCoords(null);
                setSimulatedOffsetMeters(15);
                showToast('🧪 Đã chuyển sang chế độ: Tại Shop');
              }}
              className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                !hasRealGps && simulatedOffsetMeters <= 100
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Tại Shop</span>
            </button>

            <button
              onClick={() => {
                setUserCoords(null);
                setSimulatedOffsetMeters(250);
                showToast('🧪 Đã chuyển sang chế độ: Ngoài Shop');
              }}
              className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                !hasRealGps && simulatedOffsetMeters > 100
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <XCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>Ngoài Shop</span>
            </button>
          </div>

          {locError && (
            <p className="text-[11px] text-rose-400 pt-1 border-t border-slate-800/80">{locError}</p>
          )}
        </div>
      </div>

      {/* 3. Action Buttons (Chấm Công Vào / Tan Ca / Giải Trình Chấm Công) */}
      <div className="space-y-2">
        {showSuccessMsg ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-center space-y-1 animate-in fade-in">
            <div className="flex items-center justify-center gap-2 text-emerald-400 font-extrabold text-sm">
              <ShieldCheck className="w-5 h-5" />
              <span>{actionMessage}</span>
            </div>
            <p className="text-[11px] text-slate-400">Dữ liệu đã được ghi nhận an toàn và đồng bộ tức thời lên Supabase.</p>
          </div>
        ) : (
          <>
            {canCheckIn ? (
              <button
                onClick={handleCheckAction}
                className={`w-full py-4 px-4 rounded-2xl font-black text-sm shadow-xl flex items-center justify-center gap-2.5 transition-all cursor-pointer active:scale-95 ${
                  isCurrentlyCheckedIn 
                    ? 'bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white font-black ring-2 ring-rose-500/40 shadow-rose-900/30'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black ring-2 ring-emerald-500/40 shadow-emerald-900/30'
                }`}
              >
                {isCurrentlyCheckedIn ? (
                  <>
                    <StopCircle className="w-5 h-5 text-white" />
                    <span>BẤM CHẤM CÔNG TAN CA (CHỐT GIỜ LÀM)</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    <span>BẤM CHẤM CÔNG VÀO CA ({currentBranch.code})</span>
                  </>
                )}
              </button>
            ) : (
              /* Khi ngoài bán kính 100m: Mở nút Giải Trình Chấm Công */
              <button
                type="button"
                onClick={() => {
                  setDisputeInitialType('OUTSIDE_GEOFENCE');
                  setDisputeExistingRecord(null);
                  setIsDisputeModalOpen(true);
                }}
                className="w-full py-4 px-4 rounded-2xl font-black text-sm shadow-xl flex items-center justify-center gap-2.5 transition-all cursor-pointer active:scale-95 bg-gradient-to-r from-amber-500 via-rose-500 to-pink-600 hover:from-amber-400 hover:to-rose-500 text-white ring-2 ring-amber-400/50 shadow-amber-950/40"
              >
                <ShieldAlert className="w-5 h-5 text-amber-200 animate-pulse" />
                <span>BẤM CHẤM CÔNG KÈM GIẢI TRÌNH (&gt; 100M)</span>
              </button>
            )}

            {/* Nút phụ: Gửi giải trình chấm công bù hoặc quên chấm công */}
            <button
              type="button"
              onClick={() => {
                setDisputeInitialType('FORGOT_CHECKIN');
                setDisputeExistingRecord(null);
                setIsDisputeModalOpen(true);
              }}
              className="w-full py-2.5 px-3 rounded-xl border border-slate-800 hover:border-cyan-500/50 bg-slate-950/60 hover:bg-slate-950 text-slate-400 hover:text-cyan-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              <span>Quên chấm công hoặc làm việc ngoài cửa hàng? Gửi giải trình bổ sung</span>
            </button>
          </>
        )}
      </div>

      {/* 4. Personal Attendance History */}
      <div className="mt-3 pt-3 border-t border-slate-800">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>Lịch sử chấm công gần nhất</span>
          <span className="text-[10px] text-slate-500 font-normal">Hiển thị ca trực & giải trình</span>
        </h4>
        <div className="space-y-2">
          {visibleAttendanceHistory.slice(0, 4).map((item) => (
            <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs bg-slate-950/70 p-3 rounded-xl border border-slate-800">
              <div className="flex items-start sm:items-center gap-2.5">
                <div className={`w-2.5 h-2.5 rounded-full mt-1 sm:mt-0 shrink-0 ${
                  item.disputeStatus === 'PENDING'
                    ? 'bg-amber-400 animate-ping'
                    : item.disputeStatus === 'REJECTED'
                    ? 'bg-rose-500'
                    : item.checkOut 
                    ? 'bg-emerald-400' 
                    : 'bg-cyan-400 animate-pulse'
                }`}></div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-slate-200 font-bold">
                      Vào: {new Date(item.checkIn).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      {item.checkOut && ` ➔ Ra: ${new Date(item.checkOut).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`}
                    </span>

                    {/* Dispute Status Badges */}
                    {item.disputeStatus === 'PENDING' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-400 animate-spin" />
                        <span>Chờ Quản lý duyệt</span>
                      </span>
                    )}
                    {item.disputeStatus === 'APPROVED' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        <span>Đã duyệt hợp lệ</span>
                      </span>
                    )}
                    {item.disputeStatus === 'REJECTED' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                        <XCircle className="w-3 h-3 text-rose-400" />
                        <span>Từ chối</span>
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{item.notes}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                {item.distanceMeters !== undefined && (
                  <span className={`font-mono text-xs font-bold ${item.distanceMeters <= ALLOWED_RADIUS ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {Math.round(item.distanceMeters)}m
                  </span>
                )}
                {item.proofImageUrl && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                    <Camera className="w-2.5 h-2.5" /> Có ảnh
                  </span>
                )}
              </div>
            </div>
          ))}
          {visibleAttendanceHistory.length === 0 && (
            <p className="text-xs text-slate-500 py-2 text-center">Chưa có lịch sử chấm công.</p>
          )}
        </div>
      </div>

      {/* Attendance Dispute Modal */}
      <AttendanceDisputeModal
        isOpen={isDisputeModalOpen}
        onClose={() => setIsDisputeModalOpen(false)}
        currentStaff={currentStaff}
        currentBranch={currentBranch}
        currentCoords={userCoords}
        distanceMeters={distance}
        initialDisputeType={disputeInitialType}
        existingRecord={disputeExistingRecord}
        onSubmitDispute={handleDisputeSubmit}
      />
    </div>
  );
};

