
import React, { useState, useMemo } from 'react';
import { Bill, Transaction, TransactionType, CreditCardConfig, MONTH_NAMES } from '../types';
import { FileText, Plus, Calendar, Check, Trash2, X, AlertCircle, Clock, ChevronLeft, ChevronRight, ArrowRight, DollarSign, Layers, PieChart, CheckCircle2, AlertTriangle, Scale, MinusCircle } from 'lucide-react';
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
  onAbate: (bill: Bill) => void; // New prop for Debts
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
  onPay,
  onAbate
}) => {
    const isDebt = bill.type === 'DEBT';
    
    // Logic for standard bills
    const isLastInstallment = bill.type === 'INSTALLMENT' && displayInstallment === bill.totalInstallments;
    let status: 'PAID' | 'PENDING' | 'OVERDUE' | 'ACTIVE' = 'PENDING';
    
    if (isDebt) {
        status = 'ACTIVE';
        if (bill.isSettled) status = 'PAID';
    } else {
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
    }

    const currentBalance = bill.currentBalance ?? bill.amount;
    const progress = isDebt ? ((bill.amount - currentBalance) / bill.amount) * 100 : 0;

    return (
      <div className={`border rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 relative group ${
        status === 'PAID' ? 'bg-emerald-50/30 border-emerald-200' : 
        status === 'OVERDUE' ? 'bg-red-50/30 border-red-200' : 
        isDebt ? 'bg-slate-50/50 border-slate-200' : 'bg-white border-slate-200'
      }`}>
        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
           {/* For DEBT, PassToNext doesn't make sense as it persists automatically */}
           {!isDebt && <button onClick={() => onPassToNext(bill)} className="p-2 bg-white rounded-lg shadow-sm border border-slate-100 text-slate-400 hover:text-blue-500 hover:border-blue-100"><ArrowRight className="w-4 h-4" /></button>}
           <button onClick={() => onDelete(bill)} className="p-2 bg-white rounded-lg shadow-sm border border-slate-100 text-slate-400 hover:text-red-500 hover:border-red-100"><Trash2 className="w-4 h-4" /></button>
        </div>
        
        <div className="flex justify-between items-start mb-4">
           <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${isDebt ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-[#0C2BD8]'}`}>
                 {isDebt ? <Scale className="w-5 h-5" /> : <Layers className="w-5 h-5" />}
              </div>
              <div>
                 <h4 className="font-bold text-slate-800 text-base">{bill.description}</h4>
                 <p className="text-xs text-slate-500 font-medium mt-0.5">{bill.category} • {bill.subCategory}</p>
              </div>
           </div>
        </div>

        {isDebt ? (
           // DEBT Layout
           <div className="mb-4">
              <div className="flex justify-between items-end mb-2">
                 <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Saldo Devedor</p>
                    <p className="text-xl font-bold text-slate-900">{formatCurrency(currentBalance)}</p>
                 </div>
                 <div className="text-right">
                    <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Original</p>
                    <p className="text-sm font-semibold text-slate-600">{formatCurrency(bill.amount)}</p>
                 </div>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden mb-1">
                  <div className="h-full rounded-full bg-orange-500" style={{ width: `${Math.min(100, progress)}%` }}></div>
              </div>
              <p className="text-[10px] text-slate-400 text-right">{progress.toFixed(0)}% pago</p>
           </div>
        ) : (
           // Standard Bill Layout
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
        )}

        <div className="space-y-3">
           {bill.type === 'INSTALLMENT' && (
             <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div className={`h-full rounded-full ${isLastInstallment ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${(displayInstallment / (bill.totalInstallments || 1)) * 100}%` }}></div>
             </div>
           )}
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                 {bill.type === 'INSTALLMENT' && <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-1 rounded-md border border-slate-200">{displayInstallment}/{bill.totalInstallments}</span>}
                 
                 {isDebt ? (
                     <span className={`text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 ${currentBalance <= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                        {currentBalance <= 0 ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                        {currentBalance <= 0 ? 'Quitado' : 'Em Aberto'}
                     </span>
                 ) : (
                     <span className={`text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 ${status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : status === 'OVERDUE' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                        {status === 'OVERDUE' && <AlertTriangle className="w-3 h-3" />}
                        {status === 'PAID' && <CheckCircle2 className="w-3 h-3" />}
                        {status === 'PAID' ? 'Pago' : status === 'OVERDUE' ? 'Atrasado' : 'Pendente'}
                     </span>
                 )}
              </div>

              {/* Actions */}
              {!isPaid && !isDebt && (
                 <div className="flex gap-2">
                    {bill.type === 'INSTALLMENT' && <button onClick={() => onSettle(bill, displayInstallment)} className="text-xs font-semibold text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">Quitar</button>}
                    <button onClick={() => onPay(bill)} className="text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 px-4 py-1.5 rounded-lg transition-colors shadow-sm flex items-center gap-1"><Check className="w-3 h-3" /> Pagar</button>
                 </div>
              )}
              
              {isDebt && currentBalance > 0 && (
                  <button onClick={() => onAbate(bill)} className="text-xs font-bold bg-orange-600 text-white hover:bg-orange-700 px-4 py-1.5 rounded-lg transition-colors shadow-sm flex items-center gap-1">
                      <MinusCircle className="w-3 h-3" /> Abater
                  </button>
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

  // Abate (Dívida) Modal State
  const [isAbateModalOpen, setIsAbateModalOpen] = useState(false);
  
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

  const [billType, setBillType] = useState<'FIXED' | 'INSTALLMENT' | 'DEBT'>('FIXED');
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
    if (!description || !amount) return;

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
      dueDay: parseInt(dueDay) || 1, // Optional for debt
      category,
      subCategory,
      type: billType,
      startDate: startDate.toISOString(),
      totalInstallments: billType === 'INSTALLMENT' ? parseInt(totalInstallments) : undefined,
      currentInstallment: 0,
      paymentHistory: [],
      exclusions: [],
      // Debt fields initialization
      currentBalance: billType === 'DEBT' ? finalAmount : undefined,
      isSettled: false
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

  const openAbateModal = (bill: Bill) => {
      setSelectedBill(bill);
      setPayAmount('');
      setIsAbateModalOpen(true);
  };

  const openDeleteModal = (bill: Bill) => {
    setBillToDelete(bill);
    setDeleteMode(bill.type === 'DEBT' ? 'ALL' : 'CURRENT');
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

  const handleConfirmAbate = (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedBill || !payAmount) return;

      const amountToPay = parseFloat(payAmount);
      
      const transaction: Transaction = {
          id: uuidv4(),
          amount: amountToPay,
          description: `Abatimento Dívida: ${selectedBill.description}`,
          date: new Date().toISOString(),
          type: TransactionType.EXPENSE,
          category: selectedBill.category,
          subCategory: selectedBill.subCategory,
          bank: payBank,
          paymentMethod: payMethod
      };
      onAddTransaction(transaction);

      const currentBalance = selectedBill.currentBalance ?? selectedBill.amount;
      const newBalance = Math.max(0, currentBalance - amountToPay);
      const isSettled = newBalance <= 0.01; // Small tolerance for floats

      const updatedBill: Bill = { 
          ...selectedBill, 
          currentBalance: newBalance,
          isSettled: isSettled,
          settledDate: isSettled ? new Date().toISOString() : undefined
      };
      
      onUpdateBill(updatedBill);
      setIsAbateModalOpen(false);
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
        
        // DEBT LOGIC
        if (bill.type === 'DEBT') {
            const viewDateStart = new Date(selectedYear, selectedMonth, 1);
            // If debt started after current view period
            if (bill.startDate && new Date(bill.startDate) > new Date(selectedYear, selectedMonth + 1, 0)) {
                isVisible = false;
            }
            // If settled in a previous month, hide it
            if (bill.isSettled && bill.settledDate) {
                const settledDate = new Date(bill.settledDate);
                // "Ex: quitou em Abril. Maio não aparece."
                // So if settledDate < StartOfViewMonth, hide.
                if (settledDate < viewDateStart) {
                    isVisible = false;
                }
            }
            return { ...bill, displayInstallment: 0, isVisible, isPaid: !!bill.isSettled };
        }

        // STANDARD BILL LOGIC
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
    // Filter standard bills only for monthly summary
    const monthlyBills = processedBills.filter(b => b.type !== 'DEBT');
    
    const totalAmount = monthlyBills.reduce((acc, b) => acc + b.amount, 0);
    const paidAmount = monthlyBills.filter(b => b.isPaid).reduce((acc, b) => acc + b.amount, 0);
    const pendingAmount = totalAmount - paidAmount;
    
    const now = new Date();
    const currentDay = now.getDate();
    const isCurrentMonth = selectedMonth === now.getMonth() && selectedYear === now.getFullYear();
    const isPast = (selectedYear < now.getFullYear()) || (selectedYear === now.getFullYear() && selectedMonth < now.getMonth());

    const overdueCount = monthlyBills.filter(b => {
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
  const debtBills = processedBills.filter(b => b.type === 'DEBT');

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Date Filter & Header */}
      <div className="flex flex-col md:flex-row items-end justify-between gap-4">
        <div>
           <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
             <FileText className="w-7 h-7 text-[#0C2BD8]" />
             Contas a Pagar
           </h2>
           <p className="text-slate-500 mt-1">Controle de vencimentos, parcelas e dívidas.</p>
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
               <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total a Pagar (Mês)</p>
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
            Nova Conta / Dívida
         </button>
      </div>

      {/* Bills Content */}
      <div className="space-y-8">
         
         {/* Fixed Bills */}
         {fixedBills.length > 0 && (
             <section>
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                   <Clock className="w-5 h-5 text-[#0C2BD8]" /> Contas Fixas
                </h3>
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
                       onAbate={() => {}}
                     />
                   ))}
                </div>
             </section>
         )}

         {/* Installments */}
         {installmentBills.length > 0 && (
             <section>
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                   <AlertCircle className="w-5 h-5 text-[#0C2BD8]" /> Parcelamentos
                </h3>
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
                       onAbate={() => {}}
                     />
                   ))}
                </div>
             </section>
         )}

         {/* Debts Section */}
         {debtBills.length > 0 && (
             <section>
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                   <Scale className="w-5 h-5 text-orange-600" /> Dívidas em Aberto
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {debtBills.map(bill => (
                     <BillCard 
                       key={bill.id} 
                       bill={bill} 
                       displayInstallment={0} 
                       isPaid={!!bill.isSettled}
                       selectedYear={selectedYear}
                       selectedMonth={selectedMonth}
                       formatCurrency={formatCurrency}
                       onPassToNext={handlePassToNextMonth}
                       onDelete={openDeleteModal}
                       onSettle={() => {}} // Not used for DEBT
                       onPay={() => {}} // Not used for DEBT
                       onAbate={openAbateModal}
                     />
                   ))}
                </div>
             </section>
         )}
         
         {processedBills.length === 0 && (
            <div className="text-center py-10 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>Nenhuma conta, parcelamento ou dívida ativa para este mês.</p>
            </div>
         )}
      </div>

      {/* Add Bill Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh] custom-scrollbar">
            {/* ... header ... */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                 <Plus className="w-5 h-5 text-indigo-600" />
                 Nova Conta / Dívida
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Descrição</label>
                <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="ex: Empréstimo, Netflix" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" required />
              </div>
              
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tipo de Cadastro</label>
                <div className="flex bg-slate-50 rounded-xl p-1 border border-slate-200">
                  <button type="button" onClick={() => setBillType('FIXED')} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${billType === 'FIXED' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Fixa</button>
                  <button type="button" onClick={() => setBillType('INSTALLMENT')} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${billType === 'INSTALLMENT' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Parcelada</button>
                  <button type="button" onClick={() => setBillType('DEBT')} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${billType === 'DEBT' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Dívida Recorrente</button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{billType === 'DEBT' ? 'Valor Total (R$)' : 'Valor (R$)'}</label>
                    <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" required />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">{billType === 'DEBT' ? 'Dia de Referência' : 'Dia Vencimento'}</label>
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
              
              {/* Extra fields for DEBT */}
              {billType === 'DEBT' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Data de Início</label>
                    <input type="date" value={formStartDate} onChange={(e) => setFormStartDate(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500" />
                  </div>
              )}

              {/* Extra fields for INSTALLMENT */}
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
                 <button type="submit" className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl mt-0 font-medium shadow-lg shadow-indigo-200">Salvar</button>
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

      {/* Settle Modal (Parcelas) */}
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

      {/* Abate Modal (Dívidas) */}
      {isAbateModalOpen && selectedBill && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800">Abater Dívida</h3>
                <button onClick={() => setIsAbateModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
             </div>
             
             <form onSubmit={handleConfirmAbate}>
                <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 mb-4">
                   <p className="font-bold text-orange-900">{selectedBill.description}</p>
                   <p className="text-sm text-orange-700 mt-1">Saldo Devedor: <strong>{formatCurrency(selectedBill.currentBalance ?? selectedBill.amount)}</strong></p>
                </div>
                
                <div className="mb-4">
                   <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Valor a Pagar</label>
                   <input type="number" step="0.01" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="0.00" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500" required />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                   <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Conta</label>
                      <select value={payBank} onChange={(e) => setPayBank(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500">
                         {banks.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                   </div>
                   <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Pagamento</label>
                      <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500">
                         {availablePaymentMethods.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                   </div>
                </div>

                <div className="flex gap-3">
                   <button type="button" onClick={() => setIsAbateModalOpen(false)} className="flex-1 px-4 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-medium">Cancelar</button>
                   <button type="submit" className="flex-1 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-medium shadow-lg">Confirmar Pagamento</button>
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
                 {/* Only show "Just this month" option if NOT a debt */}
                 {billToDelete.type !== 'DEBT' && (
                     <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                        <input type="radio" name="deleteMode" checked={deleteMode === 'CURRENT'} onChange={() => setDeleteMode('CURRENT')} className="text-red-600 focus:ring-red-500" />
                        <span className="text-sm font-medium text-slate-700">Apenas deste mês ({MONTH_NAMES[selectedMonth]})</span>
                     </label>
                 )}
                 <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                    <input type="radio" name="deleteMode" checked={deleteMode === 'ALL'} onChange={() => setDeleteMode('ALL')} className="text-red-600 focus:ring-red-500" />
                    <span className="text-sm font-medium text-slate-700">
                        {billToDelete.type === 'DEBT' ? 'Excluir Dívida Permanentemente' : 'Todas as ocorrências (Definitivo)'}
                    </span>
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
