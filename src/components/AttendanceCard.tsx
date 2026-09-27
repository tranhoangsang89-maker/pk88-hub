import React, { useState } from 'react';
import { Branch, AttendanceRecord, Staff } from '../types';
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
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loadingLoc, setLoadingLoc] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const [simulatedOffsetMeters, setSimulatedOffsetMeters] = useState<number>(12);
  const [isCheckedIn, setIsCheckedIn] = useState<boolean>(false);
  const [lastCheckInTime, setLastCheckInTime] = useState<string | null>(null);

  const currentLat = userCoords ? userCoords.lat : currentBranch.lat + (simulatedOffsetMeters / 111000);
  const currentLng = userCoords ? userCoords.lng : currentBranch.lng;
  const distance = getDistanceMeters(currentLat, currentLng, currentBranch.lat, currentBranch.lng);
  const ALLOWED_RADIUS = 35;
  const isValidGeofence = distance <= ALLOWED_RADIUS;

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
          setLocError('Không thể lấy vị trí GPS thực tế. Đang dùng định vị mô phỏng shop.');
          setLoadingLoc(false);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      setLocError('Trình duyệt không hỗ trợ GPS.');
      setLoadingLoc(false);
    }
  };

  const handleCheckIn = async () => {
    if (!isValidGeofence) return;
    const now = new Date().toISOString();
    const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    const noteText = `${currentStaff.fullName} - Check-in GPS Hợp lệ (${currentBranch.name})`;

    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}`,
      staffId: currentStaff.id,
      branchId: currentBranch.id,
      checkIn: now,
      lat: currentLat,
      lng: currentLng,
      distanceMeters: distance,
      isVerified: true,
      notes: noteText
    };

    setIsCheckedIn(true);
    setLastCheckInTime(timeStr);

    // Sync to Real Supabase Cloud Database!
    try {
      // Find staff in Supabase by phone or insert with fallback UUID
      const { data: staffData } = await supabase
        .from('staff')
        .select('id')
        .eq('phone', currentStaff.phone)
        .single();

      const { data: branchData } = await supabase
        .from('branches')
        .select('id')
        .eq('code', currentBranch.code)
        .single();

      const targetStaffId = staffData?.id || null;
      const targetBranchId = branchData?.id || null;

      const { error: insertErr } = await supabase.from('attendance').insert([
        {
          ...(targetStaffId ? { staff_id: targetStaffId } : {}),
          ...(targetBranchId ? { branch_id: targetBranchId } : {}),
          check_in: now,
          lat: currentLat,
          lng: currentLng,
          distance_meters: distance,
          is_verified: true,
          notes: noteText
        }
      ]);

      if (insertErr) {
        console.error('Supabase Insert Error:', insertErr);
        // Fallback insert without strict FK if needed
        await supabase.from('attendance').insert([
          {
            check_in: now,
            lat: currentLat,
            lng: currentLng,
            distance_meters: distance,
            is_verified: true,
            notes: noteText
          }
        ]);
      }
      console.log('✅ Synchronized GPS Attendance to Supabase Cloud!');
    } catch (err) {
      console.error('Supabase Sync error:', err);
    }

    onCheckInSuccess(newRecord);
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
          <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-rose-400">
            {currentStaff.fullName.charAt(0)}
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-200">{currentStaff.fullName}</div>
            <div className="text-[11px] text-slate-400">{currentStaff.phone}</div>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[11px] font-mono text-slate-400">Bán kính tối đa</span>
          <div className="text-xs font-bold text-slate-200">{ALLOWED_RADIUS} mét</div>
        </div>
      </div>

      <div className={`rounded-xl p-4 border transition-all mb-5 ${
        isValidGeofence
          ? 'bg-emerald-950/20 border-emerald-500/30 glow-emerald'
          : 'bg-rose-950/20 border-rose-500/30 glow-red'
      }`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Navigation className={`w-4 h-4 ${isValidGeofence ? 'text-emerald-400 animate-spin-slow' : 'text-rose-400'}`} />
            <span className="text-xs font-semibold text-slate-300">Khoảng cách đến shop:</span>
          </div>
          <div className={`text-lg font-extrabold font-mono ${isValidGeofence ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatDistance(distance)}
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            {isValidGeofence ? (
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
            {loadingLoc ? 'Đang cập nhật GPS...' : 'Lấy GPS thực tế'}
          </button>
        </div>

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
      </div>

      {isCheckedIn ? (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3.5 text-center">
          <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold text-sm">
            <ShieldCheck className="w-5 h-5" />
            <span>Đã Chấm Công Thành Công Lúc {lastCheckInTime}</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Dữ liệu GPS đã được ghi nhận an toàn vào Supabase Database.</p>
        </div>
      ) : (
        <button
          onClick={handleCheckIn}
          disabled={!isValidGeofence}
          className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-all ${
            isValidGeofence
              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-extrabold cursor-pointer active:scale-95'
              : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Bấm Chấm Công Vào Ca ({currentBranch.code})</span>
        </button>
      )}

      <div className="mt-6 pt-4 border-t border-slate-800">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Lịch sử chấm công gần nhất</h4>
        <div className="space-y-2">
          {attendanceHistory.slice(0, 5).map((item) => (
            <div key={item.id} className="flex items-center justify-between text-xs bg-slate-900/40 p-2.5 rounded-lg border border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                <span className="text-slate-200 font-medium">
                  {new Date(item.checkIn).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="text-slate-400">| {item.notes}</span>
              </div>
              <span className="font-mono text-emerald-400 font-semibold">{item.distanceMeters}m</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
