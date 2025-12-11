
import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType, CreditCardConfig } from '../types';
import { CreditCard, Edit2, Trash2, Plus, X, Check, Settings, DollarSign, Wallet, Calendar, Signal } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface CreditCardsViewProps {
  transactions: Transaction[];
  cardConfigs: CreditCardConfig[];
  banks: string[];
  onUpdateConfig: (config: CreditCardConfig) => void;
  onAddConfig: (config: CreditCardConfig) => void;
  onDeleteConfig: (id: string) => void;
  onAddTransaction: (transaction: Transaction) => void;
  onUpdateTransaction: (transaction: Transaction) => void;
}

const CARD_COLORS = [
  { name: 'Black', value: 'from-slate-800 to-slate-900', ring: 'ring-slate-800' },
  { name: 'Blue', value: 'from-blue-700 to-blue-900', ring: 'ring-blue-700' },
  { name: 'Indigo', value: 'from-indigo-700 to-indigo-900', ring: 'ring-indigo-700' },
  { name: 'Purple', value: 'from-purple-700 to-purple-900', ring: 'ring-purple-700' },
  { name: 'Red', value: 'from-red-700 to-red-900', ring: 'ring-red-700' },
  { name: 'Emerald', value: 'from-emerald-700 to-emerald-900', ring: 'ring-emerald-700' },
  { name: 'Amber', value: 'from-amber-600 to-amber-800', ring: 'ring-amber-600' },
];

const CreditCardsView: React.FC<CreditCardsViewProps> = ({ 
  transactions, 
  cardConfigs, 
  banks,
  onUpdateConfig,
  onAddConfig,
  onDeleteConfig,
  onAddTransaction,
  onUpdateTransaction
}) => {
  // Config Management State
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [newCardName, setNewCardName] = useState('');
  const [newCardBank, setNewCardBank] = useState(banks[0] || 'Carteira');
  const [newCardLimit, setNewCardLimit] = useState('');
  const [newCardDueDay, setNewCardDueDay] = useState('');
  const [newCardColor, setNewCardColor] = useState(CARD_COLORS[0].value);

  // Payment Modal State
  const [paymentModalData, setPaymentModalData] = useState<{ card: CreditCardConfig, amount: number } | null>(null);

  // Inline Editing State
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editLimit, setEditLimit] = useState('');
  const [editDueDay, setEditDueDay] = useState('');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
  };

  const handleEdit = (id: string, currentLimit: number, currentDueDay: number) => {
    setEditingCardId(id);
    setEditLimit(currentLimit.toString());
    setEditDueDay(currentDueDay.toString());
  };

  const handleSaveEdit = (originalConfig: CreditCardConfig) => {
    onUpdateConfig({
      ...originalConfig,
      limit: parseFloat(editLimit) || 0,
      dueDay: parseInt(editDueDay) || 10
    });
    setEditingCardId(null);
  };

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardName || !newCardLimit) return;

    const newConfig: CreditCardConfig = {
      id: uuidv4(),
      name: newCardName,
      bank: newCardBank,
      limit: parseFloat(newCardLimit),
      closingDay: 1, // Default, can be enhanced later
      dueDay: parseInt(newCardDueDay) || 10,
      color: newCardColor
    };

    onAddConfig(newConfig);
    
    // Reset form
    setNewCardName('');
    setNewCardLimit('');
    setNewCardDueDay('');
    setNewCardColor(CARD_COLORS[0].value);
  };

  const handleOpenPayModal = (card: CreditCardConfig, invoiceAmount: number) => {
    if (invoiceAmount <= 0) {
      alert("Não há fatura em aberto para pagar.");
      return;
    }
    setPaymentModalData({ card, amount: invoiceAmount });
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalData) return;
    const { card, amount } = paymentModalData;

    // 1. Create a transaction that represents the money leaving the bank account (Paying the bill)
    // We mark it as 'isInvoicePayment: true' so it doesn't double count in expenses charts/lists,
    // but it WILL reduce the bank balance because it is 'Débito'.
    const paymentTransaction: Transaction = {
        id: uuidv4(),
        amount: amount,
        description: `Fatura Cartão ${card.name}`,
        date: new Date().toISOString(),
        type: TransactionType.EXPENSE,
        category: 'Obrigações',
        subCategory: 'Dívidas',
        bank: card.bank,
        paymentMethod: 'Débito', // Ensures it hits the bank balance
        isInvoicePayment: true // EXCLUDES from Dashboard Stats, Monthly Control, etc.
    };
    onAddTransaction(paymentTransaction);

    // 2. Mark the credit card transactions of this month/bank as "Paid"
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const transactionsToMark = transactions.filter(t => 
        t.type === TransactionType.EXPENSE && 
        t.bank === card.bank && 
        // Match specific card OR generic 'Crédito' (legacy) if this is the first card for this bank
        (t.paymentMethod === `Crédito ${card.name}` || 
         (t.paymentMethod === 'Crédito' && cardConfigs.find(c => c.bank === card.bank)?.id === card.id)) &&
        !t.isPaid &&
        new Date(t.date).getMonth() === currentMonth &&
        new Date(t.date).getFullYear() === currentYear
    );

    transactionsToMark.forEach(t => {
        onUpdateTransaction({ ...t, isPaid: true });
    });

    setPaymentModalData(null);
  };

  const cardsData = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    return cardConfigs.map(config => {
      // Calculate current invoice (Expenses with 'Crédito' in current month that are NOT paid)
      const currentInvoice = transactions
        .filter(t => 
          t.type === TransactionType.EXPENSE && 
          t.bank === config.bank && 
          // Match specific card OR generic 'Crédito' (legacy) if this is the first card for this bank
          (t.paymentMethod === `Crédito ${config.name}` || 
           (t.paymentMethod === 'Crédito' && cardConfigs.find(c => c.bank === config.bank)?.id === config.id)) &&
          !t.isPaid && // Only count unpaid transactions
          new Date(t.date).getMonth() === currentMonth &&
          new Date(t.date).getFullYear() === currentYear
        )
        .reduce((sum, t) => sum + t.amount, 0);

      const availableLimit = Math.max(0, config.limit - currentInvoice);
      const usagePercentage = config.limit > 0 ? (currentInvoice / config.limit) * 100 : 0;

      return {
        ...config,
        currentInvoice,
        availableLimit,
        usagePercentage
      };
    });
  }, [transactions, cardConfigs]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      
      {/* Top Action Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setIsManageModalOpen(true)}
          className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-all shadow-sm"
        >
          <Settings className="w-4 h-4 text-slate-400" />
          Gerenciar Cartões
        </button>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {cardsData.length > 0 ? (
          cardsData.map((card, index) => {
            // Use stored color or fallback to a deterministic gradient based on index
            const defaultGradients = [
                'from-slate-800 to-slate-900', 
                'from-indigo-900 to-slate-900', 
                'from-blue-900 to-slate-900',
                'from-emerald-900 to-slate-900'
            ];
            const gradient = card.color || defaultGradients[index % defaultGradients.length];

            return (
              <div key={card.id} className={`bg-gradient-to-br ${gradient} rounded-2xl p-6 shadow-2xl relative overflow-hidden group text-white aspect-[1.586/1] flex flex-col justify-between border border-white/10`}>
                {/* Card Visual Background (Noise/Pattern) */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                {/* Top: Bank & Chip */}
                <div className="relative z-10 flex justify-between items-start">
                   <div className="flex flex-col gap-4">
                      <span className="font-bold tracking-wider text-sm opacity-80">{card.bank}</span>
                      <div className="w-12 h-9 bg-gradient-to-tr from-yellow-200 to-yellow-500 rounded-md border border-yellow-600/50 shadow-inner flex items-center justify-center relative overflow-hidden">
                          <div className="absolute inset-0 border-[0.5px] border-black/20 rounded-md"></div>
                          <div className="w-full h-[1px] bg-black/10 absolute top-1/3"></div>
                          <div className="w-full h-[1px] bg-black/10 absolute bottom-1/3"></div>
                          <div className="h-full w-[1px] bg-black/10 absolute left-1/3"></div>
                          <div className="h-full w-[1px] bg-black/10 absolute right-1/3"></div>
                      </div>
                   </div>
                   <Signal className="w-6 h-6 rotate-90 opacity-50" />
                </div>

                {/* Middle: Details or Edit Form */}
                <div className="relative z-10">
                   {editingCardId === card.id ? (
                      <div className="space-y-2 bg-black/40 backdrop-blur-md p-3 rounded-lg border border-white/10 animate-in fade-in">
                        <div className="flex gap-2">
                           <div className="flex-1">
                              <label className="text-[10px] text-slate-300 block mb-0.5">Limite</label>
                              <input 
                                 type="number" 
                                 value={editLimit} 
                                 onChange={(e) => setEditLimit(e.target.value)}
                                 className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-400"
                              />
                           </div>
                           <div className="w-16">
                              <label className="text-[10px] text-slate-300 block mb-0.5">Dia Venc.</label>
                              <input 
                                 type="number" 
                                 value={editDueDay} 
                                 onChange={(e) => setEditDueDay(e.target.value)}
                                 className="w-full bg-white/10 border border-white/20 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-400"
                              />
                           </div>
                        </div>
                        <div className="flex gap-2 pt-1">
                           <button onClick={() => setEditingCardId(null)} className="flex-1 bg-white/10 hover:bg-white/20 text-white py-1 rounded text-[10px]">Cancelar</button>
                           <button onClick={() => handleSaveEdit(card)} className="flex-1 bg-indigo-500 hover:bg-indigo-400 text-white py-1 rounded text-[10px]">Salvar</button>
                        </div>
                      </div>
                   ) : (
                      <div className="flex justify-between items-end">
                         <div>
                            <p className="text-xs text-slate-300 font-medium tracking-wide mb-1">Fatura Atual</p>
                            <p className="text-2xl font-bold tracking-tight text-white drop-shadow-sm">{formatCurrency(card.currentInvoice)}</p>
                         </div>
                         <div className="text-right">
                             <div className="flex items-center justify-end gap-1 text-xs text-slate-300 mb-0.5">
                                <Calendar className="w-3 h-3" />
                                <span>Vence dia {card.dueDay}</span>
                             </div>
                             <p className="text-[10px] text-slate-400">Limite: {formatCurrency(card.limit)}</p>
                         </div>
                      </div>
                   )}
                </div>

                {/* Bottom: Name, Actions, Progress */}
                <div className="relative z-10 pt-4 border-t border-white/10 mt-2">
                   <div className="flex justify-between items-center mb-3">
                      <p className="font-medium tracking-widest uppercase text-sm">{card.name}</p>
                      
                      <div className="flex gap-2">
                         {editingCardId !== card.id && (
                           <button 
                             onClick={() => handleEdit(card.id, card.limit, card.dueDay)}
                             className="p-1.5 rounded-full bg-white/5 hover:bg-white/20 text-white transition-colors"
                             title="Editar"
                           >
                             <Edit2 className="w-3 h-3" />
                           </button>
                         )}
                         <button 
                            onClick={() => handleOpenPayModal(card, card.currentInvoice)}
                            disabled={card.currentInvoice <= 0}
                            className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 transition-colors ${
                                card.currentInvoice > 0 
                                    ? 'bg-white text-slate-900 hover:bg-slate-100' 
                                    : 'bg-white/10 text-slate-400 cursor-not-allowed'
                            }`}
                         >
                            Pagar
                         </button>
                      </div>
                   </div>

                   {/* Progress Bar */}
                   <div className="relative h-1.5 w-full bg-black/30 rounded-full overflow-hidden">
                      <div 
                        className={`absolute top-0 left-0 h-full rounded-full transition-all duration-700 ease-out ${
                          card.usagePercentage > 90 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' :
                          card.usagePercentage > 70 ? 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]' : 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]'
                        }`}
                        style={{ width: `${Math.min(100, card.usagePercentage)}%` }}
                      ></div>
                   </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
               <CreditCard className="w-8 h-8 text-[#0C2BD8]" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700">Nenhum cartão cadastrado</h3>
            <p className="text-slate-500 max-w-sm text-center mt-1 mb-6">Cadastre seus cartões de crédito para controlar limites e faturas.</p>
            <button 
               onClick={() => setIsManageModalOpen(true)} 
               className="px-6 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
            >
              Adicionar Cartão
            </button>
          </div>
        )}
      </div>

      {/* Payment Confirmation Modal */}
      {paymentModalData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
               <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <DollarSign className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">Pagar Fatura</h3>
               </div>
               <button 
                  onClick={() => setPaymentModalData(null)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
            </div>
            
            <form onSubmit={handleConfirmPayment}>
              <div className="space-y-4 mb-6">
                 <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Valor da Fatura</p>
                    <p className="text-3xl font-bold text-slate-900">{formatCurrency(paymentModalData.amount)}</p>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                       <CreditCard className="w-3 h-3" />
                       {paymentModalData.card.name}
                    </p>
                 </div>
                 
                 <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <div className="p-2 bg-indigo-50 rounded-full">
                       <Wallet className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div>
                       <p className="text-xs text-slate-500">Debitar da conta</p>
                       <p className="text-sm font-bold text-slate-800">{paymentModalData.card.bank}</p>
                    </div>
                 </div>

                 <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 flex gap-2">
                    <div className="mt-0.5"><Settings className="w-3 h-3 text-amber-600" /></div>
                    <p className="text-xs text-amber-700 leading-relaxed">
                       O valor será descontado do saldo e as despesas desta fatura serão marcadas como pagas no sistema.
                    </p>
                 </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentModalData(null)}
                  className="flex-1 px-4 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors font-medium flex items-center justify-center gap-2 shadow-lg shadow-emerald-200"
                >
                  <Check className="w-4 h-4" />
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Cards Modal */}
      {isManageModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-2xl shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-600" />
                Gerenciar Cartões
              </h3>
              <button 
                onClick={() => setIsManageModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6">
               {/* Add New Card Form */}
               <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                  <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                     <Plus className="w-4 h-4 text-emerald-600" />
                     Novo Cartão
                  </h4>
                  <form onSubmit={handleAddCard} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Nome</label>
                        <input 
                           type="text"
                           value={newCardName}
                           onChange={(e) => setNewCardName(e.target.value)}
                           placeholder="ex: Nubank Black"
                           className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                           required
                        />
                     </div>
                     <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Banco Vinculado</label>
                        <select 
                           value={newCardBank}
                           onChange={(e) => setNewCardBank(e.target.value)}
                           className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                           {banks.map(b => (
                              <option key={b} value={b}>{b}</option>
                           ))}
                        </select>
                     </div>
                     <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Limite (R$)</label>
                        <input 
                           type="number"
                           min="0"
                           value={newCardLimit}
                           onChange={(e) => setNewCardLimit(e.target.value)}
                           placeholder="5000"
                           className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                           required
                        />
                     </div>
                     <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Dia Vencimento</label>
                        <input 
                           type="number"
                           min="1"
                           max="31"
                           value={newCardDueDay}
                           onChange={(e) => setNewCardDueDay(e.target.value)}
                           placeholder="10"
                           className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                           required
                        />
                     </div>

                     <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Cor do Cartão</label>
                        <div className="flex flex-wrap gap-3">
                           {CARD_COLORS.map((color) => (
                              <button
                                 key={color.name}
                                 type="button"
                                 onClick={() => setNewCardColor(color.value)}
                                 className={`w-8 h-8 rounded-full bg-gradient-to-br ${color.value} transition-all ${newCardColor === color.value ? `ring-2 ${color.ring} ring-offset-2 ring-offset-slate-50 scale-110 shadow-sm` : 'hover:scale-105 opacity-80 hover:opacity-100'}`}
                                 title={color.name}
                              />
                           ))}
                        </div>
                     </div>

                     <div className="md:col-span-2 flex justify-end mt-2">
                        <button 
                           type="submit"
                           className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 shadow-sm"
                        >
                           <Check className="w-4 h-4" />
                           Adicionar Cartão
                        </button>
                     </div>
                  </form>
               </div>

               {/* Existing Cards List */}
               <div>
                  <h4 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">Cartões Existentes</h4>
                  <div className="space-y-3">
                     {cardConfigs.map(card => (
                        <div key={card.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:shadow-sm transition-all group">
                           <div className="flex items-center gap-4">
                              <div className={`p-3 rounded-lg text-white bg-gradient-to-br ${card.color || 'from-slate-700 to-slate-800'}`}>
                                 <CreditCard className="w-5 h-5" />
                              </div>
                              <div>
                                 <p className="font-bold text-slate-800 text-sm">{card.name}</p>
                                 <p className="text-xs text-slate-500">{card.bank} • Vence dia {card.dueDay} • Limite {formatCurrency(card.limit)}</p>
                              </div>
                           </div>
                           <button 
                              onClick={() => onDeleteConfig(card.id)}
                              className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                              title="Excluir Cartão"
                           >
                              <Trash2 className="w-4 h-4" />
                           </button>
                        </div>
                     ))}
                     {cardConfigs.length === 0 && (
                        <div className="text-center py-8 text-slate-400">
                           <p className="text-sm">Nenhum cartão cadastrado.</p>
                        </div>
                     )}
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditCardsView;
