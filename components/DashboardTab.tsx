import React, { useMemo, useState } from 'react';
import { Transaction, TransactionType, MONTH_NAMES, Budget } from '../types';
import FinancialChart from './FinancialChart';
import AIInsights from './AIInsights';
import { TrendingUp, TrendingDown, PieChart as PieIcon, ArrowUpRight, ArrowDownLeft, AlertCircle, Activity, CreditCard, Landmark, ChevronLeft, ChevronRight, Calendar, Wallet } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface DashboardTabProps {
  transactions: Transaction[];
  budgets: Budget[];
  stats: {
    income: number;
    expense: number;
    balance: number;
  };
}

const COLORS = ['#AFDE22', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6', '#f43f5e'];

const DashboardTab: React.FC<DashboardTabProps> = ({ transactions, budgets, stats: globalStats }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
  };

  // Filter transactions based on selected date
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Filter out invoice payments
      if (t.isInvoicePayment) return false;
      
      const tDate = new Date(t.date);
      return tDate.getMonth() === selectedMonth && tDate.getFullYear() === selectedYear;
    });
  }, [transactions, selectedMonth, selectedYear]);

  // Calculate stats for the selected period
  const periodStats = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((acc: number, curr) => acc + curr.amount, 0);
    
    const expense = filteredTransactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((acc: number, curr) => acc + curr.amount, 0);
    
    return {
      income,
      expense,
      balance: income - expense
    };
  }, [filteredTransactions]);

  // Calculate Budget (Expected) for the selected period
  const periodBudget = useMemo(() => {
    const currentBudgets = budgets.filter(b => b.month === selectedMonth && b.year === selectedYear);
    
    const income = currentBudgets
      .filter(b => b.type === TransactionType.INCOME)
      .reduce((acc: number, curr) => acc + curr.amount, 0);
      
    const expense = currentBudgets
      .filter(b => b.type === TransactionType.EXPENSE)
      .reduce((acc: number, curr) => acc + curr.amount, 0);

    return { income, expense };
  }, [budgets, selectedMonth, selectedYear]);

  // 1. Expense Breakdown by Category
  const expenseData = useMemo(() => {
    const expenses = filteredTransactions.filter(t => t.type === TransactionType.EXPENSE);
    const grouped = expenses.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);

    return (Object.entries(grouped) as [string, number][])
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value); // Descending order
  }, [filteredTransactions]);

  // 2. Recent Transactions (Last 5 of the period)
  const recentTransactions = useMemo(() => {
    return filteredTransactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [filteredTransactions]);

  // 3. Biggest Expenses (Top 3 Single Transactions of the period)
  const biggestExpenses = useMemo(() => {
    return filteredTransactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);
  }, [filteredTransactions]);

  // 4. Most Used Payment Methods (Frequency in period)
  const topPaymentMethods = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredTransactions.forEach(t => {
      const method = t.paymentMethod || 'Outros';
      counts[method] = (counts[method] || 0) + 1;
    });
    return (Object.entries(counts) as [string, number][])
      .map(([name, value]): { name: string; value: number } => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [filteredTransactions]);

  // 5. Most Active Banks (Total Volume in period)
  const topBanks = useMemo(() => {
    const activity: Record<string, number> = {};
    filteredTransactions.forEach(t => {
      const bank = t.bank || 'Outros';
      activity[bank] = (activity[bank] || 0) + t.amount;
    });
    return (Object.entries(activity) as [string, number][])
      .map(([name, value]): { name: string; value: number } => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [filteredTransactions]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      
      {/* Date Filter & Header */}
      <div className="flex flex-col md:flex-row items-end justify-between gap-4">
        <div>
           <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
             <Landmark className="w-7 h-7 text-[#0C2BD8]" />
             Visão Geral
           </h2>
           <p className="text-slate-500 mt-1">Acompanhe o desempenho financeiro do mês.</p>
        </div>
        
        <div className="bg-[#FBFBFB] p-1.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-1">
          {/* Year Selector */}
          <div className="flex items-center bg-slate-50 rounded-lg border border-slate-200">
            <button 
              onClick={() => setSelectedYear(prev => prev - 1)}
              className="p-2 text-slate-400 hover:text-white hover:bg-[#0C2BD8] rounded-l-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-sm font-bold text-slate-700 min-w-[60px] text-center">{selectedYear}</span>
            <button 
              onClick={() => setSelectedYear(prev => prev + 1)}
              className="p-2 text-slate-400 hover:text-white hover:bg-[#0C2BD8] rounded-r-lg transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="w-px h-6 bg-slate-200 mx-1"></div>

          {/* Month Selector */}
          <div className="relative">
             <select 
               value={selectedMonth}
               onChange={(e) => setSelectedMonth(Number(e.target.value))}
               className="appearance-none bg-transparent text-slate-700 text-sm font-bold pl-3 pr-8 py-2 focus:outline-none cursor-pointer hover:text-black transition-colors"
             >
               {MONTH_NAMES.map((m, idx) => (
                 <option key={idx} value={idx}>{m}</option>
               ))}
             </select>
             <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
               <Calendar className="w-3.5 h-3.5 text-slate-400" />
             </div>
          </div>
        </div>
      </div>

      {/* --- Row 1: Key Metrics Cards --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Balance Card */}
        <div className="bg-[#FBFBFB] rounded-2xl p-6 shadow-sm border border-slate-200 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#0C2BD8]/5 rounded-bl-full -mr-8 -mt-8 transition-transform duration-500 group-hover:scale-110"></div>
          
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="p-2 bg-slate-100 rounded-lg">
              <Wallet className="w-5 h-5 text-[#0C2BD8]" />
            </div>
            <span className="text-slate-500 text-sm font-medium uppercase tracking-wider">Saldo do Período</span>
          </div>

          <div className="relative z-10">
            <p className={`text-4xl font-bold tracking-tight ${periodStats.balance >= 0 ? 'text-slate-800' : 'text-red-500'}`}>
               {formatCurrency(periodStats.balance)}
            </p>
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
               <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-500">Acumulado</span>
               <span className={`${globalStats.balance >= 0 ? 'text-emerald-600' : 'text-red-500'} font-semibold`}>
                  {formatCurrency(globalStats.balance)}
               </span>
            </div>
          </div>
        </div>

        {/* Income Card */}
        <div className="bg-[#FBFBFB] rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-[#AFDE22]/30 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#AFDE22]/10 to-transparent rounded-bl-full -mr-6 -mt-6"></div>
          
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="flex items-center gap-3">
               <div className="p-2 bg-[#AFDE22]/20 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-[#AFDE22]" />
               </div>
               <span className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Entradas</span>
            </div>
          </div>
          
          <p className="text-3xl font-bold text-[#AFDE22] relative z-10">
            {formatCurrency(periodStats.income)}
          </p>
          <p className="text-xs text-slate-400 mt-2 relative z-10">
            Receitas no mês de {MONTH_NAMES[selectedMonth]}
          </p>

          <div className="mt-3 pt-3 border-t border-slate-100 relative z-10 flex justify-between items-center">
             <span className="text-xs text-slate-500 font-medium">Meta Estipulada</span>
             <span className="text-xs font-bold text-slate-700">{formatCurrency(periodBudget.income)}</span>
          </div>
        </div>

        {/* Expense Card */}
        <div className="bg-[#FBFBFB] rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group hover:border-red-200 transition-all">
           <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-red-50 to-transparent rounded-bl-full -mr-6 -mt-6"></div>
          
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="flex items-center gap-3">
               <div className="p-2 bg-red-50 rounded-lg">
                  <TrendingDown className="w-5 h-5 text-red-600" />
               </div>
               <span className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Saídas</span>
            </div>
          </div>
          
          <p className="text-3xl font-bold text-red-600 relative z-10">
            {formatCurrency(periodStats.expense)}
          </p>
          <p className="text-xs text-slate-400 mt-2 relative z-10">
            Despesas no mês de {MONTH_NAMES[selectedMonth]}
          </p>
          
          <div className="mt-3 pt-3 border-t border-slate-100 relative z-10 flex justify-between items-center">
             <span className="text-xs text-slate-500 font-medium">Orçamento Estipulado</span>
             <span className="text-xs font-bold text-slate-700">{formatCurrency(periodBudget.expense)}</span>
          </div>
        </div>
      </div>

      {/* --- Row 2: Charts Area --- */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Main Chart */}
        <div className="xl:col-span-2 bg-[#FBFBFB] p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="w-5 h-5 text-[#0C2BD8]" />
            <h3 className="text-lg font-bold text-slate-800">Fluxo Diário</h3>
          </div>
          <div className="h-72">
             <FinancialChart transactions={filteredTransactions} />
          </div>
        </div>

        {/* Expense Pie Chart */}
        <div className="bg-[#FBFBFB] rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col h-[400px]">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <PieIcon className="w-5 h-5 text-[#0C2BD8]" />
            Top Categorias
          </h3>
          
          <div className="flex-1 w-full min-h-0 relative">
            {expenseData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseData}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="#ffffff"
                    strokeWidth={2}
                  >
                    {expenseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend 
                     layout="horizontal" 
                     verticalAlign="bottom" 
                     align="center"
                     iconType="circle"
                     iconSize={8}
                     wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <PieIcon className="w-8 h-8 mb-2 opacity-20" />
                <span className="text-sm">Sem dados de despesas</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- Row 3: Stats Grid --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Payment Methods */}
        <div className="bg-[#FBFBFB] rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#0C2BD8]" />
            Formas de Pagamento
          </h3>
          <div className="space-y-4">
            {topPaymentMethods.length > 0 ? (
              topPaymentMethods.map((item, index) => (
                <div key={item.name} className="relative">
                  <div className="flex justify-between items-center mb-1.5 text-sm">
                    <span className="text-slate-700 font-semibold">{item.name}</span>
                    <span className="text-slate-500 text-xs bg-slate-100 px-2 py-0.5 rounded-full">{item.value} un.</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-[#0C2BD8] h-full rounded-full transition-all duration-500" 
                      style={{ width: `${(item.value / topPaymentMethods[0].value) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-sm text-center py-8 bg-slate-50 rounded-xl">Sem dados neste período.</p>
            )}
          </div>
        </div>

        {/* Active Banks */}
        <div className="bg-[#FBFBFB] rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Landmark className="w-5 h-5 text-[#0C2BD8]" />
            Volume por Banco
          </h3>
          <div className="space-y-4">
            {topBanks.length > 0 ? (
              topBanks.map((item, index) => (
                <div key={item.name} className="relative">
                  <div className="flex justify-between items-center mb-1.5 text-sm">
                    <span className="text-slate-700 font-semibold">{item.name}</span>
                    <span className="text-slate-900 font-bold">{formatCurrency(item.value)}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-black h-full rounded-full transition-all duration-500" 
                      style={{ width: `${(item.value / topBanks[0].value) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-sm text-center py-8 bg-slate-50 rounded-xl">Sem dados neste período.</p>
            )}
          </div>
        </div>
      </div>

      {/* --- Row 4: Detailed Lists --- */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Recent Transactions List */}
        <div className="bg-[#FBFBFB] rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800">Últimas Movimentações</h3>
            <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">Recentes</span>
          </div>
          
          <div className="p-4 space-y-2 flex-1">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((t) => (
                <div key={t.id} className="group flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.type === TransactionType.INCOME ? 'bg-[#AFDE22]/20 text-[#AFDE22]' : 'bg-red-100 text-red-600'}`}>
                      {t.type === TransactionType.INCOME ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm line-clamp-1">{t.description}</p>
                      <p className="text-xs text-slate-500">{t.category} • {new Date(t.date).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                  <span className={`font-bold text-sm ${t.type === TransactionType.INCOME ? 'text-[#AFDE22]' : 'text-red-600'}`}>
                    {t.type === TransactionType.INCOME ? '+' : ''}{formatCurrency(t.amount)}
                  </span>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-10">
                 <p className="text-sm">Nenhuma transação recente.</p>
              </div>
            )}
          </div>
        </div>

        {/* Biggest Expenses */}
        <div className="bg-[#FBFBFB] rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800">Maiores Gastos</h3>
            <span className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded-md border border-red-100 flex items-center gap-1">
               <AlertCircle className="w-3 h-3" /> Top 3
            </span>
          </div>
          
          <div className="p-4 space-y-3 flex-1">
            {biggestExpenses.length > 0 ? (
              biggestExpenses.map((t, index) => (
                <div key={t.id} className="relative overflow-hidden p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="relative z-10 flex justify-between items-center">
                     <div className="flex items-center gap-3">
                        <span className="w-6 h-6 flex items-center justify-center bg-white rounded-full text-xs font-bold text-slate-400 border border-slate-200 shadow-sm">
                           {index + 1}
                        </span>
                        <div>
                           <p className="font-semibold text-slate-800 text-sm">{t.description}</p>
                           <p className="text-xs text-slate-500">{t.category}</p>
                        </div>
                     </div>
                     <span className="font-bold text-red-600 text-sm">
                        {formatCurrency(t.amount)}
                     </span>
                  </div>
                  {/* Subtle bar visual */}
                  <div 
                     className="absolute bottom-0 left-0 h-1 bg-red-400/20 transition-all duration-1000" 
                     style={{ width: `${(t.amount / biggestExpenses[0].amount) * 100}%` }}
                  ></div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-10">
                 <p className="text-sm">Nenhuma despesa registrada.</p>
              </div>
            )}
          </div>
        </div>

        {/* AI Insights */}
        <div className="xl:col-span-1 h-full">
          <AIInsights transactions={filteredTransactions} />
        </div>
      </div>
    </div>
  );
};

export default DashboardTab;