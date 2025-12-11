import React, { useMemo, useState } from 'react';
import { Transaction, TransactionType } from '../types';
import { Landmark, ArrowUpRight, ArrowDownLeft, Edit2, X, Check, Settings, Trash2, Plus, Wallet, PieChart as PieIcon, ArrowRight } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { v4 as uuidv4 } from 'uuid';

interface BankAccountsViewProps {
  transactions: Transaction[];
  banks: string[];
  onAddTransaction: (transaction: Transaction) => void;
  onAddBank: (name: string) => void;
  onDeleteBank: (name: string) => void;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6'];

const BankAccountsView: React.FC<BankAccountsViewProps> = ({ transactions, banks, onAddTransaction, onAddBank, onDeleteBank }) => {
  // Editing State
  const [editingBank, setEditingBank] = useState<string | null>(null);
  const [editIncome, setEditIncome] = useState('');
  const [editExpense, setEditExpense] = useState('');

  // Bank Management State
  const [isManageBanksOpen, setIsManageBanksOpen] = useState(false);
  const [newBankName, setNewBankName] = useState('');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
  };

  const accountsData = useMemo(() => {
    const data = banks.map(bankName => {
      // Income for this bank
      const income = transactions
        .filter(t => t.type === TransactionType.INCOME && t.bank === bankName)
        .reduce((sum, t) => sum + t.amount, 0);

      // Expense for this bank (EXCLUDING Credit Card, as that is a future liability, not immediate cash flow)
      // We assume 'Debito', 'Pix', 'Dinheiro', 'Boleto' deduct immediately.
      // Updated: Check if paymentMethod starts with 'Crédito' to handle specific card names (e.g. 'Crédito C6 Black')
      const expense = transactions
        .filter(t => 
          t.type === TransactionType.EXPENSE && 
          t.bank === bankName && 
          !t.paymentMethod?.startsWith('Crédito')
        )
        .reduce((sum, t) => sum + t.amount, 0);

      const balance = income - expense;

      return {
        name: bankName,
        income,
        expense,
        balance
      };
    });

    const totalBalance = data.reduce((sum, acc) => sum + acc.balance, 0);
    const positiveAccounts = data.filter(d => d.balance > 0);

    return { data, totalBalance, positiveAccounts };
  }, [transactions, banks]);

  const handleEdit = (bank: typeof accountsData.data[0]) => {
    setEditingBank(bank.name);
    setEditIncome(bank.income.toFixed(2));
    setEditExpense(bank.expense.toFixed(2));
  };

  const handleSaveAdjustment = () => {
    if (!editingBank) return;

    const currentData = accountsData.data.find(d => d.name === editingBank);
    if (!currentData) return;

    const newIncome = parseFloat(editIncome) || 0;
    const newExpense = parseFloat(editExpense) || 0;

    const incomeDiff = newIncome - currentData.income;
    const expenseDiff = newExpense - currentData.expense;

    // Create Income Adjustment Transaction
    if (Math.abs(incomeDiff) > 0.01) {
      const incomeTx: Transaction = {
        id: uuidv4(),
        amount: incomeDiff, // Can be negative if reducing income
        description: 'Ajuste Manual de Saldo',
        date: new Date().toISOString(),
        type: TransactionType.INCOME,
        category: 'Outras receitas',
        subCategory: 'Outros (Entradas)',
        bank: editingBank,
        paymentMethod: 'Pix'
      };
      onAddTransaction(incomeTx);
    }

    // Create Expense Adjustment Transaction
    if (Math.abs(expenseDiff) > 0.01) {
      const expenseTx: Transaction = {
        id: uuidv4(),
        amount: expenseDiff, // Can be negative if reducing expense
        description: 'Ajuste Manual de Saldo',
        date: new Date().toISOString(),
        type: TransactionType.EXPENSE,
        category: 'Obrigações',
        subCategory: 'Outros (Obrigações)',
        bank: editingBank,
        paymentMethod: 'Débito'
      };
      onAddTransaction(expenseTx);
    }

    setEditingBank(null);
  };

  const handleAddBankSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newBankName.trim()) {
      onAddBank(newBankName.trim());
      setNewBankName('');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      
      {/* Top Section: Net Worth & Actions */}
      <div className="flex flex-col md:flex-row gap-6">
         {/* Net Worth Card */}
         <div className="flex-1 bg-[#FBFBFB] rounded-2xl p-6 text-slate-800 shadow-sm relative overflow-hidden group border border-slate-200">
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-100 rounded-bl-full -mr-8 -mt-8 pointer-events-none group-hover:scale-110 transition-transform duration-500"></div>
            
            <div className="flex justify-between items-start mb-4 relative z-10">
               <div>
                  <h3 className="text-slate-500 font-medium text-sm uppercase tracking-wider flex items-center gap-2">
                     <Wallet className="w-4 h-4 text-[#0C2BD8]" />
                     Saldo Geral em Contas
                  </h3>
               </div>
               <button
                  onClick={() => setIsManageBanksOpen(true)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-500 p-2 rounded-lg transition-colors"
                  title="Gerenciar Bancos"
               >
                  <Settings className="w-4 h-4" />
               </button>
            </div>
            
            <div className="relative z-10">
               <p className="text-4xl font-bold tracking-tight">{formatCurrency(accountsData.totalBalance)}</p>
               <p className="text-slate-500 text-xs mt-2 max-w-sm">
                 *Despesas no Crédito não são descontadas deste saldo até o pagamento da fatura.
               </p>
            </div>
         </div>

         {/* Distribution Chart (Mini) */}
         <div className="hidden md:flex w-1/3 bg-[#FBFBFB] rounded-2xl p-6 border border-slate-200 shadow-sm flex-col justify-center">
             <h4 className="text-slate-700 font-bold text-sm mb-4 flex items-center gap-2">
               <PieIcon className="w-4 h-4 text-[#0C2BD8]" />
               Distribuição
             </h4>
             <div className="h-24 w-full">
               {accountsData.positiveAccounts.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                        <Pie
                           data={accountsData.positiveAccounts}
                           dataKey="balance"
                           nameKey="name"
                           cx="50%"
                           cy="50%"
                           innerRadius={30}
                           outerRadius={45}
                           paddingAngle={5}
                           stroke="none"
                        >
                           {accountsData.positiveAccounts.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                           ))}
                        </Pie>
                        <Tooltip 
                           formatter={(value: number) => formatCurrency(value)}
                           contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                     </PieChart>
                  </ResponsiveContainer>
               ) : (
                  <div className="h-full flex items-center justify-center text-slate-300 text-xs">Sem dados</div>
               )}
             </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accountsData.data.map((acc, index) => (
          <div key={acc.name} className="bg-[#FBFBFB] border border-slate-200 rounded-2xl p-5 hover:shadow-lg transition-all duration-300 group relative overflow-hidden">
             {/* Decorative colored top border */}
             <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-slate-200 to-slate-100 group-hover:from-indigo-400 group-hover:to-blue-500 transition-colors"></div>

             <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                   <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 group-hover:bg-[#0C2BD8]/10 group-hover:border-[#0C2BD8]/20 transition-colors">
                      <Landmark className="w-6 h-6 text-slate-500 group-hover:text-[#0C2BD8] transition-colors" />
                   </div>
                   <div>
                      <h4 className="font-bold text-slate-800">{acc.name}</h4>
                      <p className="text-xs text-slate-400">Conta Corrente / Carteira</p>
                   </div>
                </div>
                <button 
                  onClick={() => handleEdit(acc)}
                  className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                  title="Ajustar Saldo"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
             </div>

             <div className="mb-4">
                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Saldo Atual</span>
                <p className={`text-2xl font-bold ${acc.balance >= 0 ? 'text-slate-900' : 'text-red-500'}`}>
                   {formatCurrency(acc.balance)}
                </p>
             </div>

             <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-2">
                <div>
                   <span className="text-xs text-slate-400 flex items-center gap-1 mb-0.5">
                      <ArrowUpRight className="w-3 h-3 text-emerald-500" /> Entradas
                   </span>
                   <span className="text-sm font-semibold text-emerald-600">{formatCurrency(acc.income)}</span>
                </div>
                <div>
                   <span className="text-xs text-slate-400 flex items-center gap-1 mb-0.5">
                      <ArrowDownLeft className="w-3 h-3 text-red-500" /> Saídas
                   </span>
                   <span className="text-sm font-semibold text-red-600">{formatCurrency(acc.expense)}</span>
                </div>
             </div>
          </div>
        ))}

        {/* Add Bank Card (Visible if no banks or just to prompt) */}
        {banks.length === 0 && (
           <button 
             onClick={() => setIsManageBanksOpen(true)}
             className="border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-300 hover:text-indigo-600 hover:bg-slate-50 transition-all min-h-[200px]"
           >
              <Plus className="w-8 h-8 mb-2" />
              <span className="font-medium">Adicionar Banco</span>
           </button>
        )}
      </div>

      {/* Manage Banks Modal */}
      {isManageBanksOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-indigo-500" />
                  Gerenciar Bancos
                </h3>
                <button 
                  onClick={() => setIsManageBanksOpen(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
             </div>

             <div className="space-y-6">
                {/* Add New Bank */}
                <form onSubmit={handleAddBankSubmit}>
                   <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Adicionar Novo</label>
                   <div className="flex gap-2">
                     <input 
                        type="text" 
                        value={newBankName}
                        onChange={(e) => setNewBankName(e.target.value)}
                        placeholder="Nome do Banco (ex: Inter)"
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                     />
                     <button 
                        type="submit"
                        disabled={!newBankName.trim()}
                        className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white px-4 py-3 rounded-xl transition-colors flex items-center shadow-lg shadow-slate-200"
                     >
                        <Plus className="w-5 h-5" />
                     </button>
                   </div>
                </form>

                <div className="border-t border-slate-100 pt-4">
                   <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Bancos Cadastrados</label>
                   <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                      {banks.map(bank => (
                         <div key={bank} className="flex justify-between items-center p-3 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 transition-colors group">
                            <div className="flex items-center gap-3">
                               <div className="p-2 bg-slate-100 rounded-lg text-slate-500">
                                  <Landmark className="w-4 h-4" />
                               </div>
                               <span className="text-slate-700 font-medium">{bank}</span>
                            </div>
                            <button 
                               onClick={() => onDeleteBank(bank)}
                               className="text-slate-300 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100"
                               title="Remover Banco"
                            >
                               <Trash2 className="w-4 h-4" />
                            </button>
                         </div>
                      ))}
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Adjustment Modal */}
      {editingBank && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-indigo-500" />
                Ajustar Saldo: {editingBank}
              </h3>
              <button 
                onClick={() => setEditingBank(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-emerald-600 mb-1.5 uppercase tracking-wider">Total Entradas (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editIncome}
                  onChange={(e) => setEditIncome(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-red-600 mb-1.5 uppercase tracking-wider">Total Saídas (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editExpense}
                  onChange={(e) => setEditExpense(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all font-medium"
                />
              </div>

              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-xs text-blue-700 flex gap-2">
                <div className="mt-0.5"><Settings className="w-3 h-3" /></div>
                <p>O sistema criará automaticamente transações de ajuste para igualar o saldo informado.</p>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  onClick={() => setEditingBank(null)}
                  className="flex-1 px-4 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveAdjustment}
                  className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors font-medium flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
                >
                  <Check className="w-4 h-4" />
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BankAccountsView;