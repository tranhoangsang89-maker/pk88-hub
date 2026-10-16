import React, { useState } from 'react';
import { ShoppingBag, Wrench } from 'lucide-react';
import { POSView } from './POSView';
import { RepairTicketView } from './RepairTicketView';
import { Staff, Branch, RepairTicket } from '../types';

interface CounterServiceViewProps {
  currentUser: Staff;
  currentBranch: Branch;
  branches: Branch[];
  tickets: RepairTicket[];
  onCreateTicket: (ticket: RepairTicket) => Promise<void>;
  onUpdateTicket: (ticketId: string, updates: Partial<RepairTicket>) => Promise<boolean>;
  initialSubTab?: 'pos' | 'tickets';
}

export const CounterServiceView: React.FC<CounterServiceViewProps> = ({
  currentUser,
  currentBranch,
  branches,
  tickets,
  onCreateTicket,
  onUpdateTicket,
  initialSubTab = 'pos'
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'pos' | 'tickets'>(initialSubTab);

  return (
    <div className="space-y-4">
      {/* Segmented Control Bar */}
      <div className="flex justify-center">
        <div className="inline-flex p-1 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md">
          <button
            type="button"
            onClick={() => setActiveSubTab('pos')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeSubTab === 'pos'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>🛒 Bán Hàng & Dịch Vụ Nhanh (POS)</span>
          </button>
          
          <button
            type="button"
            onClick={() => setActiveSubTab('tickets')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeSubTab === 'tickets'
                ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-md shadow-rose-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Wrench className="w-4 h-4" />
            <span>🛠️ Tiếp Nhận Sửa Chữa</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {tickets.filter(t => t.branchId === currentBranch.id && t.status !== 'DELIVERED').length}
            </span>
          </button>
        </div>
      </div>

      {/* View Containers (Kept mounted via CSS hidden to prevent form reset when switching tabs) */}
      <div className={activeSubTab === 'pos' ? 'block' : 'hidden'}>
        <POSView 
          currentUser={currentUser}
          currentBranch={currentBranch}
          branches={branches}
          onCreateOrder={onCreateTicket}
          onUpdateOrder={onUpdateTicket}
          tickets={tickets}
        />
      </div>

      <div className={activeSubTab === 'tickets' ? 'block' : 'hidden'}>
        <RepairTicketView 
          tickets={tickets} 
          role={currentUser.role} 
          currentUser={currentUser}
          currentBranch={currentBranch}
          branches={branches}
          onCreateTicket={onCreateTicket} 
          onUpdateTicket={onUpdateTicket}
          currentUserName={currentUser.fullName}
        />
      </div>
    </div>
  );
};
