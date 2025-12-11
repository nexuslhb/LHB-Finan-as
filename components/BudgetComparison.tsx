
import React, { useState } from 'react';
import { Transaction, TransactionType, Budget, MONTH_NAMES } from '../types';
import { AlertCircle, CheckCircle2, Target, Printer } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface BudgetComparisonProps {
  transactions: Transaction[];
  budgets: Budget[];
  month: number;
  year: number;
  transactionHierarchy: Record<TransactionType, Record<string, string[]>>;
  onSaveBudget: (budget: Budget) => void;
}

const BudgetComparison: React.FC<BudgetComparisonProps> = ({ 
  transactions, 
  budgets, 
  month, 
  year,
  transactionHierarchy,
  onSaveBudget 
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const handleBudgetClick = (budget: Budget | null, type: TransactionType, cat: string, sub: string) => {
    const id = budget ? budget.id : `${type}-${cat}-${sub}-new`;
    setEditingId(id);
    setEditValue(budget ? budget.amount.toString() : '');
  };

  const handleBudgetSave = (type: TransactionType, cat: string, sub: string, existingId?: string) => {
    const amount = parseFloat(editValue.replace(',', '.'));
    if (isNaN(amount)) {
      setEditingId(null);
      return;
    }

    const budgetToSave: Budget = {
      id: existingId || uuidv4(),
      type,
      category: cat,
      subCategory: sub,
      month,
      year,
      amount
    };

    onSaveBudget(budgetToSave);
    setEditingId(null);
  };

  const handlePrint = () => {
    const win = window.open('', '', 'height=800,width=1000');
    if (!win) return;
    const dateStr = new Date().toLocaleDateString('pt-BR');

    win.document.write('<html><head><title>Relatório de Planejamento</title>');
    win.document.write(`
      <style>
        @page { size: portrait; margin: 15mm; }
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          font-size: 12px; 
          color: #0f172a; 
          padding: 0; 
          -webkit-print-color-adjust: exact; 
          print-color-adjust: exact; 
        }
        h1 { text-align: center; color: #1e293b; margin-bottom: 5px; font-size: 20px; }
        .meta { text-align: center; color: #64748b; margin-bottom: 30px; font-size: 12px; }
        .section-title { font-weight: 800; margin-top: 30px; margin-bottom: 10px; text-transform: uppercase; padding-bottom: 5px; border-bottom: 2px solid #e2e8f0; font-size: 14px; }
        .income-title { color: #059669; border-color: #059669; }
        .expense-title { color: #dc2626; border-color: #dc2626; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
        th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; }
        th { background-color: #f8fafc !important; font-weight: bold; color: #475569; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .cat-row { background-color: #f1f5f9 !important; font-weight: bold; color: #1e293b; }
        .pos { color: #059669; font-weight: 600; }
        .neg { color: #dc2626; font-weight: 600; }
        .summary-box { border: 1px solid #cbd5e1; padding: 15px; border-radius: 8px; margin-top: 30px; background-color: #f8fafc !important; page-break-inside: avoid; }
      </style>
    `);
    win.document.write('</head><body>');
    
    win.document.write(`<h1>Planejamento Financeiro</h1>`);
    win.document.write(`<div class="meta">Referência: ${MONTH_NAMES[month]} / ${year} • Gerado em ${dateStr}</div>`);

    const renderTable = (type: TransactionType) => {
        let html = `<table><thead><tr><th>Categoria / Tipo</th><th class="text-right">Meta (Orçado)</th><th class="text-right">Realizado</th><th class="text-right">Diferença</th><th class="text-center">%</th></tr></thead><tbody>`;
        
        let totalBudget = 0;
        let totalReal = 0;

        (Object.entries(transactionHierarchy[type]) as [string, string[]][]).forEach(([cat, subCats]) => {
            let catBudget = 0;
            let catReal = 0;
            let rowsHtml = '';

            subCats.forEach(sub => {
                const b = budgets.find(b => 
                    b.type === type && b.category === cat && b.subCategory === sub && b.month === month && b.year === year
                );
                const r = transactions
                    .filter(t => 
                        !t.isInvoicePayment &&
                        t.type === type && t.category === cat && t.subCategory === sub && 
                        new Date(t.date).getMonth() === month && new Date(t.date).getFullYear() === year
                    )
                    .reduce((sum, t) => sum + t.amount, 0);

                const budgetAmt = b?.amount || 0;
                const realAmt = r;
                
                catBudget += budgetAmt;
                catReal += realAmt;

                const diff = type === TransactionType.INCOME ? realAmt - budgetAmt : budgetAmt - realAmt;
                const diffClass = diff >= 0 ? 'pos' : 'neg';
                const percent = budgetAmt > 0 ? (realAmt / budgetAmt) * 100 : 0;

                rowsHtml += `<tr>
                    <td style="padding-left: 20px;">${sub}</td>
                    <td class="text-right">${formatCurrency(budgetAmt)}</td>
                    <td class="text-right">${formatCurrency(realAmt)}</td>
                    <td class="text-right ${diffClass}">${formatCurrency(diff)}</td>
                    <td class="text-center">${percent.toFixed(0)}%</td>
                </tr>`;
            });

            totalBudget += catBudget;
            totalReal += catReal;

            const catDiff = type === TransactionType.INCOME ? catReal - catBudget : catBudget - catReal;
            const catClass = catDiff >= 0 ? 'pos' : 'neg';

            // Category Summary Row
            html += `<tr class="cat-row">
                <td>${cat}</td>
                <td class="text-right">${formatCurrency(catBudget)}</td>
                <td class="text-right">${formatCurrency(catReal)}</td>
                <td class="text-right ${catClass}">${formatCurrency(catDiff)}</td>
                <td></td>
            </tr>`;
            html += rowsHtml;
        });
        html += '</tbody></table>';
        return { html, totalBudget, totalReal };
    };

    win.document.write(`<div class="section-title income-title">Entradas (Receitas)</div>`);
    const incomeData = renderTable(TransactionType.INCOME);
    win.document.write(incomeData.html);

    win.document.write(`<div class="section-title expense-title">Saídas (Despesas)</div>`);
    const expenseData = renderTable(TransactionType.EXPENSE);
    win.document.write(expenseData.html);

    // Summary
    const netBudget = incomeData.totalBudget - expenseData.totalBudget;
    const netReal = incomeData.totalReal - expenseData.totalReal;

    win.document.write(`<div class="summary-box">
       <h3 style="margin-top:0;">Resumo do Mês</h3>
       <p style="margin: 5px 0;"><strong>Total Orçado (Entrada - Saída):</strong> ${formatCurrency(netBudget)}</p>
       <p style="margin: 5px 0;"><strong>Total Realizado (Entrada - Saída):</strong> ${formatCurrency(netReal)}</p>
    </div>`);

    win.document.write('</body></html>');
    win.document.close();
    win.print();
  };

  const renderCategoryGroup = (type: TransactionType) => {
    return (Object.entries(transactionHierarchy[type]) as [string, string[]][]).map(([cat, subCats]) => {
      // Calculate Header Totals for this Category
      let catBudget = 0;
      let catReal = 0;

      subCats.forEach(sub => {
        const b = budgets.find(b => 
          b.type === type && b.category === cat && b.subCategory === sub && b.month === month && b.year === year
        );
        const r = transactions
          .filter(t => 
            !t.isInvoicePayment && 
            t.type === type && t.category === cat && t.subCategory === sub && 
            new Date(t.date).getMonth() === month && new Date(t.date).getFullYear() === year
          )
          .reduce((sum, t) => sum + t.amount, 0);
        
        catBudget += (b?.amount || 0);
        catReal += r;
      });
      const catSaldo = type === TransactionType.INCOME ? (catReal - catBudget) : (catBudget - catReal);
      
      return (
        <div key={cat} className="mb-8 bg-white">
          {/* Category Header */}
          <div className="flex justify-between items-end mb-3 border-b border-slate-100 pb-2">
            <div>
               <h5 className={`font-bold uppercase tracking-wider text-sm flex items-center gap-2 ${type === TransactionType.INCOME ? 'text-emerald-700' : 'text-red-700'}`}>
                  {cat}
               </h5>
               <p className="text-xs text-slate-400 mt-1">Total Orçado: {formatCurrency(catBudget)}</p>
            </div>
            <div className="text-right">
               <span className={`text-sm font-bold ${catSaldo >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {catSaldo >= 0 ? '+' : ''}{formatCurrency(catSaldo)}
               </span>
               <p className="text-xs text-slate-400 mt-1">Saldo da Categoria</p>
            </div>
          </div>

          {/* SubCategories List */}
          <div className="space-y-3">
            {subCats.map(sub => {
              const budget = budgets.find(b => 
                b.type === type && b.category === cat && b.subCategory === sub && b.month === month && b.year === year
              );
              const budgetAmount = budget?.amount || 0;

              const realAmount = transactions
                .filter(t => 
                  !t.isInvoicePayment && 
                  t.type === type && t.category === cat && t.subCategory === sub && 
                  new Date(t.date).getMonth() === month && new Date(t.date).getFullYear() === year
                )
                .reduce((sum, t) => sum + t.amount, 0);

              let saldo = 0;
              let isPositive = false;
              let progress = 0;

              if (type === TransactionType.INCOME) {
                 saldo = realAmount - budgetAmount;
                 isPositive = saldo >= 0;
                 progress = budgetAmount > 0 ? (realAmount / budgetAmount) * 100 : 0;
              } else {
                 saldo = budgetAmount - realAmount;
                 isPositive = saldo >= 0;
                 progress = budgetAmount > 0 ? (realAmount / budgetAmount) * 100 : 0;
              }

              const isEditing = editingId === (budget?.id || `${type}-${cat}-${sub}-new`);

              return (
                <div key={sub} className="group p-3 border border-slate-100 rounded-lg hover:border-slate-300 hover:shadow-sm transition-all bg-slate-50/30">
                  <div className="flex justify-between items-center mb-2">
                     <span className="text-slate-700 font-medium text-sm">{sub}</span>
                     
                     <div className="flex items-center gap-4 text-sm">
                        {/* Real */}
                        <div className="text-right">
                           <span className="block text-xs text-slate-400">Real</span>
                           <span className="font-semibold text-slate-800">{formatCurrency(realAmount)}</span>
                        </div>

                        {/* Budget (Editable) */}
                        <div className="text-right min-w-[80px]">
                           <span className="block text-xs text-slate-400 flex items-center justify-end gap-1">
                              Meta <Target className="w-3 h-3" />
                           </span>
                           <div 
                              onClick={() => !isEditing && handleBudgetClick(budget || null, type, cat, sub)}
                              className={`cursor-pointer transition-colors ${!isEditing ? 'hover:text-blue-600' : ''}`}
                           >
                              {isEditing ? (
                                 <input
                                    autoFocus
                                    type="number"
                                    className="w-20 bg-white text-slate-900 text-right px-1 py-0.5 rounded outline-none ring-2 ring-blue-500 text-sm shadow-sm"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onBlur={() => handleBudgetSave(type, cat, sub, budget?.id)}
                                    onKeyDown={(e) => {
                                       if (e.key === 'Enter') handleBudgetSave(type, cat, sub, budget?.id);
                                       if (e.key === 'Escape') setEditingId(null);
                                    }}
                                 />
                              ) : (
                                 <span className={`font-medium ${budgetAmount === 0 ? 'text-slate-300' : 'text-slate-600'}`}>
                                    {budgetAmount === 0 ? '-' : formatCurrency(budgetAmount)}
                                 </span>
                              )}
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="relative h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                     <div 
                        className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${
                           type === TransactionType.INCOME 
                              ? (progress >= 100 ? 'bg-emerald-500' : 'bg-blue-400')
                              : (progress > 100 ? 'bg-red-500' : progress > 80 ? 'bg-amber-400' : 'bg-emerald-400')
                        }`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                     ></div>
                  </div>
                  <div className="flex justify-between mt-1">
                     <span className="text-[10px] text-slate-400">
                        {progress.toFixed(0)}% da meta
                     </span>
                     <span className={`text-[10px] font-medium ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                        {isPositive ? 'Dentro da meta' : 'Fora da meta'} ({formatCurrency(saldo)})
                     </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="p-6">
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-indigo-100 rounded-xl p-4 mb-8 flex justify-between items-center">
        <div>
           <h3 className="text-lg font-bold text-slate-800 uppercase tracking-wider">
             Planejamento Financeiro
           </h3>
           <p className="text-sm text-slate-500">
             {MONTH_NAMES[month]} {year}
           </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-xs text-indigo-600 flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-indigo-100 shadow-sm hidden md:flex">
            <AlertCircle className="w-3 h-3" />
            Clique nos valores "Meta" para editar
          </div>
          <button 
             onClick={handlePrint}
             className="flex items-center gap-2 px-3 py-1.5 bg-[#1B203C] text-white text-xs font-bold rounded-lg hover:bg-black transition-colors shadow-sm"
          >
             <Printer className="w-3.5 h-3.5" />
             Baixar Planejamento (PDF)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div>
           <h4 className="flex items-center gap-2 text-emerald-700 font-bold mb-6 text-sm uppercase border-b-2 border-emerald-100 pb-2">
              <CheckCircle2 className="w-5 h-5" />
              Metas de Entrada
           </h4>
           {renderCategoryGroup(TransactionType.INCOME)}
        </div>
        <div>
           <h4 className="flex items-center gap-2 text-red-700 font-bold mb-6 text-sm uppercase border-b-2 border-red-100 pb-2">
              <Target className="w-5 h-5" />
              Limites de Saída
           </h4>
           {renderCategoryGroup(TransactionType.EXPENSE)}
        </div>
      </div>
    </div>
  );
};

export default BudgetComparison;
