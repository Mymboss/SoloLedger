import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  LayoutDashboard, 
  History, 
  Sparkles, 
  Wallet, 
  TrendingUp, 
  TrendingDown,
  Check,
  Tag
} from 'lucide-react';
import { Transaction, TransactionType, CategoryType, ViewState, CATEGORY_LABELS, TYPE_LABELS } from './types';
import { loadTransactions, saveTransactions } from './services/storageService';
import { generateFinancialInsight } from './services/geminiService';
import { TransactionCard } from './components/TransactionCard';
import { FinancialChart } from './components/FinancialChart';
import ReactMarkdown from 'react-markdown';

// Common tags configuration
const EXPENSE_TAGS = ['吃饭', '购物', '房租电费', '交通', '娱乐', '医疗'];
const INCOME_TAGS = ['工资', '奖金', '兼职', '理财', '红包', '退款'];

const App: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [view, setView] = useState<ViewState>('dashboard');
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiInsight, setAiInsight] = useState<string>('');
  
  // Add Transaction State
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedType, setSelectedType] = useState<TransactionType>('expense');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('routine');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const data = loadTransactions();
    // Sort by date descending initially
    setTransactions(data.sort((a, b) => b.timestamp - a.timestamp));
  }, []);

  useEffect(() => {
    saveTransactions(transactions);
  }, [transactions]);

  const handleAddTransaction = () => {
    if (!amount || isNaN(Number(amount))) {
      alert('请输入有效的金额');
      return;
    }

    const newTransaction: Transaction = {
      id: Date.now().toString(),
      amount: parseFloat(amount),
      type: selectedType,
      category: selectedCategory,
      description: description || CATEGORY_LABELS[selectedCategory] + TYPE_LABELS[selectedType],
      date: date,
      timestamp: new Date(date).getTime()
    };

    setTransactions(prev => [newTransaction, ...prev].sort((a, b) => b.timestamp - a.timestamp));
    
    // Reset Form
    setAmount('');
    setDescription('');
    setView('dashboard');
  };

  const handleDelete = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const handleAiAnalyze = async () => {
    setLoadingAi(true);
    const result = await generateFinancialInsight(transactions);
    setAiInsight(result);
    setLoadingAi(false);
  };

  const summary = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyData = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const income = monthlyData.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expense = monthlyData.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);

    return {
      income,
      expense,
      balance: income - expense,
      monthLabel: `${currentMonth + 1}月`
    };
  }, [transactions]);

  const renderDashboard = () => (
    <div className="space-y-6 pb-24 animate-fade-in">
      <header className="flex justify-between items-center pt-4 px-1">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">我的账本</h1>
          <p className="text-sm text-gray-500">本月概览 ({summary.monthLabel})</p>
        </div>
        <button 
          onClick={() => setView('ai-insight')}
          className="p-2 bg-gradient-to-tr from-indigo-500 to-purple-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all"
        >
          <Sparkles size={20} />
        </button>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex flex-col justify-between h-28">
          <div className="flex items-center gap-2 text-emerald-700">
            <TrendingUp size={18} />
            <span className="text-sm font-medium">总收入</span>
          </div>
          <span className="text-2xl font-bold text-emerald-800">¥{summary.income.toFixed(0)}</span>
        </div>
        <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100 flex flex-col justify-between h-28">
          <div className="flex items-center gap-2 text-rose-700">
            <TrendingDown size={18} />
            <span className="text-sm font-medium">总支出</span>
          </div>
          <span className="text-2xl font-bold text-rose-800">¥{summary.expense.toFixed(0)}</span>
        </div>
      </div>
      
      {/* Total Balance */}
      <div className="bg-gray-900 text-white p-6 rounded-2xl shadow-xl flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm mb-1">本月结余</p>
          <p className="text-3xl font-bold">¥{summary.balance.toFixed(2)}</p>
        </div>
        <div className="h-10 w-10 bg-gray-800 rounded-full flex items-center justify-center">
          <Wallet className="text-white" size={20} />
        </div>
      </div>

      <FinancialChart transactions={transactions} />

      <div>
        <div className="flex justify-between items-center mb-4 px-1">
          <h3 className="font-bold text-gray-800">最近记录</h3>
          <button onClick={() => setView('history')} className="text-sm text-blue-600">查看全部</button>
        </div>
        {transactions.slice(0, 3).map(t => (
          <TransactionCard key={t.id} transaction={t} onDelete={handleDelete} />
        ))}
      </div>
    </div>
  );

  const renderAdd = () => (
    <div className="pb-24 animate-fade-in">
       <header className="pt-4 pb-6 px-1">
        <h1 className="text-2xl font-bold text-gray-900">记一笔</h1>
      </header>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6">
        
        {/* Type Selection */}
        <div className="grid grid-cols-2 gap-3 p-1 bg-gray-100 rounded-xl">
          {(['expense', 'income'] as const).map(type => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`py-3 rounded-lg text-sm font-semibold transition-all ${
                selectedType === type 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {TYPE_LABELS[type]}
            </button>
          ))}
        </div>

        {/* Amount Input */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">金额</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-900 font-bold text-xl">¥</span>
            <input 
              type="number" 
              inputMode="decimal"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full bg-gray-50 text-gray-900 text-3xl font-bold py-4 pl-10 pr-4 rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none placeholder-gray-300"
              placeholder="0.00"
              autoFocus
            />
          </div>
        </div>

        {/* Category Selection */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-3">分类</label>
          <div className="grid grid-cols-2 gap-4">
            {(['routine', 'extra'] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`py-4 px-4 rounded-xl border-2 transition-all text-left flex items-center justify-between ${
                  selectedCategory === cat 
                    ? selectedType === 'expense' ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-gray-100 bg-white text-gray-600 hover:border-gray-200'
                }`}
              >
                <span className="font-semibold">{CATEGORY_LABELS[cat]}</span>
                {selectedCategory === cat && <Check size={16} />}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Tags (Common Menus) */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-1">
            <Tag size={12} /> 常用标签
          </label>
          <div className="flex flex-wrap gap-2">
            {(selectedType === 'expense' ? EXPENSE_TAGS : INCOME_TAGS).map(tag => (
              <button
                key={tag}
                onClick={() => setDescription(tag)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  description === tag 
                    ? 'bg-gray-800 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Date & Note */}
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">日期</label>
            <input 
              type="date" 
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full bg-gray-50 text-gray-900 py-3 px-4 rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">备注 (选填)</label>
            <input 
              type="text" 
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-gray-50 text-gray-900 py-3 px-4 rounded-xl border-none focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="例如: 超市购物"
            />
          </div>
        </div>

        <button 
          onClick={handleAddTransaction}
          className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-gray-800 transition-all active:scale-95 mt-4"
        >
          保存
        </button>

      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="pb-24 animate-fade-in">
       <header className="pt-4 pb-6 px-1">
        <h1 className="text-2xl font-bold text-gray-900">历史记录</h1>
      </header>
      <div className="space-y-1">
        {transactions.length === 0 ? (
          <div className="text-center text-gray-400 mt-20">暂无记录</div>
        ) : (
          transactions.map(t => (
            <TransactionCard key={t.id} transaction={t} onDelete={handleDelete} />
          ))
        )}
      </div>
    </div>
  );

  const renderAiInsight = () => (
    <div className="pb-24 animate-fade-in h-full">
      <header className="pt-4 pb-6 px-1 flex items-center gap-3">
        <button onClick={() => setView('dashboard')} className="p-2 -ml-2 text-gray-500">
           <span className="text-2xl">←</span>
        </button>
        <h1 className="text-2xl font-bold text-gray-900">AI 财务分析</h1>
      </header>

      <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-3xl p-1 shadow-lg">
        <div className="bg-white rounded-[22px] p-6 min-h-[300px]">
          {!aiInsight && !loadingAi && (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="bg-indigo-50 p-4 rounded-full mb-4">
                <Sparkles className="text-indigo-500" size={32} />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">智能分析本月收支</h3>
              <p className="text-gray-500 text-sm mb-6 max-w-xs">AI 将分析您的消费习惯，提供个性化的理财建议。</p>
              <button 
                onClick={handleAiAnalyze}
                className="bg-indigo-600 text-white px-8 py-3 rounded-full font-bold shadow-md hover:bg-indigo-700 transition-all"
              >
                开始分析
              </button>
            </div>
          )}

          {loadingAi && (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-100 border-t-indigo-600 mb-4"></div>
              <p className="text-indigo-600 font-medium">正在思考中...</p>
            </div>
          )}

          {aiInsight && !loadingAi && (
            <div className="prose prose-sm prose-indigo max-w-none">
              <ReactMarkdown>{aiInsight}</ReactMarkdown>
              <button 
                onClick={handleAiAnalyze}
                className="mt-6 w-full py-2 text-indigo-600 border border-indigo-200 rounded-xl hover:bg-indigo-50 transition-colors text-sm font-semibold"
              >
                重新分析
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 px-4 font-sans relative overflow-hidden">
      
      {/* View Content */}
      <main className="pt-2">
        {view === 'dashboard' && renderDashboard()}
        {view === 'add' && renderAdd()}
        {view === 'history' && renderHistory()}
        {view === 'ai-insight' && renderAiInsight()}
      </main>

      {/* Bottom Navigation */}
      {view !== 'ai-insight' && (
        <div className="fixed bottom-6 left-0 right-0 flex justify-center px-4 z-50 pointer-events-none">
          <nav className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 p-2 flex items-center gap-1 pointer-events-auto max-w-sm w-full justify-between px-6">
            <button 
              onClick={() => setView('dashboard')}
              className={`p-3 rounded-xl transition-all ${view === 'dashboard' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <LayoutDashboard size={24} />
            </button>
            
            <button 
              onClick={() => setView('add')}
              className="bg-gray-900 text-white p-4 rounded-xl shadow-lg shadow-gray-300 hover:bg-gray-800 transition-transform active:scale-95 -mt-8 border-4 border-gray-50"
            >
              <Plus size={28} strokeWidth={3} />
            </button>

            <button 
              onClick={() => setView('history')}
              className={`p-3 rounded-xl transition-all ${view === 'history' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <History size={24} />
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};

export default App;