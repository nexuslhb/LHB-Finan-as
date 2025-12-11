import React, { useState, useMemo } from 'react';
import { Goal, Transaction, TransactionType } from '../types';
import { Target, Plus, Trash2, Trophy, X, Check, Wallet, Minus, Calendar, TrendingUp, Sparkles } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface GoalsTabProps {
  goals: Goal[];
  transactions: Transaction[];
  onAddGoal: (goal: Goal) => void;
  onDeleteGoal: (id: string) => void;
  onUpdateGoal: (id: string, amount: number) => void;
}

const GoalsTab: React.FC<GoalsTabProps> = ({ goals, transactions, onAddGoal, onDeleteGoal, onUpdateGoal }) => {
  const [isAdding, setIsAdding] = useState(false);
  
  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newTarget, setNewTarget] = useState('');
  const [newCurrent, setNewCurrent] = useState('');
  const [newDeadline, setNewDeadline] = useState('');

  // Manage Funds State
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [amountToManage, setAmountToManage] = useState('');
  const [manageMode, setManageMode] = useState<'add' | 'withdraw'>('add');

  // Calculate Available Value
  const availableValue = useMemo(() => {
    // 1. Total Allocated: Sum of Expense > Investimentos > Metas
    const totalAllocated = transactions
      .filter(t => 
        t.type === TransactionType.EXPENSE && 
        t.category === 'Investimentos' && 
        t.subCategory === 'Metas'
      )
      .reduce((acc, curr) => acc + curr.amount, 0);

    // 2. Total Distributed: Sum of currentAmount of all goals
    const totalDistributed = goals.reduce((acc, curr) => acc + curr.currentAmount, 0);

    return totalAllocated - totalDistributed;
  }, [transactions, goals]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newTarget) return;

    const goal: Goal = {
      id: uuidv4(),
      title: newTitle,
      targetAmount: parseFloat(newTarget),
      currentAmount: parseFloat(newCurrent) || 0,
      deadline: newDeadline || undefined
    };

    onAddGoal(goal);
    setIsAdding(false);
    resetForm();
  };

  const resetForm = () => {
    setNewTitle('');
    setNewTarget('');
    setNewCurrent('');
    setNewDeadline('');
  };

  const handleManageFunds = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoalId || !amountToManage) return;

    const goal = goals.find(g => g.id === selectedGoalId);
    if (goal) {
      const value = parseFloat(amountToManage);
      if (!isNaN(value)) {
        let newAmount = goal.currentAmount;
        
        if (manageMode === 'add') {
          if (value > availableValue) {
             // Optional: Allow adding even if "available" is 0 if user wants, 
             // but visually we show the limit. For now, strict check based on previous logic?
             // Let's just warn but allow, or enforce?
             // Prompt implied enforce logic: "distribute available funds".
             // Let's enforce for consistency with the "Available Value" concept.
             if (value > availableValue) {
                 alert("Saldo disponível em 'Investimentos > Metas' insuficiente.");
                 return;
             }
          }
          newAmount += value;
        } else {
          if (value > goal.currentAmount) {
            alert("Valor de retirada maior que o saldo atual.");
            return;
          }
          newAmount -= value;
          // Ensure we don't go below zero due to float precision
          if (newAmount < 0) newAmount = 0;
        }

        onUpdateGoal(selectedGoalId, newAmount);
      }
    }
    
    // Close modal and reset
    setSelectedGoalId(null);
    setAmountToManage('');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
  };

  const calculateProgress = (current: number, target: number) => {
    if (target === 0) return 0;
    return Math.min(100, Math.round((current / target) * 100));
  };

  const selectedGoal = goals.find(g => g.id === selectedGoalId);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative pb-20">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
         <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Trophy className="w-7 h-7 text-[#0C2BD8]" />
              Minhas Metas
            </h2>
            <p className="text-slate-500 mt-1">Defina objetivos, acompanhe o progresso e realize sonhos.</p>
         </div>
         
         <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
             {/* Available Value Widget */}
             <div className="bg-[#FBFBFB] border border-slate-200 rounded-xl p-4 flex items-center gap-4 shadow-sm min-w-[240px]">
                <div className="p-3 bg-slate-100 rounded-full shadow-sm">
                   <Wallet className="w-5 h-5 text-[#0C2BD8]" />
                </div>
                <div>
                  <p className="text-xs text-[#0C2BD8] font-semibold uppercase tracking-wider mb-0.5">Disponível para Distribuir</p>
                  <p className={`text-xl font-bold ${availableValue >= 0 ? 'text-[#0C2BD8]' : 'text-red-600'}`}>
                    {formatCurrency(availableValue)}
                  </p>
                </div>
             </div>

             <button 
               onClick={() => setIsAdding(true)}
               className="bg-[#0C2BD8] hover:bg-[#0C2BD8]/90 text-white px-6 py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg active:scale-95 font-medium"
             >
               <Plus className="w-5 h-5" />
               Nova Meta
             </button>
         </div>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.map((goal) => {
          const progress = calculateProgress(goal.currentAmount, goal.targetAmount);
          const isCompleted = progress >= 100;

          return (
            <div 
                key={goal.id} 
                className={`group relative bg-[#FBFBFB] rounded-2xl border ${isCompleted ? 'border-yellow-200' : 'border-slate-200'} p-6 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden`}
            >
              {/* Decorative Background for Completed */}
              {isCompleted && (
                  <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-50 rounded-bl-full -mr-10 -mt-10 z-0 pointer-events-none"></div>
              )}

              {/* Header */}
              <div className="relative z-10 flex justify-between items-start mb-6">
                 <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${isCompleted ? 'bg-yellow-100 text-yellow-600' : 'bg-slate-100 text-[#0C2BD8]'}`}>
                        {isCompleted ? <Trophy className="w-6 h-6" /> : <Target className="w-6 h-6" />}
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-lg leading-tight line-clamp-1">{goal.title}</h3>
                        {goal.deadline ? (
                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(goal.deadline).toLocaleDateString('pt-BR')}
                            </p>
                        ) : (
                            <p className="text-xs text-slate-400 mt-1">Sem prazo definido</p>
                        )}
                    </div>
                 </div>
                 
                 <button 
                    onClick={() => onDeleteGoal(goal.id)}
                    className="text-slate-300 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100"
                    title="Excluir Meta"
                 >
                    <Trash2 className="w-5 h-5" />
                 </button>
              </div>

              {/* Amount & Progress */}
              <div className="relative z-10 mb-6">
                 <div className="flex items-end gap-1 mb-2">
                    <span className="text-3xl font-bold text-slate-900">{formatCurrency(goal.currentAmount)}</span>
                    <span className="text-sm text-slate-400 mb-1.5 font-medium">/ {formatCurrency(goal.targetAmount)}</span>
                 </div>
                 
                 <div className="relative w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div 
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${
                            isCompleted ? 'bg-gradient-to-r from-yellow-400 to-amber-500' : 'bg-gradient-to-r from-blue-500 to-[#0C2BD8]'
                        }`}
                        style={{ width: `${progress}%` }}
                    ></div>
                 </div>
                 <div className="flex justify-between mt-2 text-xs font-semibold">
                    <span className={isCompleted ? 'text-amber-600' : 'text-[#0C2BD8]'}>
                        {progress}% Concluído
                    </span>
                    {isCompleted ? (
                        <span className="flex items-center gap-1 text-amber-600">
                            <Sparkles className="w-3 h-3" /> Conquistado!
                        </span>
                    ) : (
                        <span className="text-slate-400">Faltam {formatCurrency(goal.targetAmount - goal.currentAmount)}</span>
                    )}
                 </div>
              </div>

              {/* Action Buttons */}
              <div className="relative z-10 grid grid-cols-2 gap-3 mt-auto">
                 <button 
                    onClick={() => {
                        setSelectedGoalId(goal.id);
                        setManageMode('withdraw');
                        setAmountToManage('');
                    }}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 hover:text-slate-900 transition-colors"
                 >
                    <Minus className="w-4 h-4" />
                    Retirar
                 </button>
                 <button 
                    onClick={() => {
                        setSelectedGoalId(goal.id);
                        setManageMode('add');
                        setAmountToManage('');
                    }}
                    disabled={availableValue <= 0}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        availableValue > 0 
                            ? 'bg-[#0C2BD8] hover:bg-[#0C2BD8]/90 text-white shadow-sm' 
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                    title={availableValue <= 0 ? "Sem saldo disponível em Metas" : "Adicionar fundos"}
                 >
                    <Plus className="w-4 h-4" />
                    Adicionar
                 </button>
              </div>
            </div>
          );
        })}

        {/* Empty State */}
        {goals.length === 0 && (
           <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl bg-[#FBFBFB]">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                 <Trophy className="w-8 h-8 text-[#0C2BD8]" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700">Nenhuma meta definida</h3>
              <p className="text-slate-500 max-w-sm text-center mt-1 mb-6">Crie um objetivo financeiro para começar a guardar dinheiro de forma organizada.</p>
              <button 
                onClick={() => setIsAdding(true)} 
                className="px-6 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 hover:border-slate-400 transition-all shadow-sm"
              >
                Criar primeira meta
              </button>
           </div>
        )}
      </div>

      {/* Add Goal Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                   <Target className="w-5 h-5 text-[#0C2BD8]" />
                   Nova Meta Financeira
                </h3>
                <button onClick={() => { setIsAdding(false); resetForm(); }} className="text-slate-400 hover:text-slate-600">
                   <X className="w-5 h-5" />
                </button>
             </div>
             
             <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                   <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Nome do Objetivo</label>
                   <input 
                     type="text" 
                     value={newTitle}
                     onChange={(e) => setNewTitle(e.target.value)}
                     placeholder="ex: Viagem para Europa, Carro Novo"
                     className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0C2BD8]/20 focus:border-[#0C2BD8] transition-all"
                     required
                   />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Valor Alvo</label>
                       <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">R$</span>
                          <input 
                            type="number" 
                            value={newTarget}
                            onChange={(e) => setNewTarget(e.target.value)}
                            placeholder="0.00"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0C2BD8]/20 focus:border-[#0C2BD8] transition-all"
                            required
                          />
                       </div>
                    </div>
                    <div>
                       <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Já Guardado</label>
                       <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">R$</span>
                          <input 
                            type="number" 
                            value={newCurrent}
                            onChange={(e) => setNewCurrent(e.target.value)}
                            placeholder="0.00"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0C2BD8]/20 focus:border-[#0C2BD8] transition-all"
                          />
                       </div>
                    </div>
                </div>

                <div>
                   <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Prazo (Opcional)</label>
                   <div className="relative">
                      <input 
                        type="date" 
                        value={newDeadline}
                        onChange={(e) => setNewDeadline(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0C2BD8]/20 focus:border-[#0C2BD8] transition-all"
                      />
                   </div>
                </div>

                <div className="pt-2 flex gap-3">
                   <button 
                     type="button" 
                     onClick={() => { setIsAdding(false); resetForm(); }}
                     className="flex-1 px-4 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-medium transition-colors"
                   >
                     Cancelar
                   </button>
                   <button 
                     type="submit"
                     className="flex-1 px-4 py-3 bg-[#0C2BD8] hover:bg-[#0C2BD8]/90 text-white rounded-xl font-medium transition-colors shadow-lg"
                   >
                     Criar Meta
                   </button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* Manage Funds Modal (Add/Withdraw) */}
      {selectedGoalId && selectedGoal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                {manageMode === 'add' 
                    ? <TrendingUp className="w-5 h-5 text-emerald-600" /> 
                    : <Wallet className="w-5 h-5 text-red-500" />
                }
                {manageMode === 'add' ? 'Adicionar Fundos' : 'Resgatar Valor'}
              </h3>
              <button 
                onClick={() => setSelectedGoalId(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleManageFunds}>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6 text-center">
                 <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{selectedGoal.title}</p>
                 <p className="text-2xl font-bold text-slate-800">{formatCurrency(selectedGoal.currentAmount)}</p>
                 <p className="text-xs text-slate-400 mt-1">Saldo Atual</p>
              </div>

              <div className="mb-6">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Valor da {manageMode === 'add' ? 'Entrada' : 'Saída'}
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">R$</span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={amountToManage}
                    onChange={(e) => setAmountToManage(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl py-4 pl-12 pr-4 text-slate-800 text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-[#0C2BD8]/20 focus:border-[#0C2BD8] transition-all"
                    placeholder="0.00"
                    autoFocus
                    required
                  />
                </div>
                
                {manageMode === 'add' ? (
                   <p className={`text-xs mt-2 flex justify-between ${availableValue > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      <span>Disponível para distribuir:</span>
                      <span className="font-bold">{formatCurrency(availableValue)}</span>
                   </p>
                ) : (
                   <p className="text-xs text-slate-500 mt-2 flex justify-between">
                      <span>Limite para saque:</span>
                      <span className="font-bold">{formatCurrency(selectedGoal.currentAmount)}</span>
                   </p>
                )}
              </div>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedGoalId(null)}
                  className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={manageMode === 'add' && (parseFloat(amountToManage) > availableValue)}
                  className={`flex-1 px-4 py-3 text-white rounded-xl transition-colors font-medium flex items-center justify-center gap-2 shadow-lg ${
                    manageMode === 'add' 
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200 disabled:bg-slate-300 disabled:shadow-none' 
                      : 'bg-red-600 hover:bg-red-700 shadow-red-200'
                  }`}
                >
                  {manageMode === 'add' ? <Check className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalsTab;