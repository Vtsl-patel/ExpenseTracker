import React, { useState, useEffect, useRef } from 'react';
import { useAppDispatch } from '../store';
import { addExpense } from '../store/ledgerSlice';
import { CATEGORIES, dkey } from '../constants';
import { DatePicker } from './DatePicker';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast: (msg: string) => void;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  showToast,
}) => {
  const dispatch = useAppDispatch();
  const todayKey = dkey(new Date());

  const [amount, setAmount] = useState<string>('');
  const [selectedCat, setSelectedCat] = useState<string>(CATEGORIES[0].id);
  const [date, setDate] = useState<string>(todayKey);
  const [note, setNote] = useState<string>('');

  const amountRef = useRef<HTMLInputElement>(null);

  // Focus and reset fields when modal opens
  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setSelectedCat(CATEGORIES[0].id);
      setDate(todayKey);
      setNote('');

      // Delay slightly for transition animation
      const timer = setTimeout(() => {
        amountRef.current?.focus();
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [isOpen, todayKey]);

  if (!isOpen) return null;

  const handleSave = () => {
    const amtFloat = parseFloat(amount);
    if (isNaN(amtFloat) || amtFloat <= 0) {
      showToast('Enter a valid amount');
      return;
    }
    dispatch(addExpense({
      amount: amtFloat,
      category: selectedCat,
      date: date || todayKey,
      note: note.trim(),
    }));
    onClose();
  };

  return (
    <div 
      className={`fixed inset-0 bg-[rgba(15,13,10,0.5)] backdrop-blur-[2px] z-[100] flex items-end justify-center sm:items-center transition-all ${
        isOpen ? 'flex' : 'hidden'
      }`} 
      id="modalOverlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-bg-elev w-full max-w-[440px] rounded-t-[18px] sm:rounded-[18px] p-[24px_22px_28px] shadow-[0_-10px_40px_rgba(0,0,0,0.25)] animate-slideup max-h-[90vh] overflow-visible">
        <div className="flex items-center justify-between mb-4.5">
          <h3 className="font-display text-[19px] font-semibold text-ink">Add expense</h3>
          <button 
            className="w-7.5 h-7.5 rounded-full border-none bg-bg-sunken text-ink-soft flex items-center justify-center cursor-pointer hover:bg-line transition duration-150 ease-in-out" 
            id="modalClose" 
            onClick={onClose} 
            aria-label="Close modal"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-3.5">
          <label htmlFor="inpAmount" className="block text-xs font-semibold text-ink-soft mb-1.5 tracking-[0.02em]">Amount</label>
          <input
            id="inpAmount"
            type="text"
            ref={amountRef}
            placeholder="0.00"
            inputMode="decimal"
            value={amount}
            onChange={(e) => {
              const val = e.target.value;
              // Allow only positive numbers with up to 2 decimal places
              if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) {
                setAmount(val);
              }
            }}
            className="w-full px-[13px] py-[11px] border border-line rounded-sm bg-bg-sunken text-ink text-sm outline-none focus:border-accent focus:bg-bg-elev transition duration-150 ease-in-out"
          />
        </div>

        <div className="mb-3.5">
          <label className="block text-xs font-semibold text-ink-soft mb-1.5 tracking-[0.02em]">Category</label>
          <div className="flex flex-wrap gap-2" id="catPick">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`border border-line bg-bg-sunken rounded-[20px] px-3.5 py-2 text-[13px] font-medium text-ink-soft flex items-center gap-1.5 cursor-pointer transition duration-150 ease-in-out ${
                  c.id === selectedCat ? 'border-accent text-ink bg-accent-soft' : 'hover:border-ink-faint'
                }`}
                onClick={() => setSelectedCat(c.id)}
              >
                {c.icon} {c.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2.5">
          <div className="mb-3.5 flex-1">
            <label htmlFor="inpDate" className="block text-xs font-semibold text-ink-soft mb-1.5 tracking-[0.02em]">Date</label>
            <DatePicker
              value={date}
              onChange={setDate}
              id="inpDate"
              align="top"
            />
          </div>
        </div>

        <div className="mb-3.5">
          <label htmlFor="inpNote" className="block text-xs font-semibold text-ink-soft mb-1.5 tracking-[0.02em]">Note (optional)</label>
          <input
            id="inpNote"
            type="text"
            placeholder="e.g. lunch with friends"
            maxLength={60}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-[13px] py-[11px] border border-line rounded-sm bg-bg-sunken text-ink text-sm outline-none focus:border-accent focus:bg-bg-elev transition duration-150 ease-in-out"
          />
        </div>

        <button 
          className="w-full inline-flex items-center justify-center gap-1.5 px-[18px] py-[11px] rounded-sm text-sm font-semibold transition duration-150 ease-in-out border border-transparent bg-accent text-white hover:brightness-108 cursor-pointer mt-2" 
          id="saveEntry" 
          onClick={handleSave}
        >
          Save expense
        </button>
      </div>
    </div>
  );
};
export default AddExpenseModal;
