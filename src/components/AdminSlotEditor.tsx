import React, { useState, useEffect } from 'react';
import { Settings, AlertCircle, Clock } from 'lucide-react';
import { SlotData, SlotStatus } from '../types';

interface AdminSlotEditorProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSlot: { dateStr: string; index: number; data: SlotData } | null;
  onSave: (updatedData: Partial<SlotData>) => void;
  onDelete: () => void;
  HOURS: number[];
  STATUS_LABELS: Record<string, string>;
}

export const AdminSlotEditor: React.FC<AdminSlotEditorProps> = ({ isOpen, onClose, selectedSlot, onSave, onDelete, HOURS, STATUS_LABELS }) => {
  const [status, setStatus] = useState<SlotStatus>('available');
  const [label, setLabel] = useState('');
  const [note, setNote] = useState('');
  const [startTime, setStartTime] = useState(7);
  const [duration, setDuration] = useState(1);
  const bookedBy = selectedSlot?.data?.bookedBy;

  useEffect(() => {
    if (selectedSlot) {
      setStatus(selectedSlot.data?.status || 'available');
      setLabel(selectedSlot.data?.timeLabel || '');
      setNote(selectedSlot.data?.bookedBy?.note || '');
      setStartTime(selectedSlot.data?.hour || 7);
      setDuration(selectedSlot.data?.duration || 1);
    }
  }, [selectedSlot]);

  useEffect(() => {
    if (startTime) {
      setLabel(`${startTime > 12 ? startTime - 12 : startTime}:00 ${startTime >= 12 ? 'Chiều' : 'Sáng'}`);
    }
  }, [startTime]);

  if (!isOpen) return null;

  const handleApprove = () => {
    onSave({ status: 'booked', timeLabel: label, hour: startTime, duration: duration });
  };

  const handleReject = () => {
    onSave({ status: 'available', timeLabel: label, hour: startTime, duration: duration, bookedBy: null });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1e1e24] border border-orange-500/30 w-full max-w-md rounded-xl shadow-2xl p-6 relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-red-500"></div>
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><Settings className="text-orange-400" /> Quản Lý Slot (Admin)</h3>

        {status === 'pending' && (
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 mb-4">
            <h4 className="text-orange-400 font-bold flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4" /> Yêu cầu chờ duyệt
            </h4>
            <div className="text-sm text-gray-300 mb-3">
              <p><span className="text-gray-500">Người đặt:</span> <span className="font-bold">{bookedBy?.name}</span></p>
              <p><span className="text-gray-500">Email:</span> {bookedBy?.email}</p>
              <p><span className="text-gray-500">Ghi chú:</span> "{bookedBy?.note}"</p>
            </div>
            <div className="flex gap-2">
              <button onClick={handleApprove} className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg font-bold text-sm">✅ Xác nhận</button>
              <button onClick={handleReject} className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2 rounded-lg font-bold text-sm">❌ Từ chối</button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 bg-[#15151a] p-3 rounded-lg border border-gray-800">
            <div>
              <label className="text-xs text-gray-400 uppercase font-bold flex items-center gap-1 mb-1">
                <Clock className="w-3 h-3" /> Giờ bắt đầu
              </label>
              <select
                value={startTime}
                onChange={(e) => setStartTime(parseInt(e.target.value))}
                className="w-full bg-[#25252b] border border-gray-700 text-white p-2 rounded focus:border-orange-500 outline-none text-sm"
              >
                {HOURS.map(h => (
                  <option key={h} value={h}>{h}:00</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 uppercase font-bold flex items-center gap-1 mb-1">
                Thời lượng (Giờ)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="w-full bg-[#25252b] border border-gray-700 text-white p-2 rounded focus:border-orange-500 outline-none text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 uppercase font-bold">Trạng thái (Thủ công)</label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {Object.entries(STATUS_LABELS).map(([key, value]) => (
                <button key={key} onClick={() => setStatus(key as SlotStatus)} className={`p-2 rounded border text-sm capitalize ${status === key ? 'border-orange-500 bg-orange-500/20 text-orange-300' : 'border-gray-700 bg-[#15151a] text-gray-400'}`}>
                  {value}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 uppercase font-bold">Nhãn hiển thị</label>
            <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} className="w-full mt-1 bg-[#15151a] border border-gray-700 text-white p-2 rounded focus:border-orange-500 outline-none" />
          </div>

          {(status === 'booked' || status === 'pending') && !bookedBy && (
            <div>
              <label className="text-xs text-gray-400 uppercase font-bold">Ghi chú (Admin)</label>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} className="w-full mt-1 bg-[#111] border border-gray-800 text-white p-2 rounded" />
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-gray-800 mt-4">
            <button onClick={onDelete} className="px-4 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-900 rounded-lg text-sm">Xóa Slot</button>
            <div className="flex-1 flex gap-2 justify-end">
              <button onClick={onClose} className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm hover:bg-gray-700">Đóng</button>
              <button onClick={() => onSave({ status, timeLabel: label, hour: startTime, duration: duration, bookedBy: { name: bookedBy?.name || '', email: bookedBy?.email || '', note: note } })} className="px-6 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-lg text-sm">Lưu</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
