import React, { useState, useEffect, useMemo } from 'react';
import { Product, Staff, Branch, RepairTicket, POSOrder, POSCartItem, POSPaymentMethod } from '../types';
import { 
  ShoppingBag, Search, Plus, Minus, Trash2, Printer, CheckCircle2, 
  CreditCard, Banknote, QrCode, Sparkles, X, ChevronRight, ChevronLeft, History, 
  Receipt, ArrowRight, ShieldCheck, Tag, RefreshCw, RotateCcw, AlertTriangle
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface POSViewProps {
  currentUser: Staff;
  currentBranch?: Branch;
  branches: Branch[];
  onCreateOrder: (ticket: RepairTicket) => void;
  onUpdateOrder?: (ticketId: string, updates: Partial<RepairTicket>) => Promise<boolean>;
  tickets?: RepairTicket[];
}

export const POSView: React.FC<POSViewProps> = ({
  currentUser,
  currentBranch,
  branches = [],
  onCreateOrder,
  onUpdateOrder,
  tickets = []
}) => {
  // Staff branch detection
  const staffBranch = branches.find(b => b.id === currentUser?.branchId) || currentBranch || branches[0];

  // Products State
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Mobile View & Responsive UX
  const [mobileTab, setMobileTab] = useState<'PRODUCTS' | 'CART'>('PRODUCTS');
  const categoryScrollRef = React.useRef<HTMLDivElement>(null);

  // Pagination State for Product Grid (Eliminates ugly inner vertical scrollbar)
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 12;

  // Cart State
  const [cart, setCart] = useState<POSCartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<POSPaymentMethod>('CASH');
  const [orderNote, setOrderNote] = useState('');

  // Custom Item Modal
  const [showCustomItemModal, setShowCustomItemModal] = useState(false);
  const [customItemName, setCustomItemName] = useState('');
  const [customItemPrice, setCustomItemPrice] = useState('');
  const [customItemCategory, setCustomItemCategory] = useState('Phụ Kiện');

  // Receipt Modal State
  const [activeReceipt, setActiveReceipt] = useState<POSOrder | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Return & Refund State
  const [refundTargetOrder, setRefundTargetOrder] = useState<POSOrder | null>(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundActionType, setRefundActionType] = useState<'REFUND' | 'EXCHANGE'>('REFUND');
  const [refundReason, setRefundReason] = useState('Lỗi kỹ thuật / Lỗi NSX (Đổi mới / Hoàn tiền)');
  const [refundMethod, setRefundMethod] = useState<'CASH' | 'TRANSFER'>('CASH');
  const [refundNote, setRefundNote] = useState('');

  // Local POS Orders history
  const [posOrders, setPosOrders] = useState<POSOrder[]>(() => {
    const cached = localStorage.getItem('pk88_pos_orders');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  // Fetch products from Supabase
  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('category', { ascending: true });
      if (data && !error) {
        setProducts(data);
      }
    } catch (err) {
      console.error('Fetch products error:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Synchronize orders between Supabase tickets and local state
  useEffect(() => {
    if (tickets && tickets.length > 0) {
      const posTicketsFromDb = tickets.filter(
        t => t.code.startsWith('PK88-POS-') || t.serviceType === 'Bán Hàng & Dịch Vụ Nhanh (POS)'
      );

      setPosOrders(prev => {
        const map = new Map<string, POSOrder>();
        prev.forEach(o => map.set(o.code, o));

        posTicketsFromDb.forEach(t => {
          const existing = map.get(t.code);
          const branchObj = branches.find(b => b.id === t.branchId);
          if (existing) {
            map.set(t.code, {
              ...existing,
              id: t.id,
              status: (t.status === 'REFUNDED' ? 'REFUNDED' : 'DELIVERED') as any,
              totalAmount: t.price,
              branchName: branchObj?.name || existing.branchName
            });
          } else {
            map.set(t.code, {
              id: t.id,
              code: t.code,
              branchId: t.branchId,
              branchName: branchObj?.name || 'Phụ Kiện 88',
              cashierId: t.createdByStaffId || '',
              cashierName: t.technicianName || t.createdByStaffName || 'Nhân sự',
              customerName: t.customerName,
              customerPhone: t.customerPhone,
              items: [{
                product: { id: `item-${t.id}`, name: t.deviceModel, price: t.price, category: 'Phụ Kiện' },
                quantity: 1,
                price: t.price
              }],
              totalAmount: t.price,
              paymentMethod: 'CASH',
              status: (t.status === 'REFUNDED' ? 'REFUNDED' : 'DELIVERED') as any,
              createdAt: t.createdAt
            });
          }
        });

        const merged = Array.from(map.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        return merged;
      });
    }
  }, [tickets, branches]);

  // Category tags
  const CATEGORIES = [
    { id: 'ALL', label: 'Tất Cả' },
    { id: 'PIN_DU_PHONG', label: 'Pin Dự Phòng', match: ['pin dự phòng', 'sạc dự phòng', 'powerbank'] },
    { id: 'DAN_KINH_PPF', label: 'Cường Lực / PPF', match: ['cường lực', 'ppf', 'dán'] },
    { id: 'LENS_CAMERA', label: 'Lens Camera', match: ['lens', 'camera', 'sapphire'] },
    { id: 'CAP_CU_SAC', label: 'Cáp / Củ Sạc', match: ['cáp', 'củ sạc', 'dây sạc', 'sạc nhanh', 'magsafe'] },
    { id: 'TAI_NGHE_LOA', label: 'Tai Nghe / Loa', match: ['tai nghe', 'airpods', 'loa', 'headphone'] },
    { id: 'OP_LUNG', label: 'Ốp Lưng / Bao Da', match: ['ốp', 'case', 'bao da'] },
    { id: 'DICH_VU_NHANH', label: 'Dịch Vụ Lấy Ngay', match: ['vệ sinh', 'dán', 'chuyển dữ liệu'] }
  ];

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const pName = (p.name || '').toLowerCase();
      const pCat = (p.category || '').toLowerCase();
      const pBrand = (p.brand || '').toLowerCase();
      const s = searchTerm.toLowerCase();

      const matchSearch = !s || pName.includes(s) || pCat.includes(s) || pBrand.includes(s);
      if (!matchSearch) return false;

      if (selectedCategory === 'ALL') return true;
      const catConfig = CATEGORIES.find(c => c.id === selectedCategory);
      if (!catConfig?.match) return true;

      return catConfig.match.some(keyword => pName.includes(keyword) || pCat.includes(keyword));
    });
  }, [products, searchTerm, selectedCategory]);

  // Reset to page 1 whenever category or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      const offset = direction === 'left' ? -220 : 220;
      categoryScrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  // Cart operations
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1, price: product.price }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      return prev
        .map(item => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as POSCartItem[];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setOrderNote('');
  };

  const addCustomItem = () => {
    if (!customItemName.trim() || !customItemPrice) return;
    const priceNum = Number(customItemPrice.replace(/\D/g, '')) || 0;
    const customProduct: Product = {
      id: `custom-${Date.now()}`,
      name: customItemName.trim(),
      category: customItemCategory,
      price: priceNum,
      brand: 'Phụ Kiện 88'
    };
    addToCart(customProduct);
    setCustomItemName('');
    setCustomItemPrice('');
    setShowCustomItemModal(false);
  };

  // Calculations
  const totalAmount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const totalItemsCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // Checkout Handler (INSTANT FINISH & INVOICE GENERATION)
  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('Vui lòng chọn ít nhất 1 sản phẩm vào đơn hàng!');
      return;
    }

    const orderCode = `PK88-POS-${Math.floor(1000 + Math.random() * 9000)}`;
    const itemsSummary = cart.map(i => `${i.product.name} (x${i.quantity})`).join(', ');

    // 1. Create POS Order object
    const newPosOrder: POSOrder = {
      id: `pos-${Date.now()}`,
      code: orderCode,
      branchId: staffBranch?.id || 'b1',
      branchName: staffBranch?.name || 'Phụ Kiện 88',
      cashierId: currentUser.id,
      cashierName: currentUser.fullName,
      customerName: customerName.trim() || 'Khách Lẻ',
      customerPhone: customerPhone.trim() || 'Tại Quầy',
      items: [...cart],
      totalAmount,
      paymentMethod,
      createdAt: new Date().toISOString(),
      note: orderNote.trim()
    };

    // 2. Persist to local state & localStorage
    const updatedOrders = [newPosOrder, ...posOrders];
    setPosOrders(updatedOrders);
    localStorage.setItem('pk88_pos_orders', JSON.stringify(updatedOrders.slice(0, 100)));

    // 3. Sync to Supabase as DELIVERED ticket (instantly counted towards revenue & staff KPI)
    const posTicket: RepairTicket = {
      id: `t-pos-${Date.now()}`,
      code: orderCode,
      branchId: staffBranch?.id || 'b1',
      customerName: customerName.trim() || 'Khách Lẻ',
      customerPhone: customerPhone.trim() || 'Tại Quầy',
      deviceModel: itemsSummary.length > 100 ? `${cart[0].product.name} (+${cart.length - 1} món khác)` : itemsSummary,
      serviceType: 'Bán Hàng & Dịch Vụ Nhanh (POS)',
      status: 'DELIVERED', // Xong ngay lập tức tại quầy!
      price: totalAmount,
      createdAt: new Date().toISOString(),
      technicianName: currentUser.fullName,
      createdByStaffId: currentUser.id,
      createdByStaffName: currentUser.fullName
    };
    onCreateOrder(posTicket);

    // 4. Open Receipt Modal for immediate printing
    setActiveReceipt(newPosOrder);
    setShowReceiptModal(true);

    // 5. Reset form
    clearCart();
  };

  // Today POS statistics (Excludes REFUNDED orders)
  const todayStr = new Date().toISOString().split('T')[0];
  const todayOrders = posOrders.filter(o => o.createdAt.startsWith(todayStr));
  const activeOrders = todayOrders.filter(o => o.status !== 'REFUNDED' && o.status !== 'CANCELLED');
  const todayRevenue = activeOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const refundedCount = todayOrders.filter(o => o.status === 'REFUNDED').length;

  // Handle return & refund
  const handleConfirmRefund = async () => {
    if (!refundTargetOrder) return;

    try {
      // 1. Update status = 'REFUNDED' in Supabase repair_tickets
      if (onUpdateOrder) {
        await onUpdateOrder(refundTargetOrder.id, { status: 'REFUNDED' });
      } else {
        await supabase.from('repair_tickets').update({ status: 'REFUNDED' }).eq('code', refundTargetOrder.code);
      }

      // 2. Update local state & localStorage
      const updated = posOrders.map(o => {
        if (o.code === refundTargetOrder.code || o.id === refundTargetOrder.id) {
          return {
            ...o,
            status: 'REFUNDED' as const,
            refundReason,
            refundedAt: new Date().toISOString(),
            refundedBy: currentUser.fullName
          };
        }
        return o;
      });
      setPosOrders(updated);
      localStorage.setItem('pk88_pos_orders', JSON.stringify(updated.slice(0, 100)));

      if (refundActionType === 'EXCHANGE') {
        setCustomerName(refundTargetOrder.customerName || '');
        setCustomerPhone(refundTargetOrder.customerPhone || '');
        setOrderNote(`Đổi từ đơn ${refundTargetOrder.code} (-${refundTargetOrder.totalAmount.toLocaleString('vi-VN')}đ)`);
        setShowRefundModal(false);
        alert(`✅ Đã ghi nhận đổi hàng cho đơn ${refundTargetOrder.code}! Bạn hãy chọn món mới vào giỏ hàng để hoàn tất đơn đổi bù trừ.`);
        return;
      }

      setShowRefundModal(false);
      alert(`✅ Đã hoàn tất hoàn tiền cho đơn ${refundTargetOrder.code}! Doanh thu chi nhánh và KPI nhân viên đã được tự động giảm trừ ${refundTargetOrder.totalAmount.toLocaleString('vi-VN')} đ.`);
    } catch (e: any) {
      alert('Lỗi xử lý hoàn tiền: ' + e.message);
    }
  };

  return (
    <div className="space-y-5">
      {/* POS Top Header Banner */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-purple-500/10 border border-amber-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shadow-lg shadow-amber-500/10">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-extrabold text-slate-100 uppercase tracking-wide">
                Bán Hàng & Dịch Vụ Nhanh (POS)
              </h2>
              <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Thanh Toán & In Bill Lấy Ngay
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Phụ kiện, pin dự phòng, dán cường lực, PPF, lens camera... Hoàn tất trong 30 giây & tự động tính KPI bán hàng.
            </p>
          </div>
        </div>

        {/* Staff & Branch Badges */}
        <div className="flex items-center gap-2 self-stretch md:self-auto justify-between md:justify-end">
          <div className="bg-slate-900/90 border border-slate-800 px-3 py-2 rounded-2xl text-left">
            <div className="text-[10px] text-slate-400">Chi nhánh bán:</div>
            <div className="text-xs font-bold text-amber-400 font-mono">📍 {staffBranch?.name || 'Phụ Kiện 88'}</div>
          </div>
          <div className="bg-slate-900/90 border border-slate-800 px-3 py-2 rounded-2xl text-left">
            <div className="text-[10px] text-slate-400">Thu ngân / KPI:</div>
            <div className="text-xs font-bold text-emerald-400 font-mono">👤 {currentUser.fullName}</div>
          </div>
        </div>
      </div>

      {/* POS Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/80 border border-slate-800/80 p-3.5 rounded-2xl">
          <span className="text-[10px] text-slate-400 font-medium block">Doanh Thu Thực Hôm Nay</span>
          <span className="text-base font-bold font-mono text-emerald-400 mt-1 block">
            {todayRevenue.toLocaleString('vi-VN')} đ
          </span>
        </div>
        <div className="bg-slate-900/80 border border-slate-800/80 p-3.5 rounded-2xl">
          <span className="text-[10px] text-slate-400 font-medium block">Số Đơn Hoàn Tất</span>
          <span className="text-base font-bold font-mono text-sky-400 mt-1 block">
            {activeOrders.length} đơn
          </span>
        </div>
        <div className="bg-slate-900/80 border border-slate-800/80 p-3.5 rounded-2xl">
          <span className="text-[10px] text-slate-400 font-medium block">Đơn Đã Đổi Trả</span>
          <span className="text-base font-bold font-mono text-rose-400 mt-1 block">
            {refundedCount} đơn
          </span>
        </div>
        <div className="bg-slate-900/80 border border-slate-800/80 p-3.5 rounded-2xl">
          <span className="text-[10px] text-slate-400 font-medium block">Sản Phẩm Trong Kho</span>
          <span className="text-base font-bold font-mono text-amber-400 mt-1 block">
            {products.length} mã
          </span>
        </div>
      </div>

      {/* Mobile Screen Switcher (Tabs for small screens) */}
      <div className="lg:hidden flex items-center p-1 bg-slate-900 border border-slate-800 rounded-2xl">
        <button
          type="button"
          onClick={() => setMobileTab('PRODUCTS')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            mobileTab === 'PRODUCTS'
              ? 'bg-amber-500 text-slate-950 font-extrabold shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Danh Mục ({filteredProducts.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('CART')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer relative ${
            mobileTab === 'CART'
              ? 'bg-amber-500 text-slate-950 font-extrabold shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Giỏ Hàng</span>
          {totalItemsCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white font-mono text-[10px] font-bold">
              {totalItemsCount}
            </span>
          )}
        </button>
      </div>

      {/* Main POS Interface (Catalog on Left 65%, Cart on Right 35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* LEFT COLUMN: Product Catalog (7 Cols on desktop, toggleable on mobile) */}
        <div className={`lg:col-span-7 space-y-3.5 ${mobileTab === 'CART' ? 'hidden lg:block' : 'block'}`}>
          {/* Search Bar & Custom Item Button */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Gõ tên sản phẩm (Wiwu, URR, Remax, Hoco, Cường lực, Lens...)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-200 focus:outline-none focus:border-amber-500 transition-colors"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              onClick={() => setShowCustomItemModal(true)}
              className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/30 rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer flex-shrink-0"
              title="Thêm món ngoài danh mục"
            >
              <Plus className="w-4 h-4" />
              <span>+ Món Ngoài</span>
            </button>
          </div>

          {/* Category Filter Chips with Smooth Arrow Controls (No native scrollbar) */}
          <div className="relative flex items-center group/cat">
            {/* Left Scroll Arrow (Desktop) */}
            <button
              type="button"
              onClick={() => scrollCategories('left')}
              className="hidden md:flex absolute -left-2 z-10 w-7 h-7 items-center justify-center rounded-full bg-slate-850 hover:bg-amber-500 text-slate-300 hover:text-slate-950 border border-slate-700 shadow-xl cursor-pointer transition-all active:scale-90"
              title="Cuộn sang trái"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Chips Scrollable Container with NO SCROLLBAR */}
            <div 
              ref={categoryScrollRef}
              className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth px-1 py-1 w-full"
            >
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setCurrentPage(1);
                  }}
                  className={`text-[11px] px-3.5 py-1.5 rounded-xl border whitespace-nowrap font-medium transition-all cursor-pointer flex-shrink-0 ${
                    selectedCategory === cat.id
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-md shadow-amber-500/20'
                      : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Right Scroll Arrow (Desktop) */}
            <button
              type="button"
              onClick={() => scrollCategories('right')}
              className="hidden md:flex absolute -right-2 z-10 w-7 h-7 items-center justify-center rounded-full bg-slate-850 hover:bg-amber-500 text-slate-300 hover:text-slate-950 border border-slate-700 shadow-xl cursor-pointer transition-all active:scale-90"
              title="Cuộn sang phải"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Product Cards Grid with Pagination (No inner vertical scrollbar & No scroll-trap) */}
          <div className="bg-slate-900/40 border border-slate-800/80 p-3.5 rounded-3xl min-h-[480px] flex flex-col justify-between">
            {loadingProducts ? (
              <div className="py-24 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
                <span className="text-xs">Đang tải danh mục sản phẩm từ Supabase...</span>
              </div>
            ) : paginatedProducts.length > 0 ? (
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {paginatedProducts.map(product => {
                    const inCart = cart.find(c => c.product.id === product.id);
                    return (
                      <div
                        key={product.id}
                        onClick={() => addToCart(product)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group hover:border-amber-500/60 hover:shadow-lg hover:shadow-amber-500/5 ${
                          inCart
                            ? 'bg-amber-500/10 border-amber-500/40'
                            : 'bg-slate-900/90 border-slate-800/80 hover:bg-slate-850'
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-1.5 mb-1.5">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-950 text-slate-400 border border-slate-800 truncate max-w-[120px]">
                              {product.category || 'Phụ Kiện'}
                            </span>
                            {product.brand && (
                              <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider">
                                {product.brand}
                              </span>
                            )}
                          </div>
                          <h4 className="text-xs font-bold text-slate-100 group-hover:text-amber-300 transition-colors line-clamp-2 leading-snug">
                            {product.name}
                          </h4>
                        </div>

                        <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-800/60">
                          <span className="text-xs font-bold font-mono text-emerald-400">
                            {product.price.toLocaleString('vi-VN')} đ
                          </span>
                          <div className="flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 group-hover:bg-amber-500 group-hover:text-slate-950 transition-all">
                            <Plus className="w-3.5 h-3.5" />
                            <span>{inCart ? `x${inCart.quantity}` : 'Thêm'}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Elegant Pagination Bar (Eliminates vertical scrollbar) */}
                {filteredProducts.length > ITEMS_PER_PAGE && (
                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800/80 text-xs flex-wrap gap-2">
                    <div className="text-slate-400 text-[11px]">
                      Sản phẩm <span className="font-mono font-bold text-slate-200">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> - <span className="font-mono font-bold text-slate-200">{Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)}</span> / <span className="font-mono font-bold text-amber-400">{filteredProducts.length}</span> món
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 flex items-center gap-1 font-medium transition-all cursor-pointer"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Trước</span>
                      </button>
                      
                      <span className="px-3 py-1 font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs">
                        Trang {currentPage} / {totalPages}
                      </span>

                      <button
                        type="button"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800 flex items-center gap-1 font-medium transition-all cursor-pointer"
                      >
                        <span className="hidden sm:inline">Sau</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-24 text-center text-slate-500">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs font-bold text-slate-400">Không tìm thấy sản phẩm nào phù hợp</p>
                <p className="text-[11px] text-slate-600 mt-0.5">Thử tìm bằng từ khóa khác hoặc bấm "+ Món Ngoài"</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Cart & Superfast Checkout (5 Cols on desktop, toggleable on mobile) */}
        <div className={`lg:col-span-5 space-y-3.5 ${mobileTab === 'PRODUCTS' ? 'hidden lg:block' : 'block'}`}>
          {/* Mobile Back to Products Button */}
          <button
            type="button"
            onClick={() => setMobileTab('PRODUCTS')}
            className="lg:hidden w-full py-2 px-3 bg-slate-900/90 border border-slate-800 rounded-2xl text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center justify-center gap-1.5 transition-all mb-1 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Tiếp tục chọn thêm sản phẩm</span>
          </button>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-2xl flex flex-col justify-between min-h-[580px]">
            <div>
              {/* Cart Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                    {totalItemsCount}
                  </div>
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-100 uppercase tracking-wide">
                      Đơn Hàng Hiện Tại
                    </h3>
                    <span className="text-[10px] text-slate-400">Khách mua tại quầy</span>
                  </div>
                </div>
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Xóa hết</span>
                  </button>
                )}
              </div>

              {/* Cart Items List */}
              <div className="mt-3 space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                {cart.length > 0 ? (
                  cart.map(item => (
                    <div
                      key={item.product.id}
                      className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between gap-2"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-200 truncate">{item.product.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {item.price.toLocaleString('vi-VN')} đ
                        </div>
                      </div>

                      {/* Quantity Controller */}
                      <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
                        <button
                          onClick={() => updateQuantity(item.product.id, -1)}
                          className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold font-mono px-1 text-amber-400">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, 1)}
                          className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Subtotal & Delete */}
                      <div className="text-right flex items-center gap-2">
                        <span className="text-xs font-bold font-mono text-emerald-400">
                          {(item.price * item.quantity).toLocaleString('vi-VN')} đ
                        </span>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-slate-600 hover:text-rose-400 p-1 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-slate-600">
                    <ShoppingBag className="w-8 h-8 mx-auto mb-1.5 opacity-30" />
                    <p className="text-xs font-medium">Giỏ hàng đang trống</p>
                    <p className="text-[10px] mt-0.5">Bấm vào các sản phẩm bên trái để thêm vào đơn</p>
                  </div>
                )}
              </div>

              {/* Customer Info (Optional for Warranty / Loyalty) */}
              <div className="mt-3.5 pt-3 border-t border-slate-800 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                  Thông Tin Khách Hàng (Tùy chọn - Kích hoạt bảo hành):
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Tên khách (VD: Anh Minh)..."
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                  />
                  <input
                    type="text"
                    placeholder="SĐT (VD: 0912...)..."
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                  />
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="mt-3.5 pt-3 border-t border-slate-800 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                  Hình Thức Thanh Toán:
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CASH')}
                    className={`py-2 px-2 rounded-xl text-[11px] font-bold border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      paymentMethod === 'CASH'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <Banknote className="w-4 h-4 text-amber-400" />
                    <span>Tiền Mặt</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('TRANSFER')}
                    className={`py-2 px-2 rounded-xl text-[11px] font-bold border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      paymentMethod === 'TRANSFER'
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <QrCode className="w-4 h-4 text-cyan-400" />
                    <span>Chuyển Khoản</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CARD')}
                    className={`py-2 px-2 rounded-xl text-[11px] font-bold border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                      paymentMethod === 'CARD'
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-purple-400" />
                    <span>Quẹt Thẻ</span>
                  </button>
                </div>

                {paymentMethod === 'TRANSFER' && totalAmount > 0 && (
                  <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-lg p-0.5 flex items-center justify-center flex-shrink-0">
                      <QrCode className="w-8 h-8 text-slate-900" />
                    </div>
                    <div className="text-[10px] text-cyan-200 space-y-0.5">
                      <div className="font-bold">VietQR Chuyển Khoản Nhanh:</div>
                      <div>STK: <strong className="text-white font-mono">0888.888.888</strong> (MB Bank)</div>
                      <div>Số tiền: <strong className="text-amber-300 font-mono">{totalAmount.toLocaleString('vi-VN')} đ</strong></div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Total Calculation & Checkout CTA Button */}
            <div className="pt-4 border-t border-slate-800 space-y-3 mt-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Tổng thanh toán:</span>
                <span className="text-xl font-extrabold font-mono text-emerald-400 tracking-tight">
                  {totalAmount.toLocaleString('vi-VN')} đ
                </span>
              </div>

              <button
                type="button"
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className={`w-full py-3.5 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer ${
                  cart.length > 0
                    ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-pink-500 hover:from-amber-400 hover:to-pink-400 text-white shadow-amber-500/20 active:scale-[0.98]'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                }`}
              >
                <Receipt className="w-4 h-4" />
                <span>⚡ Thanh Toán & In Bill (Xong Ngay)</span>
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Mobile Floating Cart Summary Button (Quick checkout on phone) */}
      {cart.length > 0 && mobileTab === 'PRODUCTS' && (
        <div className="lg:hidden fixed bottom-4 inset-x-4 z-40 animate-in fade-in slide-in-from-bottom duration-200">
          <button
            type="button"
            onClick={() => setMobileTab('CART')}
            className="w-full bg-gradient-to-r from-amber-500 via-rose-500 to-amber-600 text-white font-black p-3.5 rounded-2xl shadow-2xl flex items-center justify-between border border-amber-300/40 active:scale-[0.98] transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2.5 text-left">
              <div className="w-9 h-9 rounded-xl bg-slate-950/60 flex items-center justify-center font-mono font-bold text-xs text-amber-300 border border-white/10">
                {totalItemsCount}
              </div>
              <div>
                <div className="text-[11px] font-medium text-amber-100">Đã chọn {totalItemsCount} món hàng</div>
                <div className="text-sm font-extrabold font-mono text-white">
                  {totalAmount.toLocaleString('vi-VN')} đ
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-950 text-amber-400 px-3.5 py-2 rounded-xl text-xs font-extrabold shadow-lg">
              <span>Xem Giỏ & Tính Tiền</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}


      {/* RECENT POS ORDERS SECTION */}
      <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-3xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wide">
              Lịch Sử Đơn Bán Lẻ Gần Nhất Tại Chi Nhánh
            </h3>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            {todayOrders.length} đơn hoàn tất hôm nay
          </span>
        </div>

        {posOrders.length > 0 ? (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase font-mono">
                  <th className="py-2.5 px-3">Mã Đơn</th>
                  <th className="py-2.5 px-3">Thời Gian</th>
                  <th className="py-2.5 px-3">Khách Hàng</th>
                  <th className="py-2.5 px-3">Chi Tiết Sản Phẩm</th>
                  <th className="py-2.5 px-3">Thanh Toán</th>
                  <th className="py-2.5 px-3">Tổng Tiền</th>
                  <th className="py-2.5 px-3">Thu Ngân</th>
                  <th className="py-2.5 px-3 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {posOrders.slice(0, 10).map(order => (
                  <tr key={order.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-mono font-bold text-amber-400">{order.code}</td>
                    <td className="py-2.5 px-3 text-slate-400">
                      {new Date(order.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-200">
                      {order.customerName} {order.customerPhone && order.customerPhone !== 'Tại Quầy' ? `(${order.customerPhone})` : ''}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 max-w-xs truncate">
                      {order.items.map(i => `${i.product.name} (x${i.quantity})`).join(', ')}
                    </td>
                    <td className="py-2.5 px-3">
                      {order.status === 'REFUNDED' ? (
                        <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          Đã Hoàn Tiền
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-slate-800 text-slate-300 border border-slate-700">
                          {order.paymentMethod === 'CASH' ? 'Tiền mặt' : (order.paymentMethod === 'TRANSFER' ? 'Chuyển khoản' : 'Thẻ')}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold">
                      <span className={order.status === 'REFUNDED' ? 'text-slate-500 line-through text-[11px]' : 'text-emerald-400'}>
                        {order.totalAmount.toLocaleString('vi-VN')} đ
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">{order.cashierName}</td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setActiveReceipt(order);
                            setShowReceiptModal(true);
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                          title="In lại hóa đơn"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        {order.status !== 'REFUNDED' ? (
                          <button
                            onClick={() => {
                              setRefundTargetOrder(order);
                              setRefundReason('Lỗi kỹ thuật / Lỗi NSX (Đổi mới / Hoàn tiền)');
                              setRefundNote('');
                              setShowRefundModal(true);
                            }}
                            className="px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/30 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                            title="Xử lý đổi trả hoặc hoàn tiền cho khách"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Đổi trả</span>
                          </button>
                        ) : (
                          <span className="text-[10px] font-mono text-rose-400/80 italic">
                            Đã hủy/hoàn
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-500 text-xs">
            Chưa có đơn bán lẻ nào hôm nay. Chọn sản phẩm bên trên để tạo đơn bán đầu tiên!
          </div>
        )}
      </div>

      {/* CUSTOM ITEM MODAL */}
      {showCustomItemModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 max-w-md w-full shadow-2xl space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Tag className="w-4 h-4 text-amber-400" />
                <span>+ Thêm Sản Phẩm / Dịch Vụ Nhanh Ngoài Danh Mục</span>
              </h4>
              <button 
                onClick={() => setShowCustomItemModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Tên món / Dịch vụ:</label>
                <input
                  type="text"
                  placeholder="VD: Dán PPF Viền Máy, Miếng Dán Skin 3M..."
                  value={customItemName}
                  onChange={(e) => setCustomItemName(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Đơn giá (VNĐ):</label>
                <input
                  type="number"
                  placeholder="VD: 150000"
                  value={customItemPrice}
                  onChange={(e) => setCustomItemPrice(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Danh mục:</label>
                <select
                  value={customItemCategory}
                  onChange={(e) => setCustomItemCategory(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                >
                  <option value="Dịch Vụ Nhanh">Dịch Vụ Nhanh Tại Quầy</option>
                  <option value="Phụ Kiện">Phụ Kiện Khác</option>
                  <option value="Cường Lực / PPF">Dán Màn Hình / PPF</option>
                  <option value="Lens Camera">Lens Bảo Vệ Camera</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowCustomItemModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={addCustomItem}
                disabled={!customItemName.trim() || !customItemPrice}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs"
              >
                Thêm Vào Giỏ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINTABLE RECEIPT / BILL MODAL (K80 Standard) */}
      {showReceiptModal && activeReceipt && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            
            {/* Action Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Đã Hoàn Tất Giao Dịch
              </span>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable Receipt Paper Container */}
            <div 
              id="pk88-receipt-print"
              className="bg-white text-slate-900 p-5 rounded-2xl shadow-inner font-mono text-[11px] leading-relaxed space-y-3"
            >
              <div className="text-center pb-2 border-b border-dashed border-slate-300">
                <h4 className="font-extrabold text-sm uppercase tracking-wide text-slate-950">
                  PHỤ KIỆN 88
                </h4>
                <p className="text-[10px] text-slate-600 mt-0.5">Hệ Thống Phụ Kiện & Dịch Vụ Công Nghệ</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{activeReceipt.branchName}</p>
                <p className="text-[10px] text-slate-500">Hotline: 0888.888.888</p>
                <div className="my-2 border-t border-dashed border-slate-300"></div>
                <h5 className="font-extrabold text-xs uppercase text-slate-800">HÓA ĐƠN BÁN LẺ</h5>
                <p className="text-[10px] text-slate-500 font-bold mt-0.5">{activeReceipt.code}</p>
              </div>

              <div className="space-y-1 text-[10px] text-slate-700 pb-2 border-b border-dashed border-slate-300">
                <div className="flex justify-between">
                  <span>Ngày giờ:</span>
                  <span className="font-bold">{new Date(activeReceipt.createdAt).toLocaleString('vi-VN')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Thu ngân:</span>
                  <span className="font-bold">{activeReceipt.cashierName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Khách hàng:</span>
                  <span className="font-bold">{activeReceipt.customerName}</span>
                </div>
                {activeReceipt.customerPhone && activeReceipt.customerPhone !== 'Tại Quầy' && (
                  <div className="flex justify-between">
                    <span>Số điện thoại:</span>
                    <span className="font-bold">{activeReceipt.customerPhone}</span>
                  </div>
                )}
              </div>

              {/* Items Table */}
              <div className="space-y-1.5 py-1">
                <div className="flex justify-between font-bold text-[10px] text-slate-900 border-b border-slate-200 pb-1">
                  <span>Tên Hàng</span>
                  <span>SL x Đ.Giá</span>
                  <span className="text-right">T.Tiền</span>
                </div>
                {activeReceipt.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start text-[10px]">
                    <div className="w-[50%] pr-1 truncate font-medium text-slate-900">
                      {item.product.name}
                    </div>
                    <div className="w-[25%] text-slate-600 text-center">
                      {item.quantity} x {item.price.toLocaleString('vi-VN')}
                    </div>
                    <div className="w-[25%] text-right font-bold text-slate-900">
                      {(item.price * item.quantity).toLocaleString('vi-VN')}
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="pt-2 border-t border-dashed border-slate-300 space-y-1 text-[10px]">
                <div className="flex justify-between text-xs font-extrabold text-slate-950 pt-1">
                  <span>TỔNG THANH TOÁN:</span>
                  <span className="text-sm">{activeReceipt.totalAmount.toLocaleString('vi-VN')} đ</span>
                </div>
                <div className="flex justify-between text-slate-600 pt-0.5">
                  <span>Hình thức:</span>
                  <span className="font-bold text-slate-800">
                    {activeReceipt.paymentMethod === 'CASH' ? 'Tiền mặt' : (activeReceipt.paymentMethod === 'TRANSFER' ? 'Chuyển khoản' : 'Thẻ')}
                  </span>
                </div>
              </div>

              {/* Footer / QR / Policy */}
              <div className="text-center pt-3 border-t border-dashed border-slate-300 space-y-1 text-[9px] text-slate-500">
                <div className="w-16 h-16 mx-auto bg-slate-100 rounded-lg p-1 border border-slate-200 flex items-center justify-center">
                  <QrCode className="w-14 h-14 text-slate-900" />
                </div>
                <p className="font-bold text-slate-700">Quét mã QR để kích hoạt Bảo Hành Điện Tử</p>
                <p>Cảm ơn Quý khách & Hẹn gặp lại!</p>
              </div>
            </div>

            {/* Print CTA */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold rounded-2xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                <Printer className="w-4 h-4" />
                <span>In Hóa Đơn (K80)</span>
              </button>

              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-xs font-semibold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RETURN & REFUND MODAL */}
      {showRefundModal && refundTargetOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-100 uppercase tracking-wide">
                    Xử Lý Đổi Trả & Hoàn Tiền
                  </h4>
                  <span className="text-[10px] font-mono text-amber-400 font-bold">{refundTargetOrder.code}</span>
                </div>
              </div>
              <button
                onClick={() => setShowRefundModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Target Order Summary */}
            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Khách hàng:</span>
                <span className="font-bold text-slate-200">
                  {refundTargetOrder.customerName} {refundTargetOrder.customerPhone ? `(${refundTargetOrder.customerPhone})` : ''}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Sản phẩm:</span>
                <span className="font-bold text-slate-200 max-w-[220px] truncate text-right">
                  {refundTargetOrder.items.map(i => `${i.product.name} (x${i.quantity})`).join(', ')}
                </span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-800">
                <span className="text-slate-400">Tổng giá trị đơn:</span>
                <span className="font-mono font-extrabold text-rose-400 text-sm">
                  {refundTargetOrder.totalAmount.toLocaleString('vi-VN')} đ
                </span>
              </div>
            </div>

            {/* Refund Action Type Selector */}
            <div className="space-y-1.5 text-xs">
              <label className="text-slate-300 font-bold block">Hình thức xử lý:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRefundActionType('REFUND')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    refundActionType === 'REFUND'
                      ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="font-bold text-xs flex items-center gap-1.5">
                    <span>💵 Hoàn Tiền 100%</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Trả hàng & hoàn tiền lại cho khách</p>
                </button>

                <button
                  type="button"
                  onClick={() => setRefundActionType('EXCHANGE')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    refundActionType === 'EXCHANGE'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="font-bold text-xs flex items-center gap-1.5">
                    <span>🔄 Đổi Sang Món Khác</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Chọn sản phẩm mới & bù trừ chênh lệch</p>
                </button>
              </div>
            </div>

            {/* Reason selector */}
            <div className="space-y-1.5 text-xs">
              <label className="text-slate-300 font-bold block">Lý do đổi trả:</label>
              <select
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200"
              >
                <option value="Lỗi kỹ thuật / Lỗi NSX (Đổi mới / Hoàn tiền)">Lỗi kỹ thuật / Lỗi NSX (Bảo hành 1 đổi 1)</option>
                <option value="Khách mua nhầm loại / đổi sang sản phẩm khác">Khách mua nhầm loại / đổi sang sản phẩm khác</option>
                <option value="Khách không ưng ý / trả lại hàng">Khách không ưng ý / trả lại hàng</option>
                <option value="Lỗi nhân viên tư vấn sai">Lỗi nhân viên tư vấn sai</option>
                <option value="Khác">Lý do khác</option>
              </select>
            </div>

            {/* Note input */}
            <div className="space-y-1 text-xs">
              <label className="text-slate-400 block">Ghi chú xử lý:</label>
              <input
                type="text"
                placeholder="VD: Thu hồi củ sạc lỗi nguyên hộp, hoàn tiền mặt..."
                value={refundNote}
                onChange={(e) => setRefundNote(e.target.value)}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200"
              />
            </div>

            {/* Realtime KPI & Revenue Warning Banner */}
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5 text-xs text-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                Hệ thống sẽ đồng bộ cập nhật trạng thái đơn thành <strong className="text-rose-400 font-mono">REFUNDED</strong> lên Supabase và tự động giảm trừ <strong className="text-white font-mono">{refundTargetOrder.totalAmount.toLocaleString('vi-VN')} đ</strong> khỏi Doanh thu chi nhánh & điểm KPI cá nhân.
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowRefundModal(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs cursor-pointer"
              >
                Hủy Bỏ
              </button>

              <button
                type="button"
                onClick={handleConfirmRefund}
                className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-rose-500/20"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Xác Nhận {refundActionType === 'REFUND' ? 'Hoàn Tiền' : 'Đổi Hàng'}</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
