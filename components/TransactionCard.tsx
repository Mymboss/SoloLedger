import React from 'react';
import { Transaction, CATEGORY_LABELS, TYPE_LABELS } from '../types';
import { ArrowDownCircle, ArrowUpCircle, Coffee, Star } from 'lucide-react';

interface Props {
  transaction: Transaction;
  onDelete: (id: string) => void;
}

export const TransactionCard: React.FC<Props> = ({ transaction, onDelete }) => {
  const isIncome = transaction.type === 'income';
  const isRoutine = transaction.category === 'routine';

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between mb-3 transition-all active:scale-95">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full ${isIncome ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
          {isIncome ? <ArrowUpCircle size={24} /> : <ArrowDownCircle size={24} />}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-gray-800">{transaction.description || (isIncome ? '收入' : '支出')}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${isRoutine ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-purple-50 text-purple-600 border-purple-100'}`}>
              {CATEGORY_LABELS[transaction.category]}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{new Date(transaction.date).toLocaleDateString()}</p>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className={`font-bold text-lg ${isIncome ? 'text-emerald-600' : 'text-gray-900'}`}>
          {isIncome ? '+' : '-'}{transaction.amount.toFixed(2)}
        </span>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            if(window.confirm('确定要删除这条记录吗?')) onDelete(transaction.id);
          }}
          className="text-xs text-gray-300 hover:text-red-500"
        >
          删除
        </button>
      </div>
    </div>
  );
};