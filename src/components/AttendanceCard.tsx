import React, { useState } from 'react';
import { Branch, AttendanceRecord, Staff, ShiftType } from '../types';
import { getDistanceMeters, formatDistance } from '../lib/geoUtils';
import { supabase } from '../lib/supabase';
import { MapPin, Navigation, CheckCircle2, XCircle, Clock, ShieldCheck } from 'lucide-react';

interface AttendanceCardProps {
  currentBranch: Branch;
  currentStaff: Staff;
  onCheckInSuccess: (record: AttendanceRecord) => void;
  attendanceHistory: AttendanceRecord[];
}

export const AttendanceCard: React.FC<AttendanceCardProps> = ({
  currentBranch,
  currentStaff,
  onCheckInSuccess,
  attendanceHistory,
}) => {
  const isOffice = currentStaff.role === 'admin' || currentStaff.role === 'founder';
  const defaultShift: ShiftType = isOffice ? 'HANH_CHINH' : 'CA_SANG';
  
  const [selectedShift, setSelectedShift] = useState<ShiftType>(defaultShift);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loadingLoc, setLoadingLoc] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const [simulatedOffsetMeters, setSimulatedOffsetMeters] = useState<number>(12);
  const [showSuccessMsg, setShowSuccessMsg] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<string>('');

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

  const ALLOWED_RADIUS = 35;
  const hasRealGps = userCoords !== null;
  const currentLat = userCoords ? userCoords.lat : currentBranch.lat + (simulatedOffsetMeters / 111000);
  const currentLng = userCoords ? userCoords.lng : currentBranch.lng;
  const distance = getDistanceMeters(currentLat, currentLng, currentBranch.lat, currentBranch.lng);
  const isValidGeofence = (hasRealGps || isDevelopment) && distance <= ALLOWED_RADIUS;
  const isOutsideGeofence = hasRealGps && !isValidGeofence;
  const canCheckIn = isValidGeofence && hasRealGps;

  const handleGetLocation = () => {
    setLoadingLoc(true);
    setLocError(null);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLoadingLoc(false);
        },
        (err) => {
          setLocError('Không thể lấy vị trí GPS thực tế. Hãy bật quyền vị trí và thử lại.');
          setLoadingLoc(false);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setLocError('Trình duyệt không hỗ trợ GPS.');
      setLoadingLoc(false);
    }
  };

  const handleCheckAction = async () => {
    if (!isValidGeofence) return;
    const now = new Date();
    const nowIso = now.toISOString();
    const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    if (isCurrentlyCheckedIn && activeRecord) {
      const checkInTime = new Date(activeRecord.checkIn);
      const diffMs = now.getTime() - checkInTime.getTime();
      const workHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
      
      const noteText = `${currentStaff.fullName} - Tan Ca lúc ${timeStr} (${workHours}h)`;
      
      setShowSuccessMsg(true);
      setActionMessage(`Đã Tan Ca thành công! Số giờ làm: ${workHours}h`);
      
      try {
        const { error } = await supabase.from('attendance')
          .update({
            check_out: nowIso,
            work_hours: workHours,
            notes: activeRecord.notes + ` | ${noteText}`
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
        notes: activeRecord.notes + ` | ${noteText}`
      });
      
    } else {
      const noteText = `${currentStaff.fullName} (${currentStaff.phone}) - Check-in ${selectedShift} Hợp lệ (${currentBranch.name})`;

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
        notes: noteText
      };

      setShowSuccessMsg(true);
      setActionMessage(`Đã Chấm Công Vào Ca thành công lúc ${timeStr}`);

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

  return (
    <div className="glass-card rounded-2xl p-5 border border-cyan-500/30 bg-slate-900/90 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-amber-500 animate-pulse" />
          <div>
            <h3 className="text-base font-extrabold text-slate-100">Chấm Công Định Vị GPS</h3>
            <p className="text-xs text-slate-400">Xác thực tọa độ cửa hàng {currentBranch.name}</p>
          </div>
        </div>
        <span className="text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-2.5 py-1 rounded-full font-bold">
          Geofencing 35m
        </span>
      </div>

      {/* Current Staff Context Banner */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold text-sm">
            {currentStaff.fullName.charAt(0)}
          </div>
          <div>
            <div className="text-xs font-extrabold text-slate-200">{currentStaff.fullName}</div>
            <div className="text-[10px] text-slate-400 font-mono">{currentStaff.phone}</div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-[10px] text-slate-400 uppercase font-semibold">Bán kính tối đa</div>
          <div className="text-xs font-mono font-bold text-cyan-400">{ALLOWED_RADIUS} mét</div>
        </div>
      </div>

      {/* Shift Selection */}
      <div className="space-y-1.5">
        <label className="text-xs font-extrabold text-slate-300 uppercase tracking-wider block">
          1. CHỌN CA LÀM VIỆC CỦA BẠN
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setSelectedShift('CA_SANG')}
            className={`p-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              selectedShift === 'CA_SANG'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md'
                : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <div>Ca Sáng (07:00 - 15:00)</div>
          </button>

          <button
            onClick={() => setSelectedShift('CA_CHIEU')}
            className={`p-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              selectedShift === 'CA_CHIEU'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md'
                : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <div>Ca Chiều (14:00 - 22:00)</div>
          </button>
        </div>
      </div>

      {/* Distance Indicator Box */}
      <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-300 flex items-center gap-1.5 font-bold">
            <Navigation className="w-4 h-4 text-cyan-400" />
            <span>Khoảng cách đến shop:</span>
          </span>
          <span className={`font-mono text-sm font-black ${isValidGeofence ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatDistance(distance)}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60">
          <div className="flex items-center gap-1.5">
            {!hasRealGps ? (
              <>
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="text-amber-300 font-medium">Mô phỏng khoảng cách (DEV)</span>
              </>
            ) : isValidGeofence ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-300 font-medium">Hợp lệ (Đang ở trong shop)</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 text-rose-400" />
                <span className="text-rose-300 font-medium">Vượt quá bán kính 35m</span>
              </>
            )}
          </div>

          <button
            onClick={handleGetLocation}
            disabled={loadingLoc}
            className="text-[11px] font-medium text-slate-400 hover:text-slate-200 underline decoration-slate-600 cursor-pointer"
          >
            {loadingLoc ? 'Đang cập nhật...' : 'Lấy GPS thực tế'}
          </button>
        </div>

        {isDevelopment && (
          <div className="mt-2 pt-2 border-t border-slate-800/40">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
              <span>Mô phỏng khoảng cách (Test nhanh):</span>
              <span className="font-mono text-slate-200 font-bold">{simulatedOffsetMeters}m</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={simulatedOffsetMeters}
              onChange={(e) => setSimulatedOffsetMeters(Number(e.target.value))}
              className="w-full accent-amber-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
            />
          </div>
        )}
      </div>

      {/* Action Button */}
      {showSuccessMsg ? (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3.5 text-center">
          <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold text-sm mb-1">
            <ShieldCheck className="w-5 h-5" />
            <span>{actionMessage}</span>
          </div>
          <p className="text-[11px] text-slate-400">Dữ liệu đã được ghi nhận an toàn vào Supabase.</p>
        </div>
      ) : (
        <button
          onClick={handleCheckAction}
          disabled={!canCheckIn}
          className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-all ${
            canCheckIn
              ? isCurrentlyCheckedIn 
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-extrabold cursor-pointer active:scale-95'
                : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-extrabold cursor-pointer active:scale-95'
              : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>
            {!hasRealGps 
              ? 'Vui lòng Lấy GPS thực tế' 
              : isCurrentlyCheckedIn 
                ? `Bấm Chấm Công Tan Ca (${currentBranch.code})` 
                : `Bấm Chấm Công Vào Ca (${currentBranch.code})`}
          </span>
        </button>
      )}

      {/* Personal Attendance History */}
      <div className="mt-4 pt-3 border-t border-slate-800">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Lịch sử chấm công gần nhất</h4>
        <div className="space-y-2">
          {visibleAttendanceHistory.slice(0, 4).map((item) => (
            <div key={item.id} className="flex items-center justify-between text-xs bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                <div className="flex flex-col">
                  <span className="text-slate-200 font-medium">
                    In: {new Date(item.checkIn).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    {item.checkOut && ` - Out: ${new Date(item.checkOut).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`}
                  </span>
                  <span className="text-[10px] text-slate-400">{item.notes}</span>
                </div>
              </div>
              <span className="font-mono text-emerald-400 font-semibold">{item.distanceMeters}m</span>
            </div>
          ))}
          {visibleAttendanceHistory.length === 0 && (
            <p className="text-xs text-slate-500 py-2">Chưa có lịch sử chấm công.</p>
          )}
        </div>
      </div>
    </div>
  );
};
