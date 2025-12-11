
import React, { useState } from 'react';
import { Transaction, Budget, MONTH_NAMES, TransactionType } from '../types';
import MonthlyControl from './MonthlyControl';
import BudgetComparison from './BudgetComparison';
import { ChevronLeft, ChevronRight, Calendar, Calculator, Table, Filter } from 'lucide-react';

interface MonthsTabProps {
  transactions: Transaction[];
  budgets: Budget[];
  transactionHierarchy: Record<TransactionType, Record<string, string[]>>;
  onSaveBudget: (budget: Budget) => void;
}

type SubTab = 'control' | 'comparison';

const MonthsTab: React.FC<MonthsTabProps> = ({ transactions, budgets, transactionHierarchy, onSaveBudget }) => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('control');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Sub-navigation and Filters */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
        
        {/* Toggle View */}
        <div className="flex bg-slate-100/80 rounded-lg p-1 w-full md:w-auto p-1.5">
          <button
            onClick={() => setActiveSubTab('control')}
            className={`flex-1 md:flex-none px-6 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              activeSubTab === 'control' 
                ? 'bg-white text-[#0C2BD8] shadow-sm ring-1 ring-slate-200' 
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
            }`}
          >
            <Table className="w-4 h-4" />
            Controle Anual
          </button>
          <button
            onClick={() => setActiveSubTab('comparison')}
            className={`flex-1 md:flex-none px-6 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              activeSubTab === 'comparison' 
                ? 'bg-white text-[#0C2BD8] shadow-sm ring-1 ring-slate-200' 
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
            }`}
          >
            <Calculator className="w-4 h-4" />
            Planejamento (Meta)
          </button>
        </div>

        {/* Date Filters */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center gap-2 text-sm text-slate-500 mr-2 hidden md:flex">
             <Filter className="w-4 h-4" />
             <span>Filtrar:</span>
          </div>

          {/* Year Selector */}
          <div className="flex items-center bg-white rounded-lg border border-slate-200 shadow-sm">
            <button 
              onClick={() => setSelectedYear(prev => prev - 1)}
              className="p-2.5 text-slate-400 hover:text-white hover:bg-[#0C2BD8] rounded-l-lg transition-colors border-r border-slate-100"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-4 text-sm font-semibold text-slate-700 min-w-[70px] text-center">{selectedYear}</span>
            <button 
              onClick={() => setSelectedYear(prev => prev + 1)}
              className="p-2.5 text-slate-400 hover:text-white hover:bg-[#0C2BD8] rounded-r-lg transition-colors border-l border-slate-100"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Month Selector (Only for Comparison view) */}
          {activeSubTab === 'comparison' && (
             <div className="relative">
                <select 
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="appearance-none bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg pl-9 pr-8 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#0C2BD8]/20 focus:border-[#0C2BD8] cursor-pointer shadow-sm hover:border-slate-300 transition-colors"
                >
                  {MONTH_NAMES.map((m, idx) => (
                    <option key={idx} value={idx}>{m}</option>
                  ))}
                </select>
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
             </div>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
        {activeSubTab === 'control' ? (
          <MonthlyControl 
            transactions={transactions} 
            year={selectedYear} 
            transactionHierarchy={transactionHierarchy}
          />
        ) : (
          <BudgetComparison 
            transactions={transactions} 
            budgets={budgets} 
            year={selectedYear} 
            month={selectedMonth}
            transactionHierarchy={transactionHierarchy}
            onSaveBudget={onSaveBudget}
          />
        )}
      </div>
    </div>
  );
};

export default MonthsTab;
