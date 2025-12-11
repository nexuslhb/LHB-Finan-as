
import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType, MONTH_NAMES } from '../types';
import { ArrowUpRight, ArrowDownLeft, Trash2, CreditCard, Tag, Search, Wallet, X, Calendar, Printer, Filter, Check } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  banks: string[];
  transactionHierarchy: Record<TransactionType, Record<string, string[]>>;
}

const TransactionList: React.FC<TransactionListProps> = ({ transactions, onDelete, banks, transactionHierarchy }) => {
  // Current Month/Year State for Default View
  const [currentDate] = useState(new Date());
  const currentMonthIndex = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Search/Filter Modal State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    type: 'ALL',
    category: 'ALL',
    bank: 'ALL',
    startDate: '',
    endDate: ''
  });

  // Filter out invoice payments from display to prevent double counting
  const visibleTransactions = transactions.filter(t => !t.isInvoicePayment);

  // 1. Default List: Only Current Month & Year
  const currentMonthTransactions = useMemo(() => {
    return visibleTransactions
      .filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === currentMonthIndex && d.getFullYear() === currentYear;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [visibleTransactions, currentMonthIndex, currentYear]);

  // 2. Search Logic
  const filteredSearchResults = useMemo(() => {
    if (!isSearchOpen) return [];

    return visibleTransactions.filter(t => {
      const tDate = new Date(t.date);
      const tDateStr = t.date.split('T')[0]; // YYYY-MM-DD

      // Type Filter
      if (searchFilters.type !== 'ALL' && t.type !== searchFilters.type) return false;

      // Category Filter
      if (searchFilters.category !== 'ALL' && t.category !== searchFilters.category) return false;

      // Bank Filter
      if (searchFilters.bank !== 'ALL' && t.bank !== searchFilters.bank) return false;

      // Date Range Filter
      if (searchFilters.startDate && tDateStr < searchFilters.startDate) return false;
      if (searchFilters.endDate && tDateStr > searchFilters.endDate) return false;

      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [visibleTransactions, isSearchOpen, searchFilters]);

  // Dynamic Category List based on selected Type
  const availableFilterCategories = useMemo(() => {
    if (searchFilters.type === TransactionType.INCOME) {
      return Object.keys(transactionHierarchy[TransactionType.INCOME]).sort();
    }
    if (searchFilters.type === TransactionType.EXPENSE) {
      return Object.keys(transactionHierarchy[TransactionType.EXPENSE]).sort();
    }
    // If type is 'ALL', return empty so only 'Todas' is shown as per requirement
    return [];
  }, [searchFilters.type, transactionHierarchy]);

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

  const handlePrint = () => {
    const printContent = document.getElementById('printable-area');
    if (!printContent) return;

    const win = window.open('', '', 'height=700,width=900');
    if (!win) return;

    win.document.write('<html><head><title>Relatório de Transações</title>');
    win.document.write('<style>');
    win.document.write(`
      body { font-family: sans-serif; padding: 20px; color: #1B203C; }
      h1 { text-align: center; color: #0C2BD8; margin-bottom: 20px; }
      table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
      th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; }
      th { background-color: #f1f5f9; color: #475569; font-weight: bold; }
      .income { color: #16a34a; }
      .expense { color: #dc2626; }
      .header-info { margin-bottom: 20px; font-size: 14px; }
    `);
    win.document.write('</style></head><body>');
    win.document.write('<h1>Relatório Financeiro</h1>');
    
    // Add Filter Summary
    win.document.write('<div class="header-info">');
    win.document.write(`<p><strong>Período:</strong> ${searchFilters.startDate || 'Início'} até ${searchFilters.endDate || 'Hoje'}</p>`);
    win.document.write(`<p><strong>Registros encontrados:</strong> ${filteredSearchResults.length}</p>`);
    win.document.write('</div>');

    // Build Table
    let tableHtml = '<table><thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Banco</th><th>Tipo</th><th>Valor</th></tr></thead><tbody>';
    
    let totalIncome = 0;
    let totalExpense = 0;

    filteredSearchResults.forEach(t => {
      const date = new Date(t.date).toLocaleDateString('pt-BR');
      const amount = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount);
      const typeClass = t.type === TransactionType.INCOME ? 'income' : 'expense';
      const typeLabel = t.type === TransactionType.INCOME ? 'Entrada' : 'Saída';
      
      if (t.type === TransactionType.INCOME) totalIncome += t.amount;
      else totalExpense += t.amount;

      tableHtml += `<tr>
        <td>${date}</td>
        <td>${t.description}</td>
        <td>${t.category} - ${t.subCategory}</td>
        <td>${t.bank}</td>
        <td class="${typeClass}">${typeLabel}</td>
        <td class="${typeClass}">${amount}</td>
      </tr>`;
    });

    tableHtml += '</tbody></table>';
    
    // Summary Footer
    win.document.write(tableHtml);
    win.document.write('<div style="margin-top: 20px; text-align: right; font-size: 14px;">');
    win.document.write(`<p><strong>Total Entradas:</strong> <span class="income">${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalIncome)}</span></p>`);
    win.document.write(`<p><strong>Total Saídas:</strong> <span class="expense">${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalExpense)}</span></p>`);
    win.document.write(`<p><strong>Saldo no Período:</strong> <span>${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalIncome - totalExpense)}</span></p>`);
    win.document.write('</div>');

    win.document.write('</body></html>');
    win.document.close();
    win.print();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
  };

  return (
    <>
      <div className="bg-[#FBFBFB] rounded-2xl border border-slate-200 flex flex-col h-full shadow-sm overflow-hidden relative">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-[#FBFBFB] sticky top-0 z-10">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Histórico</h3>
            <div className="flex items-center gap-2 mt-0.5">
               <Calendar className="w-3.5 h-3.5 text-[#0C2BD8]" />
               <p className="text-xs font-semibold text-[#0C2BD8] uppercase tracking-wide">
                  {MONTH_NAMES[currentMonthIndex]} / {currentYear}
               </p>
            </div>
          </div>
          
          <button 
            onClick={() => setIsSearchOpen(true)}
            className="p-2 bg-white border border-slate-200 hover:border-[#0C2BD8] rounded-lg text-slate-400 hover:text-[#0C2BD8] transition-all shadow-sm group"
            title="Pesquisar Transações"
          >
            <Search className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>
        </div>
        
        <div className="overflow-y-auto flex-1 p-4 space-y-3 custom-scrollbar bg-slate-50/50">
          {currentMonthTransactions.length > 0 ? (
            currentMonthTransactions.map((t) => (
              <div 
                key={t.id} 
                className="group relative bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-[#0C2BD8]/30 transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${
                      t.type === TransactionType.INCOME 
                        ? 'bg-[#AFDE22]/20 text-[#AFDE22] border border-[#AFDE22]/30' 
                        : 'bg-red-50 text-red-600 border border-red-100'
                    }`}>
                      {t.type === TransactionType.INCOME 
                        ? <ArrowUpRight className="w-6 h-6" /> 
                        : <ArrowDownLeft className="w-6 h-6" />
                      }
                    </div>
                    
                    <div>
                      <p className="font-bold text-slate-800 text-sm md:text-base">{t.description}</p>
                      
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          <Tag className="w-3 h-3" />
                          {t.category}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {t.subCategory}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`block font-bold text-lg ${
                      t.type === TransactionType.INCOME ? 'text-[#AFDE22]' : 'text-red-600'
                    }`}>
                      {t.type === TransactionType.INCOME ? '+' : '-'}{formatCurrency(t.amount).replace(/^R\$\s?/, '')}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {new Date(t.date).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>

                {/* Footer details (Bank/Method) */}
                <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-4">
                      {(t.bank || t.paymentMethod) && (
                        <div className="flex items-center gap-1.5">
                            <CreditCard className="w-3 h-3 text-[#0C2BD8]" />
                            <span className="font-medium text-slate-600">{t.bank}</span>
                            <span className="text-slate-300">•</span>
                            <span>{t.paymentMethod}</span>
                        </div>
                      )}
                  </div>

                  <button 
                    onClick={(e) => { e.stopPropagation(); onDelete(t.id); }}
                    className="flex items-center gap-1 text-slate-400 hover:text-red-500 transition-colors px-2 py-1 rounded hover:bg-red-50"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Excluir</span>
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center flex flex-col items-center justify-center h-full text-slate-400 py-10">
              <Wallet className="w-12 h-12 mb-4 text-slate-200" />
              <h3 className="text-lg font-bold text-slate-600">Sem Movimentações</h3>
              <p className="text-sm">Nenhuma transação encontrada para este mês.</p>
            </div>
          )}
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
                 Filtrar Transações
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
                    {[30, 60, 90].map(days => (
                      <button 
                        key={days}
                        onClick={() => setQuickPeriod(days)}
                        className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-semibold rounded-lg hover:border-[#0C2BD8] hover:text-[#0C2BD8] transition-colors shadow-sm whitespace-nowrap"
                      >
                        Últimos {days} dias
                      </button>
                    ))}
                  </div>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                  <div>
                     <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Tipo</label>
                     <select 
                        value={searchFilters.type}
                        onChange={(e) => setSearchFilters(prev => ({ 
                           ...prev, 
                           type: e.target.value,
                           category: 'ALL' // Reset category when type changes
                        }))}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0C2BD8]/20 focus:border-[#0C2BD8]"
                     >
                        <option value="ALL">Todos</option>
                        <option value={TransactionType.INCOME}>Entradas</option>
                        <option value={TransactionType.EXPENSE}>Saídas</option>
                     </select>
                  </div>
                  
                  <div>
                     <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Categoria</label>
                     <select 
                        value={searchFilters.category}
                        onChange={(e) => setSearchFilters(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0C2BD8]/20 focus:border-[#0C2BD8]"
                     >
                        <option value="ALL">Todas</option>
                        {availableFilterCategories.map(c => <option key={c} value={c}>{c}</option>)}
                     </select>
                  </div>

                  <div>
                     <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Banco</label>
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
                           <th className="px-4 py-3 whitespace-nowrap">Descrição</th>
                           <th className="px-4 py-3 whitespace-nowrap">Categoria/Tipo</th>
                           <th className="px-4 py-3 whitespace-nowrap">Banco</th>
                           <th className="px-4 py-3 text-right whitespace-nowrap">Valor</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100 bg-white">
                        {filteredSearchResults.length > 0 ? (
                           filteredSearchResults.map(t => (
                              <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                                 <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                                    {new Date(t.date).toLocaleDateString('pt-BR')}
                                 </td>
                                 <td className="px-4 py-3 font-medium text-slate-800">
                                    {t.description}
                                 </td>
                                 <td className="px-4 py-3 text-slate-600">
                                    <div className="flex flex-col">
                                       <span className="text-xs font-bold">{t.category}</span>
                                       <span className="text-xs text-slate-400">{t.subCategory}</span>
                                    </div>
                                 </td>
                                 <td className="px-4 py-3 text-slate-600">
                                    {t.bank}
                                 </td>
                                 <td className={`px-4 py-3 text-right font-bold whitespace-nowrap ${
                                    t.type === TransactionType.INCOME ? 'text-[#AFDE22]' : 'text-red-600'
                                 }`}>
                                    {t.type === TransactionType.INCOME ? '+' : '-'}{formatCurrency(t.amount)}
                                 </td>
                              </tr>
                           ))
                        ) : (
                           <tr>
                              <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                                 Nenhuma transação encontrada com os filtros atuais.
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
                  Total de registros: <span className="font-bold text-slate-800">{filteredSearchResults.length}</span>
               </div>
               
               <button 
                  onClick={handlePrint}
                  disabled={filteredSearchResults.length === 0}
                  className="flex items-center gap-2 bg-[#1B203C] hover:bg-black text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-slate-300 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto justify-center"
               >
                  <Printer className="w-4 h-4" />
                  Salvar PDF / Imprimir
               </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default TransactionList;
