import React, { useState, useEffect, useRef } from 'react';
import { CATEGORIES, dkey } from '../constants';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (amount: number, category: string, date: string, note: string) => void;
  showToast: (msg: string) => void;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  showToast,
}) => {
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
    onSave(amtFloat, selectedCat, date || todayKey, note.trim());
    onClose();
  };

  return (
    <div 
      className={`overlay ${isOpen ? 'show' : ''}`} 
      id="modalOverlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal">
        <div className="modal-head">
          <h3>Add expense</h3>
          <button className="modal-close" id="modalClose" onClick={onClose} aria-label="Close modal">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="field">
          <label htmlFor="inpAmount">Amount</label>
          <input
            id="inpAmount"
            type="number"
            ref={amountRef}
            placeholder="0.00"
            inputMode="decimal"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <div className="field">
          <label>Category</label>
          <div className="cat-pick" id="catPick">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                className={c.id === selectedCat ? 'sel' : ''}
                onClick={() => setSelectedCat(c.id)}
              >
                {c.icon} {c.name}
              </button>
            ))}
          </div>
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="inpDate">Date</label>
            <input
              id="inpDate"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="inpNote">Note (optional)</label>
          <input
            id="inpNote"
            type="text"
            placeholder="e.g. lunch with friends"
            maxLength={60}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <button className="btn btn-primary btn-block" id="saveEntry" onClick={handleSave}>
          Save expense
        </button>
      </div>
    </div>
  );
};
