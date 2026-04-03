import React, { useState, useEffect } from 'react';
import { Calendar, LayoutDashboard, Lock, ChevronLeft, ChevronRight, Sparkles, Plus, Edit3 } from 'lucide-react';
import { Toast } from './components/Toast';
import { ClientBookingModal } from './components/ClientBookingModal';
import { AdminSlotEditor } from './components/AdminSlotEditor';
import { callGemini } from './services/geminiService';
import { EventsMap, SlotData } from './types';

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7h - 20h

const STATUS_LABELS = {
  available: 'Trống',
  booked: 'Đã đặt',
  pending: 'Chờ xác nhận',
  contact: 'Liên hệ',
  blocked: 'Đã khóa'
};

const getDayName = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('vi-VN', { weekday: 'short' });
};

const generateRandomSlotsForDate = (dateStr: string): SlotData[] => {
  const date = new Date(dateStr);
  if (date.getDay() === 0) return []; // Chủ nhật nghỉ
  const slots: SlotData[] = [];
  const possibleHours = [8, 9, 10, 11, 13, 14, 15, 16];
  const numberOfSlots = Math.floor(Math.random() * 4) + 3;
  const selectedHours = possibleHours.sort(() => 0.5 - Math.random()).slice(0, numberOfSlots);

  selectedHours.forEach(hour => {
    const rand = Math.random();
    let status: SlotData['status'] = 'available';
    let bookedBy = null;

    if (rand < 0.3) {
      status = 'booked';
      bookedBy = { name: 'Khách Demo', email: 'demo@client.com', note: 'Đặt tự động' };
    } else if (rand < 0.4) {
      status = 'contact';
    }

    slots.push({
      hour,
      status,
      duration: 1,
      timeLabel: `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'Chiều' : 'Sáng'}`,
      subLabel: status === 'available' && rand < 0.2 ? '+1 suất' : null,
      bookedBy
    });
  });
  return slots;
};

export default function App() {
  const [viewMode, setViewMode] = useState<'client' | 'admin'>('client');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<EventsMap>({});
  const [toast, setToast] = useState<string | null>(null);

  const [clientModalOpen, setClientModalOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ dateStr: string; index: number; data: SlotData } | null>(null);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  useEffect(() => {
    setEvents(prev => {
      const next = { ...prev };
      let changed = false;
      days.forEach(d => {
        if (!next[d]) {
          next[d] = generateRandomSlotsForDate(d);
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [currentDate]);

  const handleSlotClick = (dateStr: string, index: number, slotData: SlotData) => {
    if (viewMode === 'client') {
      if (slotData.status === 'available') {
        setSelectedSlot({ dateStr, index, data: slotData });
        setClientModalOpen(true);
      }
    } else {
      setSelectedSlot({ dateStr, index, data: slotData });
      setAdminModalOpen(true);
    }
  };

  const handleEmptyGridClick = (dateStr: string, hour: number) => {
    if (viewMode !== 'admin') return;
    const newSlot: SlotData = {
      hour,
      status: 'available',
      duration: 1,
      timeLabel: `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'Chiều' : 'Sáng'}`
    };
    const dayEvents = [...(events[dateStr] || [])];
    dayEvents.push(newSlot);
    setEvents({ ...events, [dateStr]: dayEvents });
    const newIndex = dayEvents.length - 1;
    setSelectedSlot({ dateStr, index: newIndex, data: newSlot });
    setAdminModalOpen(true);
  };

  const handleClientSubmit = (formData: { name: string; email: string; note: string }) => {
    if (!selectedSlot) return;
    const { dateStr, index } = selectedSlot;
    const newEvents = { ...events };
    newEvents[dateStr][index] = { ...newEvents[dateStr][index], status: 'pending', bookedBy: formData };
    setEvents(newEvents);
    setClientModalOpen(false);
    setToast(`Yêu cầu của ${formData.name} đã được gửi chờ xác nhận!`);
  };

  const handleAdminSave = (updatedData: Partial<SlotData>) => {
    if (!selectedSlot) return;
    const { dateStr, index } = selectedSlot;
    const newEvents = { ...events };
    newEvents[dateStr][index] = { ...newEvents[dateStr][index], ...updatedData };
    setEvents(newEvents);
    setAdminModalOpen(false);
    setToast("Đã cập nhật Slot (Admin)");
  };

  const handleAdminDelete = () => {
    if (!selectedSlot) return;
    const { dateStr, index } = selectedSlot;
    const newEvents = { ...events };
    newEvents[dateStr].splice(index, 1);
    setEvents(newEvents);
    setAdminModalOpen(false);
    setToast("Đã xóa Slot");
  };

  const handleAdminAI = async () => {
    setToast("AI đang phân tích dữ liệu...");
    const summary = days.map(d => `${d}: ${(events[d] || []).filter(e => e.status === 'booked').length} đã đặt`).join('\n');
    const res = await callGemini(`Phân tích hiệu suất đặt lịch tuần này dựa trên data:\n${summary}\nĐưa ra nhận xét ngắn gọn bằng tiếng Việt cho Admin.`);
    alert(res);
  };

  return (
    <div className={`min-h-screen font-sans flex flex-col items-center p-4 transition-colors duration-500 ${viewMode === 'admin' ? 'bg-[#1a1515] text-orange-50' : 'bg-[#0f1115] text-gray-200'}`}>
      
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      
      <ClientBookingModal isOpen={clientModalOpen} onClose={() => setClientModalOpen(false)} selectedSlot={selectedSlot} onSubmit={handleClientSubmit} />
      <AdminSlotEditor isOpen={adminModalOpen} onClose={() => setAdminModalOpen(false)} selectedSlot={selectedSlot} onSave={handleAdminSave} onDelete={handleAdminDelete} HOURS={HOURS} STATUS_LABELS={STATUS_LABELS} />

      <div className="w-full max-w-7xl flex justify-between items-center mb-6 bg-white/5 p-3 rounded-xl backdrop-blur-md border border-white/10">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${viewMode === 'admin' ? 'bg-orange-600' : 'bg-cyan-600'}`}>
            {viewMode === 'admin' ? <LayoutDashboard size={20} className="text-white" /> : <Calendar size={20} className="text-white" />}
          </div>
          <div>
            <h1 className="font-bold text-lg">{viewMode === 'admin' ? 'Bảng Quản Trị' : 'Đặt Lịch Online'}</h1>
            <p className="text-xs opacity-60">{viewMode === 'admin' ? 'Quản lý lịch trình & Khách hàng' : 'Chọn giờ phù hợp với bạn'}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button onClick={() => setViewMode('client')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'client' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-500/30' : 'hover:bg-white/10'}`}>
            Khách Hàng
          </button>
          <button onClick={() => setViewMode('admin')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'admin' ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/30' : 'hover:bg-white/10'}`}>
            <Lock size={14} /> Admin
          </button>
        </div>
      </div>

      <div className={`w-full max-w-7xl rounded-2xl overflow-hidden shadow-2xl border transition-colors duration-500 ${viewMode === 'admin' ? 'bg-[#252020] border-orange-900/50' : 'bg-[#16191d] border-gray-800'}`}>
        
        <div className="flex justify-between items-center p-5 border-b border-white/5">
          <div className="flex gap-2">
            <button onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() - 7); setCurrentDate(d); }} className="p-2 hover:bg-white/10 rounded-lg"><ChevronLeft size={20} /></button>
            <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold uppercase">Hôm nay</button>
            <button onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() + 7); setCurrentDate(d); }} className="p-2 hover:bg-white/10 rounded-lg"><ChevronRight size={20} /></button>
          </div>
          
          {viewMode === 'admin' && (
            <button onClick={handleAdminAI} className="flex items-center gap-2 text-xs text-orange-400 border border-orange-500/30 px-3 py-1.5 rounded-lg hover:bg-orange-500/10">
              <Sparkles size={14} /> Báo Cáo AI
            </button>
          )}
        </div>

        <div className="overflow-x-auto relative">
          <div className="min-w-[1000px] grid grid-cols-8">
            <div className="col-span-1 border-r border-white/5 bg-white/[0.02] pt-14 sticky left-0 z-30 backdrop-blur-sm">
              {HOURS.map(h => (
                <div key={h} className="h-24 border-b border-white/5 text-right pr-4 text-xs text-gray-500 pt-2">{h}:00</div>
              ))}
            </div>

            {days.map((d) => {
              const isToday = new Date().toDateString() === new Date(d).toDateString();
              const dayEvents = events[d] || [];

              return (
                <div key={d} className={`col-span-1 border-r border-white/5 relative group ${isToday ? 'bg-white/[0.03]' : ''}`}>
                  <div className={`h-14 flex flex-col items-center justify-center border-b border-white/5 sticky top-0 z-20 backdrop-blur-md ${isToday ? (viewMode === 'admin' ? 'text-orange-500' : 'text-cyan-500') : 'text-gray-400'}`}>
                    <span className="text-xs font-bold uppercase">{getDayName(d)}</span>
                    <span className="text-sm">{new Date(d).getDate()}</span>
                  </div>

                  <div className="relative h-[calc(14*6rem)]">
                    {HOURS.map(h => (
                      <div key={h} 
                        onClick={() => handleEmptyGridClick(d, h)}
                        className={`h-24 border-b border-white/5 w-full absolute box-border transition-colors ${viewMode === 'admin' ? 'hover:bg-white/5 cursor-pointer' : ''}`} 
                        style={{ top: `${(h - 7) * 6}rem` }}>
                        {viewMode === 'admin' && <div className="hidden group-hover:block absolute top-1 right-1"><Plus size={12} className="text-gray-500" /></div>}
                      </div>
                    ))}

                    {dayEvents.map((ev, idx) => {
                      if (viewMode === 'client' && ev.status === 'blocked') return null;

                      const top = (ev.hour - 7) * 6;
                      const height = ev.duration * 6;
                      
                      let bgClass = '';
                      if (ev.status === 'booked') {
                        bgClass = viewMode === 'admin' ? 'bg-gray-800 border-gray-600' : 'bg-[#1f2329] border-transparent opacity-70';
                      } else if (ev.status === 'pending') {
                        bgClass = 'bg-yellow-600/20 border border-yellow-600/50 animate-pulse';
                      } else if (ev.status === 'available') {
                        bgClass = viewMode === 'admin' ? 'bg-green-900/40 border border-green-700/50' : 'bg-gradient-to-br from-cyan-600 to-blue-600 hover:from-cyan-500';
                      } else {
                        bgClass = 'bg-gray-800/50 border border-gray-700';
                      }

                      return (
                        <div key={idx}
                          onClick={(e) => { e.stopPropagation(); handleSlotClick(d, idx, ev); }}
                          className="absolute w-full px-1 py-1 z-10 transition-all hover:scale-[1.02] cursor-pointer"
                          style={{ top: `${top}rem`, height: `${height}rem` }}>
                          
                          <div className={`w-full h-full rounded shadow-sm flex flex-col justify-center px-2 relative overflow-hidden ${bgClass}`}>
                            {viewMode === 'admin' && <div className="absolute top-1 right-1 text-orange-500"><Edit3 size={12} /></div>}
                            
                            <span className={`text-xs font-bold ${ev.status === 'pending' ? 'text-yellow-400' : (ev.status === 'available' && viewMode === 'client' ? 'text-white' : 'text-gray-300')}`}>
                              {ev.status === 'pending' ? (viewMode === 'admin' ? 'Chờ Duyệt' : 'Chờ Xác Nhận') : (ev.status === 'booked' ? 'Đã Đặt' : ev.timeLabel)}
                            </span>

                            {viewMode === 'client' && ev.status === 'available' && <span className="text-[10px] text-cyan-100">Còn trống</span>}
                            
                            {viewMode === 'admin' && (ev.status === 'booked' || ev.status === 'pending') && (
                              <div className="text-[10px] text-gray-400 mt-1">
                                <span className="block truncate font-bold text-orange-200">{ev.bookedBy?.name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
