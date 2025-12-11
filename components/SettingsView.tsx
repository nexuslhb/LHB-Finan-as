
import React, { useState } from 'react';
import { TransactionType } from '../types';
import { Settings, Plus, Trash2, ChevronDown, ChevronRight, LayoutList, CreditCard, TrendingUp, X } from 'lucide-react';

interface SettingsViewProps {
  transactionHierarchy: Record<TransactionType, Record<string, string[]>>;
  investmentHierarchy: Record<string, string[]>;
  paymentMethods: string[];
  onUpdateTransactionHierarchy: (newHierarchy: Record<TransactionType, Record<string, string[]>>) => void;
  onUpdateInvestmentHierarchy: (newHierarchy: Record<string, string[]>) => void;
  onUpdatePaymentMethods: (newMethods: string[]) => void;
}

type Tab = 'transactions' | 'investments' | 'payments';

const SettingsView: React.FC<SettingsViewProps> = ({
  transactionHierarchy,
  investmentHierarchy,
  paymentMethods,
  onUpdateTransactionHierarchy,
  onUpdateInvestmentHierarchy,
  onUpdatePaymentMethods
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('transactions');
  const [activeTxType, setActiveTxType] = useState<TransactionType>(TransactionType.INCOME);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // Input states
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newSubCategoryName, setNewSubCategoryName] = useState<Record<string, string>>({});
  const [newPaymentMethod, setNewPaymentMethod] = useState('');

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  // --- Transaction Handlers ---
  const handleAddTxCategory = () => {
    if (!newCategoryName.trim()) return;
    const updated = { ...transactionHierarchy };
    if (!updated[activeTxType][newCategoryName]) {
      updated[activeTxType] = { ...updated[activeTxType], [newCategoryName]: [] };
      onUpdateTransactionHierarchy(updated);
      setNewCategoryName('');
    }
  };

  const handleDeleteTxCategory = (cat: string) => {
    if (window.confirm(`Tem certeza que deseja excluir a categoria "${cat}" e todos os seus tipos?`)) {
      const updated = { ...transactionHierarchy };
      const { [cat]: _, ...rest } = updated[activeTxType];
      updated[activeTxType] = rest;
      onUpdateTransactionHierarchy(updated);
    }
  };

  const handleAddTxSubCategory = (cat: string) => {
    const val = newSubCategoryName[cat];
    if (!val?.trim()) return;
    
    const updated = { ...transactionHierarchy };
    updated[activeTxType][cat] = [...updated[activeTxType][cat], val];
    onUpdateTransactionHierarchy(updated);
    setNewSubCategoryName(prev => ({ ...prev, [cat]: '' }));
  };

  const handleDeleteTxSubCategory = (cat: string, sub: string) => {
    const updated = { ...transactionHierarchy };
    updated[activeTxType][cat] = updated[activeTxType][cat].filter(s => s !== sub);
    onUpdateTransactionHierarchy(updated);
  };

  // --- Investment Handlers ---
  const handleAddInvCategory = () => {
    if (!newCategoryName.trim()) return;
    const updated = { ...investmentHierarchy };
    if (!updated[newCategoryName]) {
      updated[newCategoryName] = [];
      onUpdateInvestmentHierarchy(updated);
      setNewCategoryName('');
    }
  };

  const handleDeleteInvCategory = (cat: string) => {
    if (window.confirm(`Tem certeza que deseja excluir "${cat}"?`)) {
      const { [cat]: _, ...rest } = investmentHierarchy;
      onUpdateInvestmentHierarchy(rest);
    }
  };

  const handleAddInvSubCategory = (cat: string) => {
    const val = newSubCategoryName[cat];
    if (!val?.trim()) return;
    
    const updated = { ...investmentHierarchy };
    updated[cat] = [...updated[cat], val];
    onUpdateInvestmentHierarchy(updated);
    setNewSubCategoryName(prev => ({ ...prev, [cat]: '' }));
  };

  const handleDeleteInvSubCategory = (cat: string, sub: string) => {
    const updated = { ...investmentHierarchy };
    updated[cat] = updated[cat].filter(s => s !== sub);
    onUpdateInvestmentHierarchy(updated);
  };

  // --- Payment Handlers ---
  const handleAddPayment = () => {
    if (!newPaymentMethod.trim()) return;
    if (!paymentMethods.includes(newPaymentMethod)) {
      onUpdatePaymentMethods([...paymentMethods, newPaymentMethod]);
      setNewPaymentMethod('');
    }
  };

  const handleDeletePayment = (method: string) => {
    if (window.confirm(`Excluir forma de pagamento "${method}"?`)) {
      onUpdatePaymentMethods(paymentMethods.filter(m => m !== method));
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-[#1B203C] flex items-center gap-2">
            <Settings className="w-7 h-7 text-[#0C2BD8]" />
            Configurações
          </h2>
          <p className="text-slate-500 mt-1">Gerencie categorias, tipos e opções do sistema.</p>
        </div>

        <div className="flex flex-col sm:flex-row bg-[#FBFBFB] p-1.5 rounded-xl border border-slate-200 w-full md:w-auto gap-1 sm:gap-0">
          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex-1 md:flex-none px-4 md:px-6 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'transactions' ? 'bg-white text-[#0C2BD8] shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <LayoutList className="w-4 h-4" />
            Transações
          </button>
          <button
            onClick={() => setActiveTab('investments')}
            className={`flex-1 md:flex-none px-4 md:px-6 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'investments' ? 'bg-white text-[#0C2BD8] shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Investimentos
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`flex-1 md:flex-none px-4 md:px-6 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'payments' ? 'bg-white text-[#0C2BD8] shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Pagamento
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="bg-[#FBFBFB] rounded-2xl border border-slate-200 shadow-sm min-h-[500px] p-4 md:p-6">
        
        {/* === TRANSACTIONS TAB === */}
        {activeTab === 'transactions' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 border-b border-slate-200 pb-4">
              <button 
                onClick={() => setActiveTxType(TransactionType.INCOME)}
                className={`w-full sm:w-auto px-4 py-2 rounded-lg font-bold text-sm transition-colors ${activeTxType === TransactionType.INCOME ? 'bg-[#AFDE22] text-black shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                Entradas (Receitas)
              </button>
              <button 
                onClick={() => setActiveTxType(TransactionType.EXPENSE)}
                className={`w-full sm:w-auto px-4 py-2 rounded-lg font-bold text-sm transition-colors ${activeTxType === TransactionType.EXPENSE ? 'bg-red-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
              >
                Saídas (Despesas)
              </button>
            </div>

            <div className="space-y-4">
              {(Object.entries(transactionHierarchy[activeTxType]) as [string, string[]][]).map(([cat, subs]) => (
                <div key={cat} className="border border-slate-200 rounded-xl bg-white overflow-hidden">
                  <div 
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => toggleCategory(cat)}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      {expandedCategories[cat] ? <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />}
                      <span className="font-bold text-slate-800 truncate">{cat}</span>
                      <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full shrink-0">{subs.length} tipos</span>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteTxCategory(cat); }}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {expandedCategories[cat] && (
                    <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-3 animate-in slide-in-from-top-2">
                      <div className="flex flex-wrap gap-2 mb-4">
                        {subs.map(sub => (
                          <div key={sub} className="flex items-center gap-1 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm text-sm text-slate-700">
                            {sub}
                            <button onClick={() => handleDeleteTxSubCategory(cat, sub)} className="ml-1 text-slate-300 hover:text-red-500">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        {subs.length === 0 && <span className="text-xs text-slate-400 italic">Nenhum tipo cadastrado</span>}
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 max-w-md">
                        <input 
                          type="text" 
                          placeholder="Novo Tipo"
                          value={newSubCategoryName[cat] || ''}
                          onChange={(e) => setNewSubCategoryName(prev => ({ ...prev, [cat]: e.target.value }))}
                          className="w-full sm:flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0C2BD8]"
                        />
                        <button 
                          onClick={() => handleAddTxSubCategory(cat)}
                          className="w-full sm:w-auto bg-slate-800 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-black transition-colors"
                        >
                          Adicionar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-200 mt-8">
              <label className="block text-sm font-bold text-slate-700 mb-2">Adicionar Nova Categoria de {activeTxType === TransactionType.INCOME ? 'Entrada' : 'Saída'}</label>
              <div className="flex flex-col sm:flex-row gap-2 max-w-md">
                <input 
                  type="text" 
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Nome da Categoria"
                  className="w-full sm:flex-1 bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:border-[#0C2BD8]"
                />
                <button 
                  onClick={handleAddTxCategory}
                  className="w-full sm:w-auto bg-[#0C2BD8] text-white px-6 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-[#0C2BD8]/90 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Criar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* === INVESTMENTS TAB === */}
        {activeTab === 'investments' && (
          <div className="space-y-6">
            <p className="text-sm text-slate-500 bg-blue-50 p-3 rounded-lg border border-blue-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#0C2BD8]" />
              Aqui você gerencia os tipos de ativos disponíveis para investir.
            </p>

            <div className="space-y-4">
              {(Object.entries(investmentHierarchy) as [string, string[]][]).map(([cat, subs]) => (
                <div key={cat} className="border border-slate-200 rounded-xl bg-white overflow-hidden">
                  <div 
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                    onClick={() => toggleCategory(cat)}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      {expandedCategories[cat] ? <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />}
                      <span className="font-bold text-slate-800 truncate">{cat}</span>
                      <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full shrink-0">{subs.length} tipos</span>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeleteInvCategory(cat); }}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {expandedCategories[cat] && (
                    <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-3 animate-in slide-in-from-top-2">
                      <div className="flex flex-wrap gap-2 mb-4">
                        {subs.map(sub => (
                          <div key={sub} className="flex items-center gap-1 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm text-sm text-slate-700">
                            {sub}
                            <button onClick={() => handleDeleteInvSubCategory(cat, sub)} className="ml-1 text-slate-300 hover:text-red-500">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 max-w-md">
                        <input 
                          type="text" 
                          placeholder="Novo Tipo de Ativo"
                          value={newSubCategoryName[cat] || ''}
                          onChange={(e) => setNewSubCategoryName(prev => ({ ...prev, [cat]: e.target.value }))}
                          className="w-full sm:flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#0C2BD8]"
                        />
                        <button 
                          onClick={() => handleAddInvSubCategory(cat)}
                          className="w-full sm:w-auto bg-slate-800 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-black transition-colors"
                        >
                          Adicionar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-200 mt-8">
              <label className="block text-sm font-bold text-slate-700 mb-2">Adicionar Nova Categoria de Investimento</label>
              <div className="flex flex-col sm:flex-row gap-2 max-w-md">
                <input 
                  type="text" 
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Nome da Categoria (ex: NFTs)"
                  className="w-full sm:flex-1 bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:border-[#0C2BD8]"
                />
                <button 
                  onClick={handleAddInvCategory}
                  className="w-full sm:w-auto bg-[#0C2BD8] text-white px-6 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-[#0C2BD8]/90 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Criar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* === PAYMENTS TAB === */}
        {activeTab === 'payments' && (
          <div className="space-y-6 max-w-2xl">
            <div className="space-y-2">
              {paymentMethods.map(method => (
                <div key={method} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:shadow-sm transition-all">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-slate-400" />
                    <span className="font-medium text-slate-800">{method}</span>
                  </div>
                  <button 
                    onClick={() => handleDeletePayment(method)}
                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-200 mt-4">
              <label className="block text-sm font-bold text-slate-700 mb-2">Nova Forma de Pagamento</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input 
                  type="text" 
                  value={newPaymentMethod}
                  onChange={(e) => setNewPaymentMethod(e.target.value)}
                  placeholder="ex: Vale Refeição"
                  className="w-full sm:flex-1 bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-800 focus:outline-none focus:border-[#0C2BD8]"
                />
                <button 
                  onClick={handleAddPayment}
                  className="w-full sm:w-auto bg-[#0C2BD8] text-white px-6 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-[#0C2BD8]/90 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default SettingsView;
