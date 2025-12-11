
import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Minus, Check, ArrowDown, ArrowUp, Calendar } from 'lucide-react';
import { Transaction, TransactionType, CreditCardConfig } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface TransactionFormProps {
  onAdd: (transaction: Transaction) => void;
  cardConfigs: CreditCardConfig[];
  banks: string[];
  transactionHierarchy: Record<TransactionType, Record<string, string[]>>;
  paymentMethods: string[];
}

const TransactionForm: React.FC<TransactionFormProps> = ({ onAdd, cardConfigs, banks, transactionHierarchy, paymentMethods }) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // Default to today YYYY-MM-DD
  
  // Default to Expense
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  
  // Get initial lists
  const hierarchyForType = transactionHierarchy[TransactionType.EXPENSE] || {};
  const initialCategories = Object.keys(hierarchyForType);
  const [category, setCategory] = useState(initialCategories[0] || '');
  
  // Safety check: ensure array exists before accessing
  const initialSubCategories = (category && hierarchyForType[category]) || [];
  const [subCategory, setSubCategory] = useState(initialSubCategories[0] || '');

  const [bank, setBank] = useState(banks[0] || 'Carteira');
  const [paymentMethod, setPaymentMethod] = useState(paymentMethods[0] || 'Pix');

  // Compute Available Payment Methods based on Bank
  const availablePaymentMethods = useMemo(() => {
    // Dynamic cards: Linked to current bank
    const cards = cardConfigs.filter(c => c.bank === bank);
    const cardMethods = cards.map(c => `Crédito ${c.name}`);
    
    return [...paymentMethods, ...cardMethods];
  }, [bank, cardConfigs, paymentMethods]);

  // Ensure selected paymentMethod is valid when bank changes
  useEffect(() => {
    if (!availablePaymentMethods.includes(paymentMethod)) {
      setPaymentMethod(availablePaymentMethods[0]);
    }
  }, [availablePaymentMethods, paymentMethod, bank]);

  // Handle Type Change (Income vs Expense)
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    
    // Reset Category to first of new type
    const newHierarchy = transactionHierarchy[newType] || {};
    const newCategories = Object.keys(newHierarchy);
    const firstCategory = newCategories[0] || '';
    setCategory(firstCategory);
    
    // Reset SubCategory to first of new category
    const newSubCategories = (firstCategory && newHierarchy[firstCategory]) || [];
    setSubCategory(newSubCategories[0] || '');
  };

  // Handle Category Change
  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
    
    // Reset SubCategory based on new Category
    const currentHierarchy = transactionHierarchy[type] || {};
    const newSubCategories = (newCategory && currentHierarchy[newCategory]) || [];
    setSubCategory(newSubCategories[0] || '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description || !date) return;

    // Construct date with current time to preserve entry order, but use selected calendar date
    const now = new Date();
    const [year, month, day] = date.split('-').map(Number);
    const finalDate = new Date(year, month - 1, day, now.getHours(), now.getMinutes(), now.getSeconds());

    const newTransaction: Transaction = {
      id: uuidv4(),
      amount: parseFloat(amount),
      description,
      date: finalDate.toISOString(),
      type,
      category,
      subCategory,
      bank,
      paymentMethod
    };

    onAdd(newTransaction);
    setAmount('');
    setDescription('');
    // Keep the date as is
  };

  const currentHierarchy = transactionHierarchy[type] || {};
  const currentCategories = Object.keys(currentHierarchy);
  const currentSubCategories = (category && currentHierarchy[category]) || [];

  // Dynamic Styles based on Type
  const isExpense = type === TransactionType.EXPENSE;
  
  const inputBorderClass = isExpense 
    ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
    : 'border-[#AFDE22] focus:ring-[#AFDE22] focus:border-[#AFDE22]';

  return (
    <div className="bg-[#FBFBFB] rounded-2xl p-6 border border-slate-200 shadow-sm h-full flex flex-col">
      <div className="mb-6">
         <h3 className="text-xl font-bold text-slate-800">Nova Transação</h3>
         <p className="text-sm text-slate-500">Registre uma entrada ou saída.</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-5 flex-1 flex flex-col">
        {/* Type Toggle - Segmented Control */}
        <div className="bg-slate-100 p-1 rounded-xl flex shadow-inner">
          <button
            type="button"
            onClick={() => handleTypeChange(TransactionType.INCOME)}
            className={`flex-1 flex items-center justify-center py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
              type === TransactionType.INCOME 
                ? 'bg-[#AFDE22] text-black shadow-sm ring-1 ring-black/5' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <ArrowUp className="w-4 h-4 mr-2" />
            Entrada
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange(TransactionType.EXPENSE)}
            className={`flex-1 flex items-center justify-center py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
              type === TransactionType.EXPENSE 
                ? 'bg-red-600 text-white shadow-sm shadow-red-200' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <ArrowDown className="w-4 h-4 mr-2" />
            Saída
          </button>
        </div>

        {/* Amount */}
        <div className="relative">
           <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Valor (R$)</label>
           <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className={`w-full bg-slate-50 border rounded-xl px-4 py-3.5 text-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:bg-white transition-all placeholder:text-slate-300 ${inputBorderClass}`}
              required
           />
        </div>

        {/* Description & Date Row */}
        <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Descrição</label>
                <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="ex: Supermercado"
                    className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:bg-white transition-all placeholder:text-slate-300 ${inputBorderClass}`}
                    required
                />
            </div>
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Data</label>
                <div className="relative">
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className={`w-full bg-slate-50 border rounded-xl px-3 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:bg-white transition-all appearance-none ${inputBorderClass}`}
                        required
                    />
                </div>
            </div>
        </div>

        {/* Categories Row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
             <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Categoria</label>
             <select
               value={category}
               onChange={(e) => handleCategoryChange(e.target.value)}
               className={`w-full bg-slate-50 border rounded-xl px-3 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:bg-white transition-all appearance-none cursor-pointer ${inputBorderClass}`}
             >
               {currentCategories.length === 0 && <option value="">Sem categorias</option>}
               {currentCategories.map(cat => (
                 <option key={cat} value={cat}>{cat}</option>
               ))}
             </select>
          </div>
          <div>
             <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Tipo</label>
             <select
               value={subCategory}
               onChange={(e) => setSubCategory(e.target.value)}
               className={`w-full bg-slate-50 border rounded-xl px-3 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:bg-white transition-all appearance-none cursor-pointer ${inputBorderClass}`}
             >
               {currentSubCategories.length === 0 && <option value="">Sem tipos</option>}
               {currentSubCategories.map(sub => (
                 <option key={sub} value={sub}>{sub}</option>
               ))}
             </select>
          </div>
        </div>

        {/* Bank & Payment Row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Banco</label>
            <select
              value={bank}
              onChange={(e) => setBank(e.target.value)}
              className={`w-full bg-slate-50 border rounded-xl px-3 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:bg-white transition-all appearance-none cursor-pointer ${inputBorderClass}`}
            >
              {banks.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Pagamento</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className={`w-full bg-slate-50 border rounded-xl px-3 py-3 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:bg-white transition-all appearance-none cursor-pointer ${inputBorderClass}`}
            >
              {availablePaymentMethods.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="pt-4 mt-auto">
           <button
             type="submit"
             className={`w-full py-4 rounded-xl font-bold text-sm tracking-wide shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
                type === TransactionType.INCOME 
                  ? 'bg-[#AFDE22] text-black hover:bg-[#AFDE22]/90 shadow-lime-200' 
                  : 'bg-red-600 text-white hover:bg-red-700 shadow-red-200'
             }`}
           >
             <Check className="w-5 h-5" />
             Confirmar Transação
           </button>
        </div>
      </form>
    </div>
  );
};

export default TransactionForm;
