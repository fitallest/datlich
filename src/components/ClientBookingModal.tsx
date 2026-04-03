import React, { useState } from 'react';
import { Calendar, Loader, Sparkles } from 'lucide-react';
import { callGemini } from '../services/geminiService';
import { SlotData } from '../types';

interface ClientBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSlot: { dateStr: string; index: number; data: SlotData } | null;
  onSubmit: (formData: { name: string; email: string; note: string }) => void;
}

export const ClientBookingModal: React.FC<ClientBookingModalProps> = ({ isOpen, onClose, selectedSlot, onSubmit }) => {
  const [formData, setFormData] = useState({ name: '', email: '', note: '' });
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleAI = async () => {
    if (!formData.name) return setFormData(p => ({ ...p, note: "Vui lòng nhập tên trước..." }));
    setIsGenerating(true);
    const res = await callGemini(`Tạo nội dung lịch trình ngắn gọn cho cuộc họp của "${formData.name}". Viết bằng tiếng Việt.`);
    setFormData(p => ({ ...p, note: res }));
    setIsGenerating(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1a1d21] border border-gray-700 w-full max-w-md rounded-xl shadow-2xl p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Calendar className="text-cyan-400" /> Đặt Lịch Hẹn</h3>
        <div className="bg-[#22262b] p-3 rounded mb-4 border border-gray-700">
          <span className="text-cyan-400 font-bold text-lg">{selectedSlot?.data?.timeLabel}</span> - <span className="text-gray-300">{selectedSlot?.dateStr}</span>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-4">
          <input required placeholder="Tên của bạn" className="w-full bg-[#111316] border border-gray-700 text-white p-3 rounded-lg outline-none focus:border-cyan-500" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
          <input required type="email" placeholder="Email liên hệ" className="w-full bg-[#111316] border border-gray-700 text-white p-3 rounded-lg outline-none focus:border-cyan-500" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
          <div className="relative">
            <textarea placeholder="Ghi chú cuộc họp..." rows={3} className="w-full bg-[#111316] border border-gray-700 text-white p-3 rounded-lg outline-none focus:border-cyan-500" value={formData.note} onChange={e => setFormData({ ...formData, note: e.target.value })} />
            <button type="button" onClick={handleAI} disabled={isGenerating} className="absolute bottom-2 right-2 text-xs text-purple-400 hover:bg-purple-500/10 px-2 py-1 rounded flex gap-1 items-center">
              {isGenerating ? <Loader className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} AI Gợi ý
            </button>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-gray-800 rounded-lg text-gray-300 hover:bg-gray-700">Hủy</button>
            <button type="submit" className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-white font-bold">Gửi Yêu Cầu</button>
          </div>
          <p className="text-center text-xs text-gray-500 italic">Yêu cầu của bạn sẽ được gửi ở trạng thái "Chờ xác nhận"</p>
        </form>
      </div>
    </div>
  );
};
