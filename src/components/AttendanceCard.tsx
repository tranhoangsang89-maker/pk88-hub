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
  // Record has no checkOut
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
      // CHECK-OUT LOGIC
      const checkInTime = new Date(activeRecord.checkIn);
      const diffMs = now.getTime() - checkInTime.getTime();
      const workHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
      
      const noteText = `${currentStaff.fullName} - Tan Ca lúc ${timeStr} (${workHours}h)`;
      
      setShowSuccessMsg(true);
      setActionMessage(`Đã Tan Ca thành công! Số giờ làm: ${workHours}h`);
      
      try {
        // Try to update Supabase
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
      // CHECK-IN LOGIC
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
          const { data: newStaff, error: staffErr } = await supabase.from('staff').insert([{ full_name: currentStaff.fullName, phone: currentStaff.phone, role: currentStaff.role }]).select().single();
          if (newStaff) dbStaffId = newStaff.id;
        }

        if (dbBranchId && dbStaffId) {
          const { error: insertErr } = await supabase.from('attendance').insert([{
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
          if (insertErr) console.error('Supabase Insert Error:', insertErr);
        }
      } catch (err) {
        console.error('Supabase Sync error:', err);
      }
      
      onCheckInSuccess(newRecord);
    }
    
    // Hide success message after 3 seconds
    setTimeout(() => {
      setShowSuccessMsg(false);
    }, 3000);
  };

  return (
    <div className="glass-card rounded-2xl p-5 border border-slate-800 shadow-2xl relative overflow-hidden">
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-100">Chấm Công Định Vị GPS</h3>
            <span className="text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              Geofencing 35m
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Xác thực tọa độ cửa hàng {currentBranch.name}</p>
        </div>
        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700/60 text-slate-300">
          <MapPin className="w-5 h-5 text-rose-500" />
        </div>
      </div>

      <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-bold text-amber-400">
            {currentStaff.fullName.charAt(0)}
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <span>{currentStaff.fullName}</span>
              {currentStaff?.role === 'founder' && (
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold">
                  CHỦ DOANH NGHIỆP
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-400">{currentStaff.phone}</div>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[11px] font-mono text-slate-400">Bán kính tối đa</span>
          <div className="text-xs font-bold text-slate-200">{ALLOWED_RADIUS} mét</div>
        </div>
      </div>

      {currentStaff?.role === 'founder' && (
        <div className="mb-4 p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-center gap-2">
          <span className="text-base">👑</span>
          <div>
            <div className="font-bold">Đặc quyền Ban Giám Đốc / Founder:</div>
            <div className="text-[11px] text-amber-200/80">Bạn là Chủ sở hữu Phụ Kiện 88 - Hệ thống tự động miễn nghĩa vụ chấm công GPS & thử việc.</div>
          </div>
        </div>
      )}

      {!isCurrentlyCheckedIn && !showSuccessMsg && (
        <div className="mb-5 bg-slate-900/40 p-3 rounded-xl border border-slate-800/60">
          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">1. Chọn ca làm việc của bạn</label>
          <div className="grid grid-cols-2 gap-2">
            {isOffice ? (
              <button
                type="button"
                className={`col-span-2 py-2 px-3 rounded-lg text-xs font-bold transition-all border ${
                  selectedShift === 'HANH_CHINH' ? 'bg-rose-500/20 text-rose-400 border-rose-500/50' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                }`}
                onClick={() => setSelectedShift('HANH_CHINH')}
              >
                Giờ Hành Chính (08:00 - 17:00)
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all border ${
                    selectedShift === 'CA_SANG' ? 'bg-rose-500/20 text-rose-400 border-rose-500/50' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                  }`}
                  onClick={() => setSelectedShift('CA_SANG')}
                >
                  Ca Sáng (07:00 - 15:00)
                </button>
                <button
                  type="button"
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all border ${
                    selectedShift === 'CA_CHIEU' ? 'bg-rose-500/20 text-rose-400 border-rose-500/50' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                  }`}
                  onClick={() => setSelectedShift('CA_CHIEU')}
                >
                  Ca Chiều (14:00 - 22:00)
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <div className={`rounded-xl p-4 border transition-all mb-5 ${
        isValidGeofence
          ? 'bg-emerald-950/20 border-emerald-500/30 glow-emerald'
          : isOutsideGeofence
            ? 'bg-rose-950/20 border-rose-500/30 glow-red'
            : 'bg-slate-900/40 border-slate-800'
      }`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Navigation className={`w-4 h-4 ${isValidGeofence ? 'text-emerald-400 animate-spin-slow' : isOutsideGeofence ? 'text-rose-400' : 'text-slate-500'}`} />
            <span className="text-xs font-semibold text-slate-300">Khoảng cách đến shop:</span>
          </div>
          <div className={`text-lg font-extrabold font-mono ${isValidGeofence ? 'text-emerald-400' : isOutsideGeofence ? 'text-rose-400' : 'text-slate-500'}`}>
            {hasRealGps || isDevelopment ? formatDistance(distance) : '—'}
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            {isDevelopment && !hasRealGps && isValidGeofence ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                <span className="text-amber-300 font-medium">Mô phỏng trong phạm vi (DEV)</span>
              </>
            ) : isDevelopment && !hasRealGps ? (
              <>
                <XCircle className="w-4 h-4 text-rose-400" />
                <span className="text-rose-300 font-medium">Mô phỏng ngoài bán kính 35m (DEV)</span>
              </>
            ) : isValidGeofence ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-300 font-medium">Hợp lệ (Đang ở trong shop)</span>
              </>
            ) : isOutsideGeofence ? (
              <>
                <XCircle className="w-4 h-4 text-rose-400" />
                <span className="text-rose-300 font-medium">Vượt quá bán kính 35m</span>
              </>
            ) : (
              <span className="text-slate-400 font-medium">Chưa xác định vị trí</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {isDevelopment && (
              <button
                onClick={() => setUserCoords({ lat: currentBranch.lat, lng: currentBranch.lng })}
                className="text-[10px] font-bold bg-amber-500/20 text-amber-400 px-2 py-1 rounded-md hover:bg-amber-500/30"
              >
                Mock GPS (Dev)
              </button>
            )}
            <button
              onClick={handleGetLocation}
              disabled={loadingLoc}
              className="text-[11px] font-medium text-slate-400 hover:text-slate-200 underline decoration-slate-600 cursor-pointer"
            >
              {loadingLoc ? 'Đang cập nhật...' : 'Lấy GPS thực tế'}
            </button>
          </div>
        </div>

        {isDevelopment && (
          <div className="mt-3 pt-2 border-t border-slate-800/40">
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
              className="w-full accent-rose-500 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
            />
          </div>
        )}
        {!hasRealGps && locError && (
          <p role="status" className="mt-3 text-xs text-amber-300">{locError}</p>
        )}
        {!hasRealGps && !isDevelopment && !locError && (
          <p role="status" className="mt-3 text-xs text-slate-400">Chưa xác định vị trí. Hãy lấy GPS thực tế để kiểm tra khoảng cách.</p>
        )}
      </div>

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

      <div className="mt-6 pt-4 border-t border-slate-800">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Lịch sử chấm công gần nhất</h4>
        <div className="space-y-2">
          {visibleAttendanceHistory.slice(0, 5).map((item) => (
            <div key={item.id} className="flex items-center justify-between text-xs bg-slate-900/40 p-2.5 rounded-lg border border-slate-800">
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
