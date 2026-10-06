import React, { useState, useEffect } from 'react';
import { Staff, Branch, LeaveRequest, LeaveType, LeaveStatus } from '../types';
import { Bot, Calendar, CheckCircle2, XCircle, AlertTriangle, Send, Sparkles, User, Building, Clock, ShieldCheck, Plus, RefreshCw, X, MessageSquare, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AIHRModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: Staff | null;
  branches: Branch[];
  staffList: Staff[];
  leaveRequests: LeaveRequest[];
  onSubmitLeaveRequest: (newReq: LeaveRequest) => void;
  onUpdateLeaveStatus: (reqId: string, status: LeaveStatus, approvedBy: string) => void;
}

export const AIHRModal: React.FC<AIHRModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  branches,
  staffList,
  leaveRequests,
  onSubmitLeaveRequest,
  onUpdateLeaveStatus
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'chat' | 'list' | 'form'>('chat');

  // Form states
  const [leaveType, setLeaveType] = useState<LeaveType>('PAID_LEAVE');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState<string>('');
  const [replacementStaff, setReplacementStaff] = useState<string>('');

  // Helper for Role Priority for Approval
  const ROLE_PRIORITY: Record<string, number> = {
    founder: 1,
    admin: 2,
    sales_head: 3,
    accountant: 4,
    marketing: 5,
    hr: 6,
    manager: 7,
    technician: 8,
    sales: 9
  };

  // Get recipient text based on user role
  const getApprovalRecipientText = (role?: string) => {
    switch (role) {
      case 'founder': 
        return 'Hệ thống tự động ghi nhận (Founder - Chủ sở hữu)';
      case 'sales':
      case 'technician':
        return 'Cửa Hàng Trưởng (Manager) hoặc Khối HR';
      default:
        // Từ Cấp Manager trở lên (Manager, Kế toán, Marketing, TP. Kinh Doanh, HR, Admin)
        return 'Cấp HR (Hành Chính - Nhân Sự) & Founder (Anh Ngô Hồng Thao)';
    }
  };

  // Get initial greeting message based on user role
  const getInitialGreeting = (user: Staff | null) => {
    if (user?.role === 'founder') {
      return `Kính chào **Anh Ngô Hồng Thao (Founder & Chủ Sở Hữu Phụ Kiện 88)** 👑!\n\nEm là **Trợ Lý AI HR (Chị 8 Hành Chính)** 🤖.\n\nLà Chủ sở hữu doanh nghiệp Phụ Kiện 88, Anh có toàn quyền tự do thời gian làm việc và được **MIỄN 100% nghĩa vụ xin nghỉ phép hay chấm công**.\n\nAnh có cần Em hỗ trợ tra cứu danh sách đơn xin nghỉ phép của nhân sự các chi nhánh hoặc duyệt đơn cho nhân viên không ạ?`;
    }
    if (user?.role === 'admin') {
      return `Kính chào **Sếp ${user?.fullName || 'Trần Hoàng Sang'} (Admin & System Creator)** 🛠️⚡!\n\nDạ em chào Boss! Em là **Trợ Lý AI HR (Chị 8 Hành Chính - AI Agent #5)** 🤖 - "con cưng" do chính tay Anh lập trình và kiến tạo ra đây ạ!\n\nLà Quản trị viên hệ thống (Admin & Automation), Anh không cần phải xin nghỉ phép theo quy trình thông thường. Em sẵn sàng nhận lệnh từ Boss để hỗ trợ giám sát danh sách đơn phép của 6 chi nhánh, kiểm tra dữ liệu hoặc báo cáo tình hình nhân sự ngay lập tức ạ!`;
    }
    return `Xin chào **${user?.fullName || 'bạn'}** (${user?.role ? user.role.toUpperCase() : 'Nhân sự'})! Tôi là **Trợ Lý AI HR (Chị 8 Hành Chính - Duyệt Phép)** 🤖.\n\nBạn có thể nhắn tin bằng ngôn ngữ tự nhiên để xin nghỉ phép, ví dụ:\n- *"Em bị sốt cao xin nghỉ ốm 1 ngày hôm nay 10/10/2026"*\n- *"Xin nghỉ phép năm ngày 15/10/2026 đưa mẹ đi khám bệnh, có bạn Tuấn trực thay"*\n\nTôi sẽ tự động phân tích rủi ro ca trực và chuyển đơn đến **${getApprovalRecipientText(user?.role)}** duyệt ngay lập tức!`;
  };

  // AI Chat States
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'ai'; text: string; parsedDraft?: Partial<LeaveRequest> }>>([
    {
      role: 'ai',
      text: getInitialGreeting(currentUser)
    }
  ]);

  useEffect(() => {
    if (isOpen && currentUser) {
      setChatMessages([
        {
          role: 'ai',
          text: getInitialGreeting(currentUser)
        }
      ]);
    }
  }, [isOpen, currentUser?.id]);

  const [userInput, setUserInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  if (!isOpen) return null;

  // Handle Form Submit
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || !currentUser) return;

    const branch = branches.find(b => b.id === currentUser.branchId);
    
    // Quick AI Risk Assessment Mock
    const sameBranchRequests = leaveRequests.filter(r => r.branchId === currentUser.branchId && r.startDate === startDate && r.status === 'APPROVED');
    const riskText = sameBranchRequests.length > 0 
      ? `🟡 Cảnh báo nhẹ: Ngày ${startDate} tại ${branch?.name || 'Chi nhánh'} đã có ${sameBranchRequests.length} nhân sự xin nghỉ.`
      : `🟢 An toàn: Ca trực ngày ${startDate} đủ nhân sự vận hành.`;

    const newReq: LeaveRequest = {
      id: `leave-${Date.now()}`,
      staffId: currentUser.id,
      staffName: currentUser.fullName,
      phone: currentUser.phone,
      branchId: currentUser.branchId,
      role: currentUser.role,
      startDate,
      endDate,
      reason,
      type: leaveType,
      status: currentUser?.role === 'founder' ? 'APPROVED' : 'PENDING',
      approvedBy: currentUser?.role === 'founder' ? 'Tự duyệt (Founder)' : undefined,
      createdAt: new Date().toISOString(),
      replacementStaffName: replacementStaff || undefined,
      aiRiskAssessment: riskText
    };

    onSubmitLeaveRequest(newReq);
    alert(`✅ Đơn xin nghỉ phép đã được gửi thành công! Đơn sẽ được chuyển đến: ${getApprovalRecipientText(currentUser?.role)}.`);
    setReason('');
    setReplacementStaff('');
    setActiveSubTab('list');
  };

  // Call Gemini API with Key Rotation
  const handleSendMessage = async () => {
    if (!userInput.trim() || isAiLoading) return;

    const userMsg = userInput.trim();
    setUserInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsAiLoading(true);

    try {
      const allKeys = (import.meta.env.VITE_GEMINI_API_KEY || '').split(',').map((k: string) => k.trim()).filter(Boolean);
      const apiKey = allKeys.length > 0 ? allKeys[Math.floor(Math.random() * allKeys.length)] : '';

      const currentBranch = branches.find(b => b.id === currentUser?.branchId);
      const branchName = currentBranch ? currentBranch.name : 'Phụ Kiện 88';
      const approverText = getApprovalRecipientText(currentUser?.role);

      const branchMap: Record<string, string> = {
        b1: 'Phụ Kiện 88 - Bến Tre 1 (HQ)',
        b2: 'Phụ Kiện 88 - Bến Tre 2 (Tân Thành)',
        b3: 'Phụ Kiện 88 - Mỹ Tho',
        b4: 'Phụ Kiện 88 - Vĩnh Long',
        b5: 'Phụ Kiện 88 - Cần Thơ',
        b6: 'Phụ Kiện 88 - Trà Vinh'
      };

      const leaveContextText = leaveRequests.length === 0
        ? "Hiện tại CHƯA có đơn xin nghỉ phép nào trên hệ thống."
        : `| STT | Nhân Sự | Chi Nhánh | Thời Gian | Loại & Lý Do | Trạng Thái | Đánh Giá AI HR |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- |
` + leaveRequests.map((r, idx) => {
            const b = branches.find(br => br.id === r.branchId || br.code === r.branchId);
            const bName = b ? b.name : (branchMap[r.branchId] || r.branchId);
            const statusBadge = r.status === 'PENDING' 
              ? '🟡 **CHỜ DUYỆT**' 
              : r.status === 'APPROVED' 
              ? `🟢 **ĐÃ DUYỆT** *(Bởi: ${r.approvedBy || 'Ban Giám Đốc'})*` 
              : `🔴 **TỪ CHỐI** *(Bởi: ${r.rejectedBy || r.approvedBy || 'Cửa Hàng Trưởng'})*`;
            const typeLabel = r.type === 'PAID_LEAVE' ? 'Phép năm' : r.type === 'SICK_LEAVE' ? 'Nghỉ ốm' : 'Không lương';
            return `| ${idx + 1} | **${r.staffName}** *(${r.role.toUpperCase()})* | ${bName} | ${r.startDate}${r.startDate !== r.endDate ? ` ➔ ${r.endDate}` : ''} | **${typeLabel}** - _${r.reason}_ | ${statusBadge} | ${r.aiRiskAssessment || '🟢 An toàn'} |`;
          }).join('\n');

      const systemPrompt = `Bạn là Trợ Lý AI HR (Chị 8 Hành Chính - Duyệt Phép PK88) của Chuỗi Phụ Kiện 88 (6 chi nhánh: Bến Tre 1, Bến Tre 2, Mỹ Tho, Vĩnh Long, Cần Thơ, Trà Vinh).
Người đang chat với bạn tên là: "${currentUser?.fullName || 'Nhân viên'}" (Vai trò/Chức vụ: "${currentUser?.role || 'sales'}", Chi nhánh công tác chính xác: "${branchName}").

QUY ĐỊNH XƯNG HÔ CHUẨN THEO VAI TRÒ (BẮT BUỘC CHÍNH XÁC 100%):
- Người đang chat có vai trò chính xác là: "${currentUser?.role || 'sales'}".
- Nếu vai trò là ADMIN (role === 'admin', ví dụ: Trần Hoàng Sang): Gọi người dùng là "Boss" hoặc "Sếp Sang", xưng "Em" hoặc "đứa con AI của Boss".
- Nếu vai trò là FOUNDER (role === 'founder', ví dụ: Ngô Hồng Thao): Gọi người dùng là "Sếp Thao" hoặc "Anh Thao", xưng "Em".
- Nếu vai trò là SALES hoặc TECHNICIAN (người dùng hiện tại: "${currentUser?.fullName}" có role là "${currentUser?.role}"): Đây là NHÂN VIÊN THƯỜNG. BẮT BUỘC gọi người dùng là "Em ${currentUser?.fullName || 'bạn'}" hoặc "Bạn ${currentUser?.fullName}", xưng "Chị" hoặc "Chị 8". TUYỆT ĐỐI KHÔNG ĐƯỢC GỌI SALES HOẶC KỸ THUẬT LÀ "SẾP"! (NGHIÊM CẤM gọi "Sếp Mỹ" khi người dùng là Sales).

DỮ LIỆU THỰC TẾ DANH SÁCH ĐƠN XIN NGHỈ PHÉP ĐANG CÓ TRÊN HỆ THỐNG (${leaveRequests.length} ĐƠN):
${leaveContextText}

QUY ĐỊNH KHI NÀO MỚI ĐƯỢC XUẤT BẢNG NGHỈ PHÉP (BẮT BUỘC CHÚ Ý):
1. CHỈ XUẤT BẢNG MARKDOWN DANH SÁCH ĐƠN PHÉP KHI VÀ CHỈ KHI người dùng HỎI TRỰC TIẾP về đơn nghỉ phép (Ví dụ: "ai đang nghỉ phép", "cho xem danh sách đơn phép", "báo cáo tình hình nghỉ phép tháng 10").
2. KHI NGƯỜI DÙNG HỎI CÂU KHÁC (như hỏi cách xưng hô, hỏi quy trình xin phép, chào hỏi, thắc mắc sao lại cho xem bảng...): Trả lời ĐÚNG TRỌNG TÂM câu hỏi đó một cách tự nhiên, lịch sự. TUYỆT ĐỐI KHÔNG TỰ Ý XỔ BẢNG MARKDOWN ĐƠN PHÉP RA KHI KHÔNG ĐƯỢC YÊU CẦU!
3. Khi xuất bảng nghỉ phép (khi được yêu cầu): Sử dụng BẢNG MARKDOWN chuẩn, KHÔNG dùng thẻ HTML thô như <br>.
4. Cuối bài báo cáo bảng (nếu có): Kèm 1 dòng "📊 **Thống kê:** X đơn Chờ duyệt | Y đơn Đã duyệt | Z đơn Từ chối".

QUY ĐỊNH TỰ ĐỘNG KHỞI TẠO VÀ GỬI ĐƠN NGHỈ PHÉP (AUTOMATED FUNCTION CALLING):
Khi người dùng muốn xin nghỉ phép (hoặc xác nhận/cung cấp ngày xin nghỉ, lý do xin nghỉ, người trực thay sau khi bạn hỏi):
1. Bạn phải phản hồi thân thiện, chu đáo.
2. BẮT BUỘC chèn thêm 1 khối JSON ở CUỐI CÂU TRẢ LỜI của bạn để hệ thống tự động bóc tách và nộp đơn trực tiếp vào Cơ Sở Dữ Liệu hệ thống:
\`\`\`json
{
  "action": "CREATE_LEAVE_REQUEST",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "type": "PAID_LEAVE",
  "reason": "Mô tả lý do nghỉ phép",
  "replacementStaffName": "Tên người trực thay (nếu có)"
}
\`\`\`
Lưu ý năm hiện tại là năm 2026 (ví dụ: ngày 10 đến 12 tháng 10 năm 2026 là startDate: "2026-10-10", endDate: "2026-10-12"). Loại nghỉ chọn trong 3 giá trị: "PAID_LEAVE" (Nghỉ phép năm), "SICK_LEAVE" (Nghỉ ốm), "UNPAID_LEAVE" (Nghỉ không lương).

QUY ĐỊNH MA TRẬN DUYỆT PHÉP THEO CHÍNH SÁCH CHUẨN:
- Nhân viên Sales & Kỹ thuật: Đơn gửi Cửa Hàng Trưởng (Manager) hoặc Khối HR duyệt.
- Manager trở lên: Đơn gửi Khối HR & Founder duyệt.
- Cấp thẩm quyền duyệt đơn của "${currentUser?.fullName}" (${currentUser?.role}) là: "${approverText}".

Nhiệm vụ của bạn:
1. Đọc kỹ câu hỏi của người dùng và trả lời ĐÚNG TRỌNG TÂM, xưng hô ĐÚNG CHỨC VỤ theo quy định trên.
2. Nếu người dùng xin nghỉ phép bằng câu nói tự nhiên: Trích xuất Ngày xin nghỉ, Loại nghỉ, Lý do, Người trực thay và BẮT BUỘC kèm khối JSON "action": "CREATE_LEAVE_REQUEST" để hệ thống tự tạo đơn!`;

      if (!apiKey) {
        // Fallback demo mode if no key
        const userSalutation = currentUser?.role === 'admin' ? `Boss **${currentUser?.fullName}**` : currentUser?.role === 'founder' ? `Anh **${currentUser?.fullName}**` : `em **${currentUser?.fullName}**`;
        setTimeout(() => {
          setChatMessages(prev => [
            ...prev,
            {
              role: 'ai',
              text: `*(Chế độ Demo AI)* Cảm ơn ${userSalutation}!\n\nTôi đã ghi nhận tin nhắn của bạn: "${userMsg}".`
            }
          ]);
          setIsAiLoading(false);
        }, 800);
        return;
      }

      // Format full multi-turn chat history so AI HR never forgets context
      const formattedHistory = chatMessages.map(msg => 
        msg.role === 'user' 
          ? `[NHÂN VIÊN ${currentUser?.fullName}]: "${msg.text}"` 
          : `[TRỢ LÝ AI HR CHỊ 8]: "${msg.text}"`
      ).join('\n\n');

      const userPromptWithHistory = `${systemPrompt}

LỊCH SỬ TRAO ĐỔI TRONG PHIÊN CHAT NÀY (ĐÃ DIỄN RA TỪ ĐẦU):
${formattedHistory}

TIN NHẮN MỚI NHẤT NHÂN VIÊN VỪA GỬI:
[NHÂN VIÊN ${currentUser?.fullName}]: "${userMsg}"

QUY TẮC BẮT BUỘC VỀ TRÍ NHỚ NỐI NỐI NGỮ CẢNH (CHAT CONTEXT PERSISTENCE):
1. ĐỌC KỸ TOÀN BỘ LỊCH SỬ CHAT TRÊN trước khi phản hồi.
2. TUYỆT ĐỐI KHÔNG ĐƯỢC HỎI LẠI những thông tin mà nhân viên ĐÃ NÓI TRONG CÁC TIN NHẮN TRƯỚC (Ví dụ: Ngày xin nghỉ phép, Lý do đi đâu/làm gì, Người trực thay).
3. Khi khởi tạo khối JSON "CREATE_LEAVE_REQUEST", phải tự động GOM TẤT CẢ THÔNG TIN nhân viên đã cung cấp từ đầu phiên chat đến giờ (ví dụ: ngày nghỉ 17, 18/10, lý do "đi ăn đám cưới ở Huế"). KHÔNG ĐƯỢC để lý do là "Chờ bổ sung lý do" khi nhân viên đã từng nói lý do ở các tin nhắn trước đó!`;

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${apiKey}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: userPromptWithHistory }] }
          ]
        })
      });

      const data = await res.json();
      let reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Xin lỗi, AI HR đang bận. Vui lòng thử lại!';

      // Inspect if response contains CREATE_LEAVE_REQUEST JSON block
      const jsonMatch = reply.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch && currentUser) {
        try {
          const parsed = JSON.parse(jsonMatch[1]);
          if (parsed.action === 'CREATE_LEAVE_REQUEST') {
            const todayStr = new Date().toISOString().split('T')[0];
            const start = parsed.startDate || todayStr;
            const end = parsed.endDate || start;
            
            const sameBranchRequests = leaveRequests.filter(r => r.branchId === currentUser.branchId && r.startDate === start && r.status === 'APPROVED');
            const riskText = sameBranchRequests.length > 0 
              ? `🟡 Cảnh báo nhẹ: Ngày ${start} tại chi nhánh đã có ${sameBranchRequests.length} nhân sự xin nghỉ.`
              : `🟢 An toàn: Ca trực ngày ${start} đủ nhân sự vận hành.`;

            const autoReq: LeaveRequest = {
              id: `leave-${Date.now()}`,
              staffId: currentUser.id,
              staffName: currentUser.fullName,
              phone: currentUser.phone,
              branchId: currentUser.branchId,
              role: currentUser.role,
              startDate: start,
              endDate: end,
              reason: parsed.reason || userMsg || 'Xin nghỉ phép qua AI HR',
              type: parsed.type || 'PAID_LEAVE',
              status: currentUser?.role === 'founder' ? 'APPROVED' : 'PENDING',
              approvedBy: currentUser?.role === 'founder' ? 'Tự duyệt (Founder)' : undefined,
              createdAt: new Date().toISOString(),
              replacementStaffName: parsed.replacementStaffName || undefined,
              aiRiskAssessment: riskText
            };

            // Trigger real state update
            onSubmitLeaveRequest(autoReq);

            // Clean JSON block and append confirmation banner
            reply = reply.replace(/```json\s*[\s\S]*?\s*```/g, '').trim();
            reply += `\n\n---\n✅ **AI HR ĐÃ TỰ ĐỘNG KHỞI TẠO VÀ GỬI ĐƠN NGHỈ PHÉP THÀNH CÔNG VÀO HỆ THỐNG!**\n- 📅 **Thời gian:** ${start} ${start !== end ? `đến ${end}` : ''}\n- 📝 **Lý do:** "${autoReq.reason}"\n- 🔄 **Trạng thái:** 🟡 **CHỜ DUYỆT** (Chuyển đến: **${approverText}**)\n\n*(Em/Boss có thể bấm sang tab **"Danh Sách Đơn Phép"** bên trên để xem đơn vừa được tạo nhé!)*`;
          }
        } catch (err) {
          console.error('Failed to auto-create leave request from AI chat:', err);
        }
      }

      setChatMessages(prev => [...prev, { role: 'ai', text: reply }]);
    } catch (err) {
      console.error('AI HR Error:', err);
      setChatMessages(prev => [...prev, { role: 'ai', text: '⚠️ Đã xảy ra lỗi khi kết nối AI HR. Bạn có thể sử dụng tab "Nộp Đơn Trực Tiếp" để gửi đơn nhé!' }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-3 md:p-6 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header Banner */}
        <div className="p-4 md:p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-rose-950/50 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 font-extrabold shadow-lg shadow-rose-500/10">
              <Bot className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-100">TRỢ LÝ AI HR & DUYỆT NGHỈ PHÉP TỰ ĐỘNG</h2>
                <span className="text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-full font-bold">
                  AI AGENT #5
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Chị 8 Hành Chính • Tự động hóa xin phép, duyệt đơn & khấu trừ lương</p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub Navigation */}
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/60 flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('chat')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeSubTab === 'chat'
                ? 'bg-rose-500 text-white font-extrabold shadow-md shadow-rose-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Chat với AI HR</span>
          </button>

          <button
            onClick={() => setActiveSubTab('list')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeSubTab === 'list'
                ? 'bg-cyan-500 text-slate-950 font-extrabold shadow-md'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Danh Sách Đơn Phép ({leaveRequests.length})</span>
          </button>

          {currentUser?.role !== 'founder' && (
            <button
              onClick={() => setActiveSubTab('form')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeSubTab === 'form'
                  ? 'bg-emerald-500 text-slate-950 font-extrabold shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Nộp Đơn Trực Tiếp</span>
            </button>
          )}
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-950/40">

          {/* TAB 1: CHAT VỚI AI HR */}
          {activeSubTab === 'chat' && (
            <div className="h-full flex flex-col justify-between space-y-4">
              <div className="flex-1 space-y-3 overflow-y-auto pr-2 max-h-[55vh]">
                {chatMessages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        msg.role === 'user'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>

                    <div
                      className={`p-3.5 rounded-2xl max-w-[95%] md:max-w-[85%] text-xs leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-cyan-950/80 text-cyan-100 border border-cyan-800/80 rounded-tr-none'
                          : 'bg-slate-900 text-slate-200 border border-slate-800 rounded-tl-none space-y-2'
                      }`}
                    >
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          table: ({ node, ...props }) => (
                            <div className="overflow-x-auto max-w-full my-3 rounded-xl border border-slate-700/80 bg-slate-950/90 shadow-lg scrollbar-thin scrollbar-thumb-slate-700">
                              <table className="w-full min-w-[620px] text-[11px] text-left border-collapse" {...props} />
                            </div>
                          ),
                          thead: ({ node, ...props }) => (
                            <thead className="bg-slate-800/90 text-rose-300 font-bold uppercase tracking-wider border-b border-slate-700" {...props} />
                          ),
                          th: ({ node, ...props }) => (
                            <th className="p-2.5 font-semibold text-slate-200 whitespace-nowrap" {...props} />
                          ),
                          td: ({ node, ...props }) => (
                            <td className="p-2.5 border-b border-slate-800/60 leading-normal align-middle text-slate-300" {...props} />
                          ),
                          hr: ({ node, ...props }) => (
                            <hr className="my-3 border-slate-800" {...props} />
                          ),
                          ul: ({ node, ...props }) => (
                            <ul className="list-disc list-inside my-1 space-y-1" {...props} />
                          ),
                          ol: ({ node, ...props }) => (
                            <ol className="list-decimal list-inside my-1 space-y-1" {...props} />
                          )
                        }}
                      >
                        {msg.text}
                      </ReactMarkdown>
                    </div>
                  </div>
                ))}
                {isAiLoading && (
                  <div className="flex items-center gap-2 text-xs text-rose-400 font-mono animate-pulse">
                    <Sparkles className="w-4 h-4" /> Trợ Lý AI HR đang đọc tin nhắn & quét ca trực...
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                <input
                  type="text"
                  value={userInput}
                  onChange={e => setUserInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ví dụ: Em bị sốt cao xin nghỉ ốm 1 ngày hôm nay 10/10/2026..."
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-100 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isAiLoading || !userInput.trim()}
                  className="px-4 py-3 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all flex items-center gap-2 text-xs"
                >
                  <Send className="w-4 h-4" /> Gửi
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: DANH SÁCH ĐƠN XIN NGHỈ PHÉP */}
          {activeSubTab === 'list' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Danh Sách Yêu Cầu Xin Nghỉ Phép ({leaveRequests.length})</h3>
                <span className="text-[11px] text-slate-500 font-mono">Dữ liệu tự động đồng bộ Bảng Lương</span>
              </div>

              {leaveRequests.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  Chưa có đơn xin nghỉ phép nào trên hệ thống.
                </div>
              ) : (
                <div className="space-y-3">
                  {leaveRequests.map(req => {
                    const branch = branches.find(b => b.id === req.branchId || b.code === req.branchId);
                    const branchMap: Record<string, string> = {
                      b1: 'Phụ Kiện 88 - Bến Tre 1 (HQ)',
                      b2: 'Phụ Kiện 88 - Bến Tre 2 (Tân Thành)',
                      b3: 'Phụ Kiện 88 - Mỹ Tho',
                      b4: 'Phụ Kiện 88 - Vĩnh Long',
                      b5: 'Phụ Kiện 88 - Cần Thơ',
                      b6: 'Phụ Kiện 88 - Trà Vinh'
                    };
                    const branchName = branch ? branch.name : (branchMap[req.branchId] || req.branchId);
                    
                    const isStaffLevel = req.role === 'sales' || req.role === 'technician';
                    const isUserFounderOrHR = currentUser?.role === 'founder' || currentUser?.role === 'hr';
                    const isUserManager = currentUser?.role === 'manager';
                    const isSameBranch = req.branchId === currentUser?.branchId;

                    // Phân quyền duyệt chuẩn:
                    // - Founder & HR được duyệt/từ chối tất cả đơn trên toàn hệ thống (trừ đơn chính mình)
                    // - Manager chỉ được duyệt/từ chối đơn của Sales & Technician CÙNG CHI NHÁNH MÌNH QUẢN LÝ
                    // - Marketing, TP Kinh Doanh (sales_head), Admin KHÔNG CÓ QUYỀN duyệt/từ chối
                    const canApprove = (
                      (isUserFounderOrHR || (isUserManager && isStaffLevel && isSameBranch)) &&
                      req.staffId !== currentUser?.id
                    );

                    return (
                      <div key={req.id} className="p-4 bg-slate-900/90 rounded-2xl border border-slate-800 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm text-slate-100">{req.staffName}</span>
                              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">{req.role}</span>
                              <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                                <Building className="w-3 h-3" />
                                {branchName}
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 mt-1.5">Lý do: <strong className="text-slate-100">"{req.reason}"</strong></p>
                          </div>

                          {/* Status Badge */}
                          <div>
                            {req.status === 'PENDING' && (
                              <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg text-xs font-bold flex items-center gap-1 font-mono">
                                <Clock className="w-3.5 h-3.5" /> CHỜ DUYỆT
                              </span>
                            )}
                            {req.status === 'APPROVED' && (
                              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg text-xs font-bold flex items-center gap-1 font-mono">
                                <CheckCircle2 className="w-3.5 h-3.5" /> ĐÃ DUYỆT
                              </span>
                            )}
                            {req.status === 'REJECTED' && (
                              <span className="px-3 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-lg text-xs font-bold flex items-center gap-1 font-mono">
                                <XCircle className="w-3.5 h-3.5" /> TỪ CHỐI
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Details */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px] bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 font-mono">
                          <div>
                            <span className="text-slate-500">Thời gian nghỉ:</span>{' '}
                            <strong className="text-cyan-400">{req.startDate} {req.startDate !== req.endDate ? `đến ${req.endDate}` : ''}</strong>
                          </div>
                          <div>
                            <span className="text-slate-500">Loại nghỉ:</span>{' '}
                            <strong className="text-slate-300">
                              {req.type === 'PAID_LEAVE' && 'Nghỉ Phép Năm (Có Lương)'}
                              {req.type === 'SICK_LEAVE' && 'Nghỉ Ốm Đột Xuất'}
                              {req.type === 'UNPAID_LEAVE' && 'Nghỉ Không Lương'}
                            </strong>
                          </div>
                          <div>
                            <span className="text-slate-500">Trực thay:</span>{' '}
                            <strong className="text-slate-300">{req.replacementStaffName || 'Không có'}</strong>
                          </div>
                        </div>

                        {/* Approver / Rejecter Log Info */}
                        {req.status === 'APPROVED' && (
                          <div className="text-[11px] bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-500/30 text-emerald-300 font-mono flex items-center justify-between">
                            <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-400" /> Người phê duyệt đơn:</span>
                            <strong className="text-emerald-200">{req.approvedBy || 'Ban Giám Đốc'}</strong>
                          </div>
                        )}

                        {req.status === 'REJECTED' && (
                          <div className="text-[11px] bg-rose-950/40 p-2.5 rounded-xl border border-rose-500/30 text-rose-300 font-mono flex items-center justify-between">
                            <span className="flex items-center gap-1.5"><XCircle className="w-4 h-4 text-rose-400" /> Người bấm từ chối đơn:</span>
                            <strong className="text-rose-200">{req.rejectedBy || req.approvedBy || 'Cửa Hàng Trưởng'}</strong>
                          </div>
                        )}

                        {/* AI Risk Assessment Box */}
                        {req.aiRiskAssessment && (
                          <div className="text-[11px] bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-slate-300 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                            <span>Đánh giá AI HR: {req.aiRiskAssessment}</span>
                          </div>
                        )}

                        {/* Actions for Manager/Admin */}
                        {canApprove && req.status === 'PENDING' && (
                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() => {
                                const handler = `${currentUser?.fullName} (${currentUser?.role ? currentUser.role.toUpperCase() : 'MANAGER'})`;
                                onUpdateLeaveStatus(req.id, 'APPROVED', handler);
                              }}
                              className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
                            >
                              <CheckCircle2 className="w-4 h-4" /> Duyệt Cho Nghỉ
                            </button>
                            <button
                              onClick={() => {
                                const handler = `${currentUser?.fullName} (${currentUser?.role ? currentUser.role.toUpperCase() : 'MANAGER'})`;
                                onUpdateLeaveStatus(req.id, 'REJECTED', handler);
                              }}
                              className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
                            >
                              <XCircle className="w-4 h-4" /> Từ Chối Đơn
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: NỘP ĐƠN TRỰC TIẾP */}
          {activeSubTab === 'form' && (
            <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>Form Nộp Đơn Xin Nghỉ Phép Trực Tiếp</span>
              </h3>

              <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-400 mb-1">Loại Nghỉ Phép</label>
                    <select
                      value={leaveType}
                      onChange={e => setLeaveType(e.target.value as LeaveType)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="PAID_LEAVE">Nghỉ Phép Năm (Hưởng Lương 100%)</option>
                      <option value="SICK_LEAVE">Nghỉ Ốm Đột Xuất</option>
                      <option value="UNPAID_LEAVE">Nghỉ Việc Riêng (Không Lương)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-400 mb-1">Nhân Sự Trực Thay (Nếu có)</label>
                    <input
                      type="text"
                      value={replacementStaff}
                      onChange={e => setReplacementStaff(e.target.value)}
                      placeholder="VD: Nguyễn Văn Minh (Thợ Kỹ Thuật)"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-400 mb-1">Từ Ngày</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-400 mb-1">Đến Ngày</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-400 mb-1">Lý Do Xin Nghỉ Chi Tiết</label>
                  <textarea
                    rows={3}
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder="Mô tả lý do xin nghỉ phép cụ thể..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/20 text-xs flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" /> Gửi Đơn Xin Nghỉ Phép Cho Manager/HR
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
