export type SlotStatus = 'available' | 'booked' | 'pending' | 'contact' | 'blocked';

export interface BookedBy {
  name: string;
  email: string;
  note: string;
}

export interface SlotData {
  hour: number;
  status: SlotStatus;
  duration: number;
  timeLabel: string;
  subLabel?: string | null;
  bookedBy?: BookedBy | null;
}

export interface EventsMap {
  [dateStr: string]: SlotData[];
}
