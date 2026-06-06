import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { useState } from 'react';

function formatDate(date: Date) {
  return date.toLocaleString('ko-KR', { dateStyle: 'medium' });
}

interface DateTimePickerProps {
  value?: Date;
  onChange: (date: Date) => void;
  placeholder?: string;
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = '날짜 선택',
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="flex-1 justify-between font-normal"
          >
            {value ? formatDate(value) : placeholder}
            <CalendarIcon />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            captionLayout="dropdown"
            defaultMonth={value}
            onSelect={(selectedDate) => {
              if (selectedDate) {
                const current = value ?? new Date();
                const combined = new Date(selectedDate);
                combined.setHours(
                  current.getHours(),
                  current.getMinutes(),
                  0,
                  0
                );
                onChange(combined);
              }
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
      <Input
        type="time"
        className="w-32 appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
        value={
          value
            ? `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`
            : ''
        }
        onChange={(e) => {
          const [hours, minutes] = e.target.value.split(':').map(Number);
          const current = value ?? new Date();
          const combined = new Date(current);
          combined.setHours(hours, minutes, 0, 0);
          onChange(combined);
        }}
      />
    </div>
  );
}
