
import React, { useState, useMemo } from 'react';
import { Bill, Transaction, TransactionType, CreditCardConfig, MONTH_NAMES } from '../types';
import { FileText, Plus, Calendar, Check, Trash2, X, AlertCircle, Clock, ChevronLeft, ChevronRight, ArrowRight, DollarSign, Layers, PieChart, CheckCircle2, AlertTriangle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface BillsTabProps {
  bills: Bill[];
  cardConfigs: CreditCardConfig[];
  banks: string[];
  transactionHierarchy: Record<TransactionType, Record<string, string[]>>;
  onAddBill: (bill: Bill) => void;
  onDeleteBill: (id: string) => void;
  onUpdateBill: (bill: Bill) => void;
  onAddTransaction: (transaction: Transaction) => void;
}

interface BillCardProps {
  bill: Bill;
  displayInstallment: number;
  isPaid: boolean;
  selectedYear: number;
  selectedMonth: number;
  formatCurrency: (val: number) => string;
  onPassToNext: (bill: Bill) => void;
  onDelete: (bill: Bill) => void;
  onSettle: (bill: Bill, currentInstallment: number) => void;
  onPay: (bill: Bill) => void;
}

const BillCard: React.FC<BillCardProps> = ({ 
  bill, 
  displayInstallment, 
  isPaid, 
  selectedYear, 
  selectedMonth, 
  formatCurrency,
  onPassToNext,
  onDelete,
  onSettle,
  onPay
}) => {
    const isLastInstallment = bill.type === 'INSTALLMENT' && displayInstallment === bill.totalInstallments;
    let status: 'PAID' | 'PENDING' | 'OVERDUE' = 'PENDING';
    if (isPaid) { status = 'PAID'; } 
    else {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        const currentDay = now.getDate();
        if (selectedYear < currentYear || (selectedYear === currentYear && selectedMonth < currentMonth)) { status = 'OVERDUE'; }
        else if (selectedYear === currentYear && selectedMonth === currentMonth) {
            const lastDayOfViewMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
            if (Math.min(bill.dueDay, lastDayOfViewMonth) < currentDay) status = 'OVERDUE';
        }
    }

    return (
      <div className={`border rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 relative group ${status === 'PAID' ? 'bg-emerald-50/30 border-emerald-200' : status === 'OVERDUE' ? 'bg-red-50/30 border-red-200' : 'bg-white border-slate-200'}`}>
        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
           <button onClick={() => onPassToNext(bill)} className="p-2 bg-white rounded-lg shadow-sm border border-slate-100 text-slate-400 hover:text-blue-500 hover:border-blue-100"><ArrowRight className="w-4 h-4" /></button>
           <button onClick={() => onDelete(bill)} className="p-2 bg-white rounded-lg shadow-sm border border-slate-100 text-slate-400 hover:text-red-500 hover:border-red-100"><Trash2 className="w-4 h-4" /></button>
        </div>
        <div className="flex justify-between items-start mb-4">
           <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-slate-100 text-[#0C2BD8]"><Layers className="w-5 h-5" /></div>
              <div>
                 <h4 className="font-bold text-slate-800 text-base">{bill.description}</h4>
                 <p className="text-xs text-slate-500 font-medium mt-0.5">{bill.category} • {bill.subCategory}</p>
              </div>
           </div>
        </div>
        <div className="flex items-end justify-between mb-4">
           <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Vencimento</p>
              <div className="flex items-center gap-2 text-slate-700 font-medium"><Calendar className="w-4 h-4 text-slate-400" /> Dia {bill.dueDay}</div>
           </div>
           <div className="text-right">
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Valor</p>
              <p className="text-xl font-bold text-slate-900">{formatCurrency(bill.amount)}</p>
           </div>
        </div>
        <div className="space-y-3">
           {bill.type === 'INSTALLMENT' && (
             <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div className={`h-full rounded-full ${isLastInstallment ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${(displayInstallment / (bill.totalInstallments || 1)) * 100}%` }}></div>
             </div>
           )}
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                 {bill.type === 'INSTALLMENT' && <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-1 rounded-md border border-slate-200">{displayInstallment}/{bill.totalInstallments}</span>}
                 <span className={`text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 ${status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : status === 'OVERDUE' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                    {status === 'OVERDUE' && <AlertTriangle className="w-3 h-3" />}
                    {status === 'PAID' && <CheckCircle2 className="w-3 h-3" />}
                    {status === 'PAID' ? 'Pago' : status === 'OVERDUE' ? 'Atrasado' : 'Pendente'}
                 </span>
              </div>
              {!isPaid && (
                 <div className="flex gap-2">
                    {bill.type === 'INSTALLMENT' && <button onClick={() => onSettle(bill, displayInstallment)} className="text-xs font-semibold text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">Quitar</button>}
                    <button onClick={() => onPay(bill)} className="text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 px-4 py-1.5 rounded-lg transition-colors shadow-sm flex items-center gap-1"><Check className="w-3 h-3" /> Pagar</button>
                 </div>
              )}
           </div>
        </div>
      </div>
    );
};

const BillsTab: React.FC<BillsTabProps> = ({ 
  bills, 
  cardConfigs,
  banks,
  transactionHierarchy,
  onAddBill, 
  onDeleteBill, 
  onUpdateBill,
  onAddTransaction 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  // Settle (Quitar) Modal State
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [settleData, setSettleData] = useState<{ bill: Bill, remainingInstallments: number, totalValue: number } | null>(null);

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [billToDelete, setBillToDelete] = useState<Bill | null>(null);
  const [deleteMode, setDeleteMode] = useState<'CURRENT' | 'ALL'>('CURRENT');

  // Date Filtering
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Form State
  const initialHierarchy = transactionHierarchy[TransactionType.EXPENSE] || {};
  const initialCategories = Object.keys(initialHierarchy);
  
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDay, setDueDay] = useState('');
  
  const [category, setCategory] = useState(initialCategories[0] || ''); 
  
  // Safety check for subcategories
  const initialSubCats = (category && initialHierarchy[category]) || [];
  const [subCategory, setSubCategory] = useState(initialSubCats[0] || '');

  const [billType, setBillType] = useState<'FIXED' | 'INSTALLMENT'>('FIXED');
  const [totalInstallments, setTotalInstallments] = useState('');
  
  const [installmentValueType, setInstallmentValueType] = useState<'PARCEL' | 'TOTAL'>('PARCEL');
  const [formStartDate, setFormStartDate] = useState(new Date().toISOString().split('T')[0]);

  // Payment Modal State
  const [payAmount, setPayAmount] = useState('');
  const [payBank, setPayBank] = useState(banks[0] || 'Carteira');
  const [payMethod, setPayMethod] = useState('Pix');

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
    const hierarchy = transactionHierarchy[TransactionType.EXPENSE] || {};
    const newSubCats = (newCategory && hierarchy[newCategory]) || [];
    
    if (newSubCats && newSubCats.length > 0) {
      setSubCategory(newSubCats[0]);
    } else {
        setSubCategory('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !dueDay) return;

    let finalAmount = parseFloat(amount);

    if (billType === 'INSTALLMENT' && installmentValueType === 'TOTAL') {
        const installments = parseInt(totalInstallments);
        if (installments > 0) {
            finalAmount = finalAmount / installments;
        }
    }

    const startDate = new Date(formStartDate);
    startDate.setHours(12, 0, 0, 0);

    const newBill: Bill = {
      id: uuidv4(),
      description,
      amount: finalAmount,
      dueDay: parseInt(dueDay),
      category,
      subCategory,
      type: billType,
      startDate: startDate.toISOString(),
      totalInstallments: billType === 'INSTALLMENT' ? parseInt(totalInstallments) : undefined,
      currentInstallment: 0,
      paymentHistory: [],
      exclusions: []
    };

    onAddBill(newBill);
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setDueDay('');
    
    const hierarchy = transactionHierarchy[TransactionType.EXPENSE] || {};
    const cats = Object.keys(hierarchy);
    const firstCat = cats[0] || '';
    setCategory(firstCat);
    
    const subCats = (firstCat && hierarchy[firstCat]) || [];
    setSubCategory(subCats[0] || '');
    
    setBillType('FIXED');
    setTotalInstallments('');
    setInstallmentValueType('PARCEL');
    setFormStartDate(new Date().toISOString().split('T')[0]);
  };

  const openPayModal = (bill: Bill) => {
    setSelectedBill(bill);
    setPayAmount(bill.amount.toFixed(2));
    setIsPayModalOpen(true);
  };

  const openDeleteModal = (bill: Bill) => {
    setBillToDelete(bill);
    setDeleteMode('CURRENT');
    setIsDeleteModalOpen(true);
  };

  const handlePassToNextMonth = (bill: Bill) => {
      const exclusionKey = `${selectedYear}-${selectedMonth}`;
      const updatedExclusions = [...(bill.exclusions || []), exclusionKey];
      const updatedOriginalBill: Bill = { ...bill, exclusions: updatedExclusions };
      onUpdateBill(updatedOriginalBill);

      let nextMonth = selectedMonth + 1;
      let nextYear = selectedYear;
      if (nextMonth > 11) { nextMonth = 0; nextYear += 1; }
      
      const originMonthName = MONTH_NAMES[selectedMonth].toUpperCase();
      const newTitle = `${bill.description} (CONTA DE ${originMonthName}/${selectedYear})`;
      
      const startDate = new Date(nextYear, nextMonth, 1);
      startDate.setHours(12, 0, 0, 0);
      const endDate = new Date(nextYear, nextMonth + 1, 0);
      endDate.setHours(23, 59, 59, 999);

      const newBill: Bill = {
          id: uuidv4(),
          description: newTitle,
          amount: bill.amount,
          dueDay: bill.dueDay,
          category: bill.category,
          subCategory: bill.subCategory,
          type: bill.type,
          startDate: startDate.toISOString(),
          endDate: bill.type === 'FIXED' ? endDate.toISOString() : undefined,
          totalInstallments: bill.type === 'INSTALLMENT' ? 1 : undefined,
          paymentHistory: [],
          exclusions: []
      };
      onAddBill(newBill);
  };

  const handleConfirmDelete = () => {
    if (!billToDelete) return;
    if (deleteMode === 'ALL') {
      onDeleteBill(billToDelete.id);
    } else {
      const exclusionKey = `${selectedYear}-${selectedMonth}`;
      const updatedExclusions = [...(billToDelete.exclusions || []), exclusionKey];
      const updatedBill: Bill = { ...billToDelete, exclusions: updatedExclusions };
      onUpdateBill(updatedBill);
    }
    setIsDeleteModalOpen(false);
    setBillToDelete(null);
  };

  const handleOpenSettleModal = (bill: Bill, currentInstallmentNum: number) => {
     if (bill.type !== 'INSTALLMENT' || !bill.totalInstallments) return;
     const remaining = bill.totalInstallments - currentInstallmentNum + 1;
     if (remaining <= 0) return;
     const totalValue = remaining * bill.amount;
     setSettleData({ bill, remainingInstallments: remaining, totalValue });
     setPayAmount(totalValue.toFixed(2));
     setIsSettleModalOpen(true);
  };

  const handleConfirmSettle = (e: React.FormEvent) => {
      e.preventDefault();
      if (!settleData) return;
      const { bill, remainingInstallments } = settleData;
      const transaction: Transaction = {
          id: uuidv4(),
          amount: parseFloat(payAmount),
          description: `Quitação ${bill.description} (${remainingInstallments} parcelas rest.)`,
          date: new Date().toISOString(),
          type: TransactionType.EXPENSE,
          category: bill.category,
          subCategory: bill.subCategory,
          bank: payBank,
          paymentMethod: payMethod
      };
      onAddTransaction(transaction);

      const newPaymentDates: string[] = [];
      let iteratorDate = new Date(selectedYear, selectedMonth, 1);
      for (let i = 0; i < remainingInstallments; i++) {
          newPaymentDates.push(iteratorDate.toISOString());
          iteratorDate = new Date(iteratorDate.getFullYear(), iteratorDate.getMonth() + 1, 1);
      }
      const updatedHistory = [...(bill.paymentHistory || []), ...newPaymentDates];
      const updatedBill: Bill = { ...bill, paymentHistory: updatedHistory, lastPaidDate: new Date().toISOString() };
      onUpdateBill(updatedBill);
      setIsSettleModalOpen(false);
      setSettleData(null);
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBill || !payAmount) return;
    let dynamicInstallmentInfo = selectedBill.type === 'INSTALLMENT' ? ` (Parcela)` : ' (Conta)';
    
    const transaction: Transaction = {
      id: uuidv4(),
      amount: parseFloat(payAmount),
      description: `${selectedBill.description}${dynamicInstallmentInfo}`,
      date: new Date().toISOString(),
      type: TransactionType.EXPENSE,
      category: selectedBill.category,
      subCategory: selectedBill.subCategory,
      bank: payBank,
      paymentMethod: payMethod
    };
    onAddTransaction(transaction);

    const referenceDate = new Date(selectedYear, selectedMonth, Math.min(selectedBill.dueDay, 28), 12, 0, 0);
    const updatedHistory = [...(selectedBill.paymentHistory || []), referenceDate.toISOString()];
    
    let updatedBill = { ...selectedBill, paymentHistory: updatedHistory, lastPaidDate: new Date().toISOString() };
    if (selectedBill.type === 'INSTALLMENT') {
      updatedBill.currentInstallment = (selectedBill.currentInstallment || 0) + 1;
    }
    onUpdateBill(updatedBill);
    setIsPayModalOpen(false);
    setSelectedBill(null);
  };

  const availablePaymentMethods = useMemo(() => {
    const baseMethods = ['Pix', 'Dinheiro', 'Boleto', 'Débito'];
    const cards = cardConfigs.filter(c => c.bank === payBank);
    const cardMethods = cards.map(c => `Crédito ${c.name}`);
    return [...baseMethods, ...cardMethods];
  }, [payBank, cardConfigs]);

  const processedBills = useMemo(() => {
    return bills.map(bill => {
        let displayInstallment = 0;
        let isVisible = true;
        const exclusionKey = `${selectedYear}-${selectedMonth}`;
        if (bill.exclusions && bill.exclusions.includes(exclusionKey)) return { ...bill, isVisible: false, displayInstallment: 0, isPaid: false };
        
        if (bill.endDate) {
          const end = new Date(bill.endDate);
          const viewMonthIndex = selectedYear * 12 + selectedMonth;
          const endMonthIndex = end.getFullYear() * 12 + end.getMonth();
          if (viewMonthIndex > endMonthIndex) isVisible = false;
        }

        if (bill.type === 'INSTALLMENT') {
            if (bill.startDate) {
                const start = new Date(bill.startDate);
                const diffMonths = (selectedYear - start.getFullYear()) * 12 + (selectedMonth - start.getMonth());
                displayInstallment = diffMonths + 1;
                if (displayInstallment < 1 || displayInstallment > (bill.totalInstallments || 0)) isVisible = false;
            }
        } else {
            if (bill.startDate) {
                const start = new Date(bill.startDate);
                const viewDate = new Date(selectedYear, selectedMonth + 1, 0);
                if (start > viewDate) isVisible = false;
            }
        }

        const isPaid = bill.paymentHistory.some(dateStr => {
            const d = new Date(dateStr);
            return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
        });
        
        return { ...bill, displayInstallment, isVisible, isPaid };
    }).filter(b => b.isVisible);
  }, [bills, selectedYear, selectedMonth]);

  const summaryStats = useMemo(() => {
    const totalAmount = processedBills.reduce((acc, b) => acc + b.amount, 0);
    const paidAmount = processedBills.filter(b => b.isPaid).reduce((acc, b) => acc + b.amount, 0);
    const pendingAmount = totalAmount - paidAmount;
    
    const now = new Date();
    const currentDay = now.getDate();
    const isCurrentMonth = selectedMonth === now.getMonth() && selectedYear === now.getFullYear();
    const isPast = (selectedYear < now.getFullYear()) || (selectedYear === now.getFullYear() && selectedMonth < now.getMonth());

    const overdueCount = processedBills.filter(b => {
      if (b.isPaid) return false;
      if (isPast) return true;
      if (isCurrentMonth && b.dueDay < currentDay) return true;
      return false;
    }).length;

    return { totalAmount, paidAmount, pendingAmount, overdueCount };
  }, [processedBills, selectedMonth, selectedYear]);

  const expenseHierarchy = transactionHierarchy[TransactionType.EXPENSE] || {};
  const currentSubCategories = (category && expenseHierarchy[category]) || [];

  const fixedBills = processedBills.filter(b => b.type === 'FIXED');
  const installmentBills = processedBills.filter(b => b.type === 'INSTALLMENT');

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Date Filter & Header */}
      <div className="flex flex-col md:flex-row items-end justify-between gap-4">
        <div>
           <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
             <FileText className="w-7 h-7 text-[#0C2BD8]" />
             Contas a Pagar
           </h2>
           <p className="text-slate-500 mt-1">Controle de vencimentos e pagamentos mensais.</p>
        </div>
        
        <div className="bg-[#FBFBFB] p-1.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-1">
          <div className="flex items-center bg-slate-50 rounded-lg border border-slate-200">
            <button onClick={() => setSelectedYear(prev => prev - 1)} className="p-2 text-slate-400 hover:text-white hover:bg-[#0C2BD8] rounded-l-lg transition-colors"><ChevronLeft className="w-4 h-4" /></button>
            <span className="px-3 text-sm font-bold text-slate-700 min-w-[60px] text-center">{selectedYear}</span>
            <button onClick={() => setSelectedYear(prev => prev + 1)} className="p-2 text-slate-400 hover:text-white hover:bg-[#0C2BD8] rounded-r-lg transition-colors"><ChevronRight className="w-4 h-4" /></button>
          </div>
          <div className="w-px h-6 bg-slate-200 mx-1"></div>
          <div className="relative">
             <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="appearance-none bg-transparent text-slate-700 text-sm font-bold pl-3 pr-8 py-2 focus:outline-none cursor-pointer hover:text-black transition-colors">
               {MONTH_NAMES.map((m, idx) => <option key={idx} value={idx}>{m}</option>)}
             </select>
             <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"><Calendar className="w-3.5 h-3.5 text-slate-400" /></div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-[#FBFBFB] p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-[#0C2BD8]/10 rounded-full text-[#0C2BD8]"><PieChart className="w-6 h-6" /></div>
            <div>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total a Pagar</p>
               <p className="text-2xl font-bold text-slate-900">{formatCurrency(summaryStats.totalAmount)}</p>
            </div>
         </div>
         <div className="bg-[#FBFBFB] p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-[#AFDE22]/20 rounded-full text-[#AFDE22]"><CheckCircle2 className="w-6 h-6" /></div>
            <div>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Pago</p>
               <p className="text-2xl font-bold text-[#AFDE22]">{formatCurrency(summaryStats.paidAmount)}</p>
            </div>
         </div>
         <div className="bg-[#FBFBFB] p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className={`p-3 rounded-full ${summaryStats.overdueCount > 0 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
               <AlertCircle className="w-6 h-6" />
            </div>
            <div>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pendente</p>
               <p className={`text-2xl font-bold ${summaryStats.pendingAmount > 0 ? 'text-red-600' : 'text-slate-900'}`}>{formatCurrency(summaryStats.pendingAmount)}</p>
               {summaryStats.overdueCount > 0 && <span className="text-xs text-red-600 font-bold">{summaryStats.overdueCount} atrasada(s)</span>}
            </div>
         </div>
      </div>

      <div className="flex justify-end">
         <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-[#0C2BD8] hover:bg-[#0C2BD8]/90 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-200 transition-all"
         >
            <Plus className="w-4 h-4" />
            Nova Conta
         </button>
      </div>

      {/* Bills Content */}
      <div className="space-y-8">
         {/* Fixed Bills */}
         <section>
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
               <Clock className="w-5 h-5 text-[#0C2BD8]" /> Contas Fixas
            </h3>
            {processedBills.filter(b => b.type === 'FIXED').length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {fixedBills.map(bill => (
                    <BillCard 
                      key={bill.id} 
                      bill={bill} 
                      displayInstallment={bill.displayInstallment} 
                      isPaid={bill.isPaid}
                      selectedYear={selectedYear}
                      selectedMonth={selectedMonth}
                      formatCurrency={formatCurrency}
                      onPassToNext={handlePassToNextMonth}
                      onDelete={openDeleteModal}
                      onSettle={handleOpenSettleModal}
                      onPay={openPayModal}
                    />
                  ))}
               </div>
            ) : (
               <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <p>Nenhuma conta fixa para este mês.</p>
               </div>
            )}
         </section>

         {/* Installments */}
         <section>
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
               <AlertCircle className="w-5 h-5 text-[#0C2BD8]" /> Parcelamentos
            </h3>
            {processedBills.filter(b => b.type === 'INSTALLMENT').length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {installmentBills.map(bill => (
                    <BillCard 
                      key={bill.id} 
                      bill={bill} 
                      displayInstallment={bill.displayInstallment} 
                      isPaid={bill.isPaid}
                      selectedYear={selectedYear}
                      selectedMonth={selectedMonth}
                      formatCurrency={formatCurrency}
                      onPassToNext={handlePassToNextMonth}
                      onDelete={openDeleteModal}
                      onSettle={handleOpenSettleModal}
                      onPay={openPayModal}
                    />
                  ))}
               </div>
            ) : (
               <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <p>Nenhum parcelamento para este mês.</p>
               </div>
            )}
         </section>
      </div>

      {/* Add Bill Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh] custom-scrollbar">
            {/* ... header ... */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                 <Plus className="w-5 h-5 text-indigo-600" />
                 Nova Conta
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Descrição</label>
                <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="ex: Netflix" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Valor (R$)</label>
                    <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" required />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Dia Vencimento</label>
                    <input type="number" min="1" max="31" value={dueDay} onChange={(e) => setDueDay(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" required />
                 </div>
              </div>

              {/* Dynamic Categories */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Categoria</label>
                  <select value={category} onChange={(e) => handleCategoryChange(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
                     {Object.keys(transactionHierarchy[TransactionType.EXPENSE] || {}).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tipo</label>
                  <select value={subCategory} onChange={(e) => setSubCategory(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
                     {currentSubCategories.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tipo da Conta</label>
                <div className="flex bg-slate-50 rounded-xl p-1 border border-slate-200">
                  <button type="button" onClick={() => setBillType('FIXED')} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${billType === 'FIXED' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Fixa Mensal</button>
                  <button type="button" onClick={() => setBillType('INSTALLMENT')} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${billType === 'INSTALLMENT' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Parcelada</button>
                </div>
              </div>

              {billType === 'INSTALLMENT' && (
                <div className="space-y-4 bg-amber-50/50 p-5 rounded-xl border border-amber-100">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Data de Início</label>
                            <input type="date" value={formStartDate} onChange={(e) => setFormStartDate(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nº Parcelas</label>
                            <input type="number" min="2" value={totalInstallments} onChange={(e) => setTotalInstallments(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500" required />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-2">O valor inserido acima é:</label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer font-medium bg-white px-3 py-2 rounded-lg border border-slate-200 flex-1 justify-center hover:border-amber-300 transition-colors">
                                <input type="radio" name="valueType" checked={installmentValueType === 'PARCEL'} onChange={() => setInstallmentValueType('PARCEL')} className="text-amber-600 focus:ring-amber-500" /> Valor da Parcela
                            </label>
                            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer font-medium bg-white px-3 py-2 rounded-lg border border-slate-200 flex-1 justify-center hover:border-amber-300 transition-colors">
                                <input type="radio" name="valueType" checked={installmentValueType === 'TOTAL'} onChange={() => setInstallmentValueType('TOTAL')} className="text-amber-600 focus:ring-amber-500" /> Valor Total
                            </label>
                        </div>
                    </div>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                 <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition-colors font-medium">Cancelar</button>
                 <button type="submit" className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl mt-0 font-medium shadow-lg shadow-indigo-200">Salvar Conta</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Modal */}
      {isPayModalOpen && selectedBill && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
               <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">Confirmar Pagamento</h3>
               </div>
               <button onClick={() => setIsPayModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleConfirmPayment}>
              <div className="space-y-4 mb-6">
                 <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Valor do Pagamento</p>
                    <input 
                      type="number" 
                      step="0.01" 
                      value={payAmount} 
                      onChange={(e) => setPayAmount(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                       <FileText className="w-3 h-3" />
                       {selectedBill.description}
                    </p>
                 </div>
                 
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Conta de Saída</label>
                    <select 
                      value={payBank} 
                      onChange={(e) => setPayBank(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                       {banks.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                 </div>

                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Forma de Pagamento</label>
                    <select 
                      value={payMethod} 
                      onChange={(e) => setPayMethod(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                       {availablePaymentMethods.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                 </div>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setIsPayModalOpen(false)} className="flex-1 px-4 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition-colors font-medium">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors font-medium flex items-center justify-center gap-2 shadow-lg shadow-emerald-200">
                  <Check className="w-4 h-4" /> Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settle Modal */}
      {isSettleModalOpen && settleData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800">Quitar Parcelamento</h3>
                <button onClick={() => setIsSettleModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
             </div>
             
             <form onSubmit={handleConfirmSettle}>
                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 mb-4">
                   <p className="font-bold text-indigo-900">{settleData.bill.description}</p>
                   <p className="text-sm text-indigo-700 mt-1">Restam {settleData.remainingInstallments} parcelas</p>
                </div>
                
                <div className="mb-4">
                   <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Valor Total para Quitação</label>
                   <input type="number" step="0.01" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                   <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Conta</label>
                      <select value={payBank} onChange={(e) => setPayBank(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                         {banks.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Pagamento</label>
                      <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                         {availablePaymentMethods.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                   </div>
                </div>

                <div className="flex gap-3">
                   <button type="button" onClick={() => setIsSettleModalOpen(false)} className="flex-1 px-4 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-medium">Cancelar</button>
                   <button type="submit" className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-lg">Confirmar Quitação</button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && billToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
              <h3 className="text-xl font-bold text-red-600 mb-2">Excluir Conta</h3>
              <p className="text-slate-600 mb-6">Deseja excluir "{billToDelete.description}"?</p>
              
              <div className="space-y-3 mb-6">
                 <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                    <input type="radio" name="deleteMode" checked={deleteMode === 'CURRENT'} onChange={() => setDeleteMode('CURRENT')} className="text-red-600 focus:ring-red-500" />
                    <span className="text-sm font-medium text-slate-700">Apenas deste mês ({MONTH_NAMES[selectedMonth]})</span>
                 </label>
                 <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                    <input type="radio" name="deleteMode" checked={deleteMode === 'ALL'} onChange={() => setDeleteMode('ALL')} className="text-red-600 focus:ring-red-500" />
                    <span className="text-sm font-medium text-slate-700">Todas as ocorrências (Definitivo)</span>
                 </label>
              </div>

              <div className="flex gap-3">
                 <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 px-4 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-medium">Cancelar</button>
                 <button onClick={handleConfirmDelete} className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium shadow-lg">Excluir</button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default BillsTab;
