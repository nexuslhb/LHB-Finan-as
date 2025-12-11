
import React, { useMemo, useState } from 'react';
import { Transaction, TransactionType, Investment } from '../types';
import { TrendingUp, PieChart, Wallet, Briefcase, Coins, Landmark, Globe, LineChart, Plus, Trash2, X, Check, DollarSign, Edit2, Calendar, ArrowRight, Search, Printer, History, Filter } from 'lucide-react';
import { ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, Tooltip } from 'recharts';
import { v4 as uuidv4 } from 'uuid';

interface InvestmentsTabProps {
  transactions: Transaction[];
  investments: Investment[];
  banks: string[];
  investmentHierarchy: Record<string, string[]>;
  onAddInvestment: (investment: Investment) => void;
  onDeleteInvestment: (id: string) => void;
  onAddTransaction: (transaction: Transaction) => void;
  onUpdateTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
}

const COLORS = ['#bef264', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1'];

const InvestmentsTab: React.FC<InvestmentsTabProps> = ({ 
  transactions, 
  investments, 
  banks,
  investmentHierarchy,
  onAddInvestment, 
  onDeleteInvestment, 
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInterestModalOpen, setIsInterestModalOpen] = useState(false);
  const [isReturnsHistoryOpen, setIsReturnsHistoryOpen] = useState(false);
  
  // Search / Filter State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    category: 'ALL',
    type: 'ALL',
    bank: 'ALL',
    startDate: '',
    endDate: ''
  });

  // Initial hierarchy keys with safety check
  const initialCategories = Object.keys(investmentHierarchy || {});
  const initialCategory = initialCategories[0] || '';
  const initialTypes = (initialCategory && investmentHierarchy[initialCategory]) || [];

  // Investment Form State
  const [category, setCategory] = useState(initialCategory);
  const [type, setType] = useState(initialTypes[0] || '');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [investmentBank, setInvestmentBank] = useState(banks[0] || 'Carteira'); 

  // Interest Form State
  const interestTypes = ["Rendimentos de Investimentos", "Aluguel Recebido"];
  const [interestType, setInterestType] = useState(interestTypes[0]); 
  const [interestAmount, setInterestAmount] = useState('');
  const [interestDesc, setInterestDesc] = useState('');
  const [interestBank, setInterestBank] = useState(banks[0] || 'Carteira');

  // Handle Category Change in Modal
  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
    const newTypes = (newCategory && investmentHierarchy[newCategory]) || [];
    setType(newTypes[0] || '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;

    const newInvestment: Investment = {
      id: uuidv4(),
      category,
      type,
      description,
      amount: parseFloat(amount),
      date: new Date().toISOString(),
      bank: investmentBank
    };

    onAddInvestment(newInvestment);
    setIsModalOpen(false);
    setDescription('');
    setAmount('');
  };

  const handleInterestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!interestDesc || !interestAmount) return;

    const newTransaction: Transaction = {
      id: uuidv4(),
      type: TransactionType.INCOME,
      category: 'Juros',
      subCategory: interestType,
      amount: parseFloat(interestAmount),
      description: interestDesc,
      date: new Date().toISOString(),
      bank: interestBank,
      paymentMethod: 'Pix' // Defaulting to Pix for internal transfer/deposit representation
    };

    onAddTransaction(newTransaction);
    setIsInterestModalOpen(false);
    setInterestDesc('');
    setInterestAmount('');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
  };

  // Helper: Set Quick Period
  const setQuickPeriod = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);

    setSearchFilters(prev => ({
      ...prev,
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    }));
  };

  // Derived Data Calculation
  const investmentData = useMemo(() => {
    // 1. Total Allocated
    const allocatedTransactions = transactions.filter(t => 
      t.type === TransactionType.EXPENSE && 
      t.category === 'Investimentos' &&
      t.subCategory !== 'Metas'
    );
    const totalAllocated = allocatedTransactions.reduce((acc, curr) => acc + curr.amount, 0);

    // 2. Total Executed
    const totalExecuted = investments.reduce((acc, curr) => acc + curr.amount, 0);

    // 3. Returns
    const returnsList = transactions.filter(t => 
      t.type === TransactionType.INCOME && t.category === 'Juros'
    );
    const totalReturns = returnsList.reduce((acc, curr) => acc + curr.amount, 0);

    // 4. Distribution logic
    const distribution: Record<string, number> = {};
    allocatedTransactions.forEach(t => {
      const cat = t.subCategory || 'Outros Investimentos';
      distribution[cat] = (distribution[cat] || 0) + t.amount;
    });
    investments.forEach(inv => {
      const cat = inv.category;
      if (distribution[cat]) {
        distribution[cat] -= inv.amount;
      } else {
        distribution[cat] = -inv.amount;
      }
    });

    // Chart Data
    const portfolioByCat = investments.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);

    const chartData = Object.entries(portfolioByCat).map(([name, value]) => ({
      name,
      value
    }));

    const availableTotal = totalAllocated - totalExecuted;

    return { 
      totalAllocated, 
      totalExecuted, 
      availableTotal, 
      returnsList: returnsList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      totalReturns, 
      chartData, 
      distribution,
      sortedInvestments: [...investments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    };
  }, [transactions, investments]);

  // Filtering Logic for Modal
  const filteredInvestments = useMemo(() => {
    if (!isSearchOpen) return [];

    return investments.filter(inv => {
      const tDateStr = inv.date.split('T')[0];

      if (searchFilters.category !== 'ALL' && inv.category !== searchFilters.category) return false;
      if (searchFilters.type !== 'ALL' && inv.type !== searchFilters.type) return false;
      if (searchFilters.bank !== 'ALL' && inv.bank !== searchFilters.bank) return false;
      if (searchFilters.startDate && tDateStr < searchFilters.startDate) return false;
      if (searchFilters.endDate && tDateStr > searchFilters.endDate) return false;

      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [investments, isSearchOpen, searchFilters]);

  const availableFilterTypes = useMemo(() => {
    if (searchFilters.category === 'ALL') return [];
    return investmentHierarchy[searchFilters.category] || [];
  }, [searchFilters.category, investmentHierarchy]);

  const handlePrintInvestments = () => {
    const win = window.open('', '', 'height=700,width=900');
    if (!win) return;

    win.document.write('<html><head><title>Relatório de Aportes</title>');
    win.document.write('<style>');
    win.document.write(`
      body { font-family: sans-serif; padding: 20px; color: #1B203C; }
      h1 { text-align: center; color: #0C2BD8; margin-bottom: 20px; }
      table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
      th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; }
      th { background-color: #f1f5f9; color: #475569; font-weight: bold; }
      .amount { color: #0C2BD8; font-weight: bold; }
      .header-info { margin-bottom: 20px; font-size: 14px; }
    `);
    win.document.write('</style></head><body>');
    win.document.write('<h1>Histórico de Aportes</h1>');
    
    // Add Filter Summary
    win.document.write('<div class="header-info">');
    win.document.write(`<p><strong>Período:</strong> ${searchFilters.startDate || 'Início'} até ${searchFilters.endDate || 'Hoje'}</p>`);
    win.document.write(`<p><strong>Registros encontrados:</strong> ${filteredInvestments.length}</p>`);
    win.document.write('</div>');

    // Build Table
    let tableHtml = '<table><thead><tr><th>Data</th><th>Ativo</th><th>Categoria</th><th>Tipo</th><th>Banco/Corretora</th><th>Valor</th></tr></thead><tbody>';
    
    let totalValue = 0;

    filteredInvestments.forEach(t => {
      const date = new Date(t.date).toLocaleDateString('pt-BR');
      const amount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount);
      totalValue += t.amount;

      tableHtml += `<tr>
        <td>${date}</td>
        <td>${t.description}</td>
        <td>${t.category}</td>
        <td>${t.type}</td>
        <td>${t.bank}</td>
        <td class="amount">${amount}</td>
      </tr>`;
    });

    tableHtml += '</tbody></table>';
    
    // Summary Footer
    win.document.write(tableHtml);
    win.document.write('<div style="margin-top: 20px; text-align: right; font-size: 14px;">');
    win.document.write(`<p><strong>Total Aportado no Período:</strong> <span class="amount">${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}</span></p>`);
    win.document.write('</div>');

    win.document.write('</body></html>');
    win.document.close();
    win.print();
  };

  const getTypeIcon = (cat: string) => {
    switch (cat) {
      case 'Renda Fixa': return Landmark;
      case 'Renda Variável': return LineChart;
      case 'Criptomoeda': return Coins;
      case 'Investimento Exterior': return Globe;
      default: return Briefcase;
    }
  };

  const displayCategories = Object.keys(investmentHierarchy || {});

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative pb-20">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
         <div>
            <h2 className="text-2xl font-bold text-[#1B203C] flex items-center gap-2">
              <TrendingUp className="w-7 h-7 text-[#0C2BD8]" />
              Minha Carteira
            </h2>
            <p className="text-slate-500 mt-1">Gerencie seus ativos, acompanhe dividendos e faça novos aportes.</p>
         </div>
         
         <div className="flex gap-3">
            <button
              onClick={() => setIsInterestModalOpen(true)}
              className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-medium flex items-center gap-2 shadow-sm transition-all"
            >
              <DollarSign className="w-5 h-5 text-slate-800" />
              <span className="hidden sm:inline">Adicionar Juros</span>
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-[#0C2BD8] hover:bg-[#0C2BD8]/90 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-200/20 transition-all border border-transparent"
            >
              <Plus className="w-5 h-5" />
              Novo Aporte
            </button>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Available Cash */}
        <div className="bg-[#FBFBFB] text-slate-800 rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-32 h-32 bg-[#0C2BD8]/5 rounded-bl-full -mr-8 -mt-8 pointer-events-none group-hover:scale-110 transition-transform duration-500"></div>
           <div className="flex items-center gap-3 mb-6 relative z-10">
             <div className="p-2 bg-slate-100 rounded-lg shadow-sm">
               <Wallet className="w-6 h-6 text-[#0C2BD8]" />
             </div>
             <span className="text-slate-500 font-medium text-sm tracking-wide uppercase">Disponível (Caixa)</span>
           </div>
           <div className="relative z-10">
             <p className={`text-4xl font-bold tracking-tight ${investmentData.availableTotal < 0 ? 'text-red-600' : 'text-[#0C2BD8]'}`}>
               {formatCurrency(investmentData.availableTotal)}
             </p>
             <p className="text-slate-500 text-sm mt-2">Saldo livre para novos aportes</p>
           </div>
        </div>

        {/* Total Wallet */}
        <div className="bg-[#FBFBFB] text-slate-800 rounded-2xl p-6 shadow-sm relative overflow-hidden group border border-slate-200">
           <div className="absolute top-0 right-0 w-32 h-32 bg-slate-100 rounded-bl-full -mr-8 -mt-8 pointer-events-none group-hover:scale-110 transition-transform duration-500"></div>
           <div className="flex items-center gap-3 mb-6 relative z-10">
             <div className="p-2 bg-slate-100 rounded-lg backdrop-blur-sm">
               <Briefcase className="w-6 h-6 text-[#0C2BD8]" />
             </div>
             <span className="text-slate-500 font-medium text-sm tracking-wide uppercase">Patrimônio Investido</span>
           </div>
           <div className="relative z-10">
             <p className="text-4xl font-bold tracking-tight">{formatCurrency(investmentData.totalExecuted)}</p>
             <p className="text-slate-500 text-sm mt-2 flex items-center gap-1">
               <Check className="w-3 h-3 text-brand" /> Total aplicado em ativos
             </p>
           </div>
        </div>

        {/* Returns */}
        <div className="bg-[#FBFBFB] text-slate-900 rounded-2xl p-6 border border-slate-200 shadow-sm relative group hover:border-brand transition-colors">
           <div className="flex items-center justify-between mb-6">
             <div className="flex items-center gap-3">
               <div className="p-2 bg-[#AFDE22]/20 rounded-lg">
                 <TrendingUp className="w-6 h-6 text-[#AFDE22]" />
               </div>
               <span className="text-slate-500 font-semibold text-sm tracking-wide uppercase">Rendimentos</span>
             </div>
             <button 
                onClick={() => setIsReturnsHistoryOpen(true)}
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-black transition-colors"
                title="Histórico de Rendimentos"
             >
               <ArrowRight className="w-4 h-4" />
             </button>
           </div>
           <div>
             <p className="text-4xl font-bold tracking-tight text-[#AFDE22]">+{formatCurrency(investmentData.totalReturns)}</p>
             <p className="text-slate-400 text-sm mt-2">Acumulado em dividendos e juros</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Column: Allocation & Charts */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* Available Breakdown */}
          <div>
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 px-1">Caixa por Categoria</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {displayCategories.map((t) => {
                const amount = investmentData.distribution[t] || 0;
                const Icon = getTypeIcon(t);
                const hasBalance = amount > 0;
                
                return (
                  <div key={t} className={`relative bg-[#FBFBFB] rounded-xl p-4 border transition-all duration-200 ${hasBalance ? 'border-[#0C2BD8]/30 shadow-md shadow-blue-50' : 'border-slate-200 shadow-sm opacity-70 hover:opacity-100'}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className={`p-2 rounded-lg ${hasBalance ? 'bg-[#0C2BD8]/10' : 'bg-slate-50'}`}>
                        <Icon className={`w-4 h-4 ${hasBalance ? 'text-[#0C2BD8]' : 'text-slate-400'}`} />
                      </div>
                      {hasBalance && <div className="w-2 h-2 rounded-full bg-[#0C2BD8] shadow-sm shadow-blue-200"></div>}
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium truncate mb-1" title={t}>{t}</p>
                      <p className={`text-lg font-bold truncate ${amount >= 0 ? 'text-slate-800' : 'text-red-500'}`}>
                        {formatCurrency(amount)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Portfolio Chart Section */}
          <div className="bg-[#FBFBFB] rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
               <PieChart className="w-5 h-5 text-[#0C2BD8]" />
               Distribuição da Carteira
            </h3>
            
            <div className="flex flex-col md:flex-row items-center gap-8">
               <div className="w-full md:w-1/2 h-[300px]">
                  {investmentData.chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={investmentData.chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          stroke="#ffffff"
                          strokeWidth={2}
                        >
                          {investmentData.chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => formatCurrency(value)}
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300">
                      <PieChart className="w-12 h-12 mb-3 opacity-20" />
                      <p className="text-sm">Sem ativos na carteira</p>
                    </div>
                  )}
               </div>
               
               <div className="w-full md:w-1/2 space-y-3">
                  {investmentData.chartData.length > 0 ? (
                    investmentData.chartData.map((entry, index) => (
                      <div key={index} className="flex justify-between items-center text-sm p-3 bg-slate-50 rounded-lg border border-slate-100">
                         <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                            <span className="font-medium text-slate-700">{entry.name}</span>
                         </div>
                         <div className="text-right">
                           <span className="font-bold text-slate-900 block">{formatCurrency(entry.value)}</span>
                           <span className="text-xs text-slate-400">{((entry.value / investmentData.totalExecuted) * 100).toFixed(1)}%</span>
                         </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 text-center italic text-sm">Adicione aportes para visualizar a distribuição.</p>
                  )}
               </div>
            </div>
          </div>
        </div>

        {/* Right Column: Investment List */}
        <div className="xl:col-span-1">
           <div className="bg-[#FBFBFB] rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full max-h-[800px]">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                 <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <History className="w-5 h-5 text-[#0C2BD8]" />
                    Histórico de Aportes
                 </h3>
                 <button 
                  onClick={() => setIsSearchOpen(true)}
                  className="p-2 bg-white border border-slate-200 hover:border-[#0C2BD8] rounded-lg text-slate-400 hover:text-[#0C2BD8] transition-all shadow-sm group"
                  title="Filtrar Aportes"
                 >
                   <Search className="w-4 h-4 group-hover:scale-110 transition-transform" />
                 </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                 {investmentData.sortedInvestments.length > 0 ? (
                    investmentData.sortedInvestments.map(inv => (
                       <div key={inv.id} className="group bg-white p-4 rounded-xl border border-slate-100 hover:shadow-md hover:border-[#0C2BD8]/30 transition-all">
                          <div className="flex justify-between items-start mb-2">
                             <div>
                                <h4 className="font-bold text-slate-800 text-sm">{inv.description}</h4>
                                <p className="text-xs text-slate-500 mt-1">{inv.category} • {inv.type}</p>
                             </div>
                             <span className="font-bold text-[#0C2BD8]">{formatCurrency(inv.amount)}</span>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-slate-50 mt-2">
                             <div className="flex items-center gap-2 text-xs text-slate-400">
                                <Calendar className="w-3 h-3" />
                                {new Date(inv.date).toLocaleDateString('pt-BR')}
                             </div>
                             <button 
                                onClick={() => onDeleteInvestment(inv.id)}
                                className="text-slate-300 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                             >
                                <Trash2 className="w-3.5 h-3.5" />
                             </button>
                          </div>
                       </div>
                    ))
                 ) : (
                    <div className="text-center py-10 text-slate-400">
                       <p className="text-sm">Nenhum aporte registrado.</p>
                    </div>
                 )}
              </div>
           </div>
        </div>
      </div>

      {/* Advanced Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-10 w-full max-w-[90%] shadow-2xl animate-in zoom-in-95 duration-200 h-[90vh] md:h-[85vh] flex flex-col">
            
            {/* Header */}
            <div className="flex justify-between items-center mb-4 md:mb-6 shrink-0">
               <h3 className="text-lg md:text-xl font-bold text-slate-800 flex items-center gap-2">
                 <Search className="w-5 h-5 text-[#0C2BD8]" />
                 Filtrar Aportes
               </h3>
               <button onClick={() => setIsSearchOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded-lg">
                 <X className="w-6 h-6" />
               </button>
            </div>

            {/* Filters Area */}
            <div className="bg-slate-50 p-4 md:p-5 rounded-xl border border-slate-200 space-y-4 mb-4 md:mb-6 shrink-0 overflow-y-auto max-h-[40vh] md:max-h-none custom-scrollbar">
               
               {/* Quick Period Buttons */}
               <div className="flex flex-col sm:flex-row gap-2 sm:items-center flex-wrap">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">Período:</span>
                  <div className="flex flex-wrap gap-2">
                    {[30, 60, 90, 365].map(days => (
                        <button 
                        key={days}
                        onClick={() => setQuickPeriod(days)}
                        className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg hover:border-[#0C2BD8] hover:text-[#0C2BD8] transition-colors shadow-sm whitespace-nowrap"
                        >
                        {days === 365 ? '1 Ano' : `Últimos ${days} dias`}
                        </button>
                    ))}
                  </div>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                  <div>
                     <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Categoria</label>
                     <select 
                        value={searchFilters.category}
                        onChange={(e) => setSearchFilters(prev => ({ 
                           ...prev, 
                           category: e.target.value,
                           type: 'ALL' // Reset type when category changes
                        }))}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0C2BD8]/20 focus:border-[#0C2BD8]"
                     >
                        <option value="ALL">Todas</option>
                        {Object.keys(investmentHierarchy).map(c => <option key={c} value={c}>{c}</option>)}
                     </select>
                  </div>
                  
                  <div>
                     <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Tipo</label>
                     <select 
                        value={searchFilters.type}
                        onChange={(e) => setSearchFilters(prev => ({ ...prev, type: e.target.value }))}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0C2BD8]/20 focus:border-[#0C2BD8]"
                     >
                        <option value="ALL">Todos</option>
                        {availableFilterTypes.map(c => <option key={c} value={c}>{c}</option>)}
                     </select>
                  </div>

                  <div>
                     <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Banco/Corretora</label>
                     <select 
                        value={searchFilters.bank}
                        onChange={(e) => setSearchFilters(prev => ({ ...prev, bank: e.target.value }))}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0C2BD8]/20 focus:border-[#0C2BD8]"
                     >
                        <option value="ALL">Todos</option>
                        {banks.map(b => <option key={b} value={b}>{b}</option>)}
                     </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">De</label>
                    <input 
                        type="date"
                        value={searchFilters.startDate}
                        onChange={(e) => setSearchFilters(prev => ({ ...prev, startDate: e.target.value }))}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0C2BD8]/20 focus:border-[#0C2BD8]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Até</label>
                    <input 
                        type="date"
                        value={searchFilters.endDate}
                        onChange={(e) => setSearchFilters(prev => ({ ...prev, endDate: e.target.value }))}
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0C2BD8]/20 focus:border-[#0C2BD8]"
                    />
                  </div>
               </div>
            </div>

            {/* Results Area (Scrollable) */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50 border border-slate-200 rounded-xl relative">
              <div id="printable-area" className="min-w-full overflow-x-auto">
                  <table className="w-full text-sm text-left">
                     <thead className="bg-slate-100 text-slate-500 font-semibold uppercase text-xs sticky top-0 z-10 shadow-sm">
                        <tr>
                           <th className="px-4 py-3 whitespace-nowrap">Data</th>
                           <th className="px-4 py-3 whitespace-nowrap">Ativo</th>
                           <th className="px-4 py-3 whitespace-nowrap">Categoria/Tipo</th>
                           <th className="px-4 py-3 whitespace-nowrap">Banco/Corretora</th>
                           <th className="px-4 py-3 text-right whitespace-nowrap">Valor</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100 bg-white">
                        {filteredInvestments.length > 0 ? (
                           filteredInvestments.map(t => (
                              <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                                 <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                                    {new Date(t.date).toLocaleDateString('pt-BR')}
                                 </td>
                                 <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">
                                    {t.description}
                                 </td>
                                 <td className="px-4 py-3 text-slate-600">
                                    <div className="flex flex-col">
                                       <span className="text-xs font-bold">{t.category}</span>
                                       <span className="text-xs text-slate-400">{t.type}</span>
                                    </div>
                                 </td>
                                 <td className="px-4 py-3 text-slate-600">
                                    {t.bank}
                                 </td>
                                 <td className="px-4 py-3 text-right font-bold whitespace-nowrap text-[#0C2BD8]">
                                    {formatCurrency(t.amount)}
                                 </td>
                              </tr>
                           ))
                        ) : (
                           <tr>
                              <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                                 Nenhum investimento encontrado com os filtros atuais.
                              </td>
                           </tr>
                        )}
                     </tbody>
                  </table>
              </div>
            </div>
            
            {/* Footer / Actions */}
            <div className="mt-4 md:mt-6 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
               <div className="text-sm text-slate-500 text-center sm:text-left">
                  Total filtrado: <span className="font-bold text-slate-800">{filteredInvestments.length}</span> | 
                  Volume: <span className="font-bold text-[#0C2BD8]">{formatCurrency(filteredInvestments.reduce((acc, curr) => acc + curr.amount, 0))}</span>
               </div>
               
               <button 
                  onClick={handlePrintInvestments}
                  disabled={filteredInvestments.length === 0}
                  className="flex items-center gap-2 bg-[#1B203C] hover:bg-black text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-slate-300 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto justify-center"
               >
                  <Printer className="w-4 h-4" />
                  Salvar PDF / Imprimir
               </button>
            </div>

          </div>
        </div>
      )}

      {/* Add Investment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-[#0C2BD8]" />
                  Novo Aporte
               </h3>
               <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
               </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
               <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Descrição do Ativo</label>
                  <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="ex: PETR4, Tesouro Selic 2027" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0C2BD8]/20 focus:border-[#0C2BD8]" required />
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Categoria</label>
                     <select value={category} onChange={(e) => handleCategoryChange(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0C2BD8]/20 focus:border-[#0C2BD8]">
                        {Object.keys(investmentHierarchy).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                     </select>
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tipo</label>
                     <select value={type} onChange={(e) => setType(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0C2BD8]/20 focus:border-[#0C2BD8]">
                        {(investmentHierarchy[category] || []).map(t => <option key={t} value={t}>{t}</option>)}
                     </select>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Valor (R$)</label>
                     <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0C2BD8]/20 focus:border-[#0C2BD8]" required />
                  </div>
                  <div>
                     <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Banco / Corretora</label>
                     <select value={investmentBank} onChange={(e) => setInvestmentBank(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0C2BD8]/20 focus:border-[#0C2BD8]">
                        {banks.map(b => <option key={b} value={b}>{b}</option>)}
                     </select>
                  </div>
               </div>

               <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-medium transition-colors">Cancelar</button>
                  <button type="submit" className="flex-1 px-4 py-3 bg-[#0C2BD8] hover:bg-[#0C2BD8]/90 text-white rounded-xl font-medium shadow-lg transition-colors">Confirmar Aporte</button>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Interest Modal */}
      {isInterestModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                   <DollarSign className="w-5 h-5 text-emerald-600" />
                   Adicionar Juros / Proventos
                </h3>
                <button onClick={() => setIsInterestModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                   <X className="w-5 h-5" />
                </button>
             </div>
             
             <form onSubmit={handleInterestSubmit} className="space-y-4">
                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Descrição</label>
                   <input type="text" value={interestDesc} onChange={(e) => setInterestDesc(e.target.value)} placeholder="ex: Dividendos MXRF11" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" required />
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tipo</label>
                      <select value={interestType} onChange={(e) => setInterestType(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500">
                         {interestTypes.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Valor (R$)</label>
                      <input type="number" step="0.01" value={interestAmount} onChange={(e) => setInterestAmount(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" required />
                   </div>
                </div>

                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Entrar no Banco</label>
                   <select value={interestBank} onChange={(e) => setInterestBank(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500">
                      {banks.map(b => <option key={b} value={b}>{b}</option>)}
                   </select>
                </div>

                <div className="flex gap-3 pt-2">
                   <button type="button" onClick={() => setIsInterestModalOpen(false)} className="flex-1 px-4 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-medium transition-colors">Cancelar</button>
                   <button type="submit" className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium shadow-lg transition-colors">Confirmar Recebimento</button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* Returns History Modal */}
      {isReturnsHistoryOpen && (
         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
               <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                  <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                     <History className="w-5 h-5 text-[#AFDE22]" />
                     Histórico de Rendimentos
                  </h3>
                  <button onClick={() => setIsReturnsHistoryOpen(false)} className="text-slate-400 hover:text-slate-600">
                     <X className="w-5 h-5" />
                  </button>
               </div>
               
               <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
                  {investmentData.returnsList.length > 0 ? (
                     investmentData.returnsList.map(t => (
                        <div key={t.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                           <div className="flex items-center gap-3">
                              <div className="p-2 bg-[#AFDE22]/20 rounded-lg text-[#AFDE22]">
                                 <TrendingUp className="w-4 h-4" />
                              </div>
                              <div>
                                 <p className="font-bold text-slate-800 text-sm">{t.description}</p>
                                 <p className="text-xs text-slate-500">{new Date(t.date).toLocaleDateString('pt-BR')} • {t.subCategory}</p>
                              </div>
                           </div>
                           <div className="text-right">
                              <span className="font-bold text-[#AFDE22] block">+{formatCurrency(t.amount)}</span>
                              <button onClick={() => onDeleteTransaction(t.id)} className="text-xs text-slate-300 hover:text-red-500 underline mt-1">Excluir</button>
                           </div>
                        </div>
                     ))
                  ) : (
                     <p className="text-center text-slate-400 py-10">Nenhum rendimento registrado.</p>
                  )}
               </div>
            </div>
         </div>
      )}

    </div>
  );
};

export default InvestmentsTab;
