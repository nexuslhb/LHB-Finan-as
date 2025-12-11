
import React, { useMemo } from 'react';
import { Transaction, TransactionType, MONTH_NAMES } from '../types';
import { Printer } from 'lucide-react';

interface MonthlyControlProps {
  transactions: Transaction[];
  year: number;
  transactionHierarchy: Record<TransactionType, Record<string, string[]>>;
}

const MonthlyControl: React.FC<MonthlyControlProps> = ({ transactions, year, transactionHierarchy }) => {
  // Helper to format currency
  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  // Process data into a matrix
  const dataMatrix = useMemo(() => {
    // Initialize structure
    const structure: Record<string, number[]> = {};
    const monthlyTotals = Array(12).fill(0).map(() => ({ income: 0, expense: 0, balance: 0 }));

    // 1. Build hierarchy skeleton using the dynamic hierarchy
    (Object.entries(transactionHierarchy) as [TransactionType, Record<string, string[]>][]).forEach(([type, categories]) => {
      (Object.entries(categories) as [string, string[]][]).forEach(([cat, subCats]) => {
        subCats.forEach(sub => {
          const key = `${type}|${cat}|${sub}`;
          structure[key] = Array(13).fill(0); // 0-11 for months, 12 for total
        });
      });
    });

    // 2. Fill with transaction data
    // FILTER: Ignore invoice payments to avoid double counting expenses
    const validTransactions = transactions.filter(t => !t.isInvoicePayment);

    validTransactions.forEach(t => {
      const tDate = new Date(t.date);
      if (tDate.getFullYear() !== year) return;

      const month = tDate.getMonth();
      const key = `${t.type}|${t.category}|${t.subCategory}`;
      
      if (structure[key]) {
        structure[key][month] += t.amount;
        structure[key][12] += t.amount; // Annual Total
      }

      // Update monthly totals regardless of hierarchy presence
      if (t.type === TransactionType.INCOME) {
        monthlyTotals[month].income += t.amount;
        monthlyTotals[month].balance += t.amount;
      } else {
        monthlyTotals[month].expense += t.amount;
        monthlyTotals[month].balance -= t.amount;
      }
    });

    return { structure, monthlyTotals };
  }, [transactions, year, transactionHierarchy]);

  const { structure, monthlyTotals } = dataMatrix;

  // Calculate Totals for Header
  const annualIncome = monthlyTotals.reduce((acc, curr) => acc + curr.income, 0);
  const annualExpense = monthlyTotals.reduce((acc, curr) => acc + curr.expense, 0);
  const annualBalance = annualIncome - annualExpense;

  const handlePrint = () => {
    const win = window.open('', '', 'height=800,width=1200');
    if (!win) return;

    const dateStr = new Date().toLocaleDateString('pt-BR');

    win.document.write('<html><head><title>Relatório Anual</title>');
    win.document.write(`
      <style>
        @page { size: landscape; margin: 10mm; }
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          font-size: 10px; 
          color: #0f172a; 
          -webkit-print-color-adjust: exact; 
          print-color-adjust: exact; 
        }
        h1 { margin: 0 0 5px 0; color: #1e293b; font-size: 18px; }
        .meta { color: #64748b; margin-bottom: 15px; font-size: 11px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #cbd5e1; padding: 4px; text-align: center; }
        th { background-color: #f1f5f9 !important; font-weight: bold; color: #334155; }
        .text-left { text-align: left; }
        .category-row { background-color: #f8fafc !important; font-weight: bold; color: #0f172a; text-transform: uppercase; font-size: 9px; }
        .income-header { background-color: #AFDE22 !important; color: #1B203C !important; font-weight: bold; }
        .expense-header { background-color: #ef4444 !important; color: white !important; font-weight: bold; }
        .total-row { background-color: #1e293b !important; color: white !important; font-weight: bold; }
        .pos { color: #AFDE22; font-weight: 600; text-shadow: 0px 0px 1px rgba(0,0,0,0.1); }
        .neg { color: #dc2626; font-weight: 600; }
        .zero { color: #cbd5e1; }
      </style>
    `);
    win.document.write('</head><body>');
    win.document.write(`<h1>Controle Financeiro Anual - ${year}</h1>`);
    win.document.write(`<div class="meta">Gerado em ${dateStr}</div>`);
    
    let html = '<table><thead><tr><th>Categoria</th>';
    MONTH_NAMES.forEach(m => html += `<th>${m.substring(0, 3)}</th>`);
    html += '<th>Total</th></tr></thead><tbody>';

    const buildSection = (type: TransactionType) => {
      const isIncome = type === TransactionType.INCOME;
      const headerClass = isIncome ? 'income-header' : 'expense-header';
      
      html += `<tr class="${headerClass}"><td class="text-left">${isIncome ? 'RECEITAS' : 'DESPESAS'}</td>`;
      MONTH_NAMES.forEach((_, idx) => html += `<td>${formatCurrency(monthlyTotals[idx][isIncome ? 'income' : 'expense'])}</td>`);
      html += `<td>${formatCurrency(isIncome ? annualIncome : annualExpense)}</td></tr>`;

      (Object.entries(transactionHierarchy[type]) as [string, string[]][]).forEach(([catName, subCats]) => {
         // Check if category has any value
         let hasVal = false;
         subCats.forEach(sub => {
            const key = `${type}|${catName}|${sub}`;
            if (structure[key] && structure[key][12] !== 0) hasVal = true;
         });
         
         if (hasVal) {
             html += `<tr class="category-row"><td class="text-left">${catName}</td><td colspan="13"></td></tr>`;
             subCats.forEach(sub => {
                const key = `${type}|${catName}|${sub}`;
                const values = structure[key] || Array(13).fill(0);
                if (values[12] === 0) return; // Skip empty

                html += `<tr><td class="text-left" style="padding-left: 15px;">${sub}</td>`;
                values.forEach((val, idx) => {
                   html += `<td>${val > 0 ? `<span class="${isIncome ? 'pos' : ''}">${formatCurrency(val)}</span>` : '<span class="zero">-</span>'}</td>`;
                });
                html += '</tr>';
             });
         }
      });
    };

    buildSection(TransactionType.INCOME);
    // Spacer
    html += '<tr><td colspan="14" style="height: 10px; border: none;"></td></tr>';
    buildSection(TransactionType.EXPENSE);
    
    html += '<tr class="total-row"><td class="text-left">SALDO LÍQUIDO</td>';
    monthlyTotals.forEach(m => html += `<td class="${m.balance >= 0 ? 'pos' : ''}">${formatCurrency(m.balance)}</td>`);
    html += `<td class="${annualBalance >= 0 ? 'pos' : ''}">${formatCurrency(annualBalance)}</td></tr>`;
    html += '</tbody></table></body></html>';

    win.document.write(html);
    win.document.close();
    win.print();
  };

  const renderSection = (type: TransactionType, textColorClass: string, headerColor: string, borderColor: string) => {
    const categories = transactionHierarchy[type];
    const isIncome = type === TransactionType.INCOME;
    const headerTextColor = isIncome ? 'text-slate-900' : 'text-white';
    const cellBorderColor = isIncome ? 'border-black/5' : 'border-white/20';

    return (
      <>
        {/* Main Section Header (e.g., RECEITAS) */}
        <tr className={`${headerColor} ${headerTextColor} font-bold sticky top-[45px] z-10 shadow-sm`}>
          <td className={`p-3 border-b border-r ${cellBorderColor} min-w-[220px] text-left pl-4 uppercase tracking-wider text-xs`}>
            {isIncome ? 'Entradas (Receitas)' : 'Saídas (Despesas)'}
          </td>
          {MONTH_NAMES.map((_, idx) => (
             <td key={idx} className={`p-3 border-b border-r ${cellBorderColor} text-center min-w-[110px] text-xs`}>
               {formatCurrency(monthlyTotals[idx][isIncome ? 'income' : 'expense'])}
             </td>
          ))}
          <td className={`p-3 border-b border-l ${cellBorderColor} text-center min-w-[130px] ${isIncome ? 'bg-black/5' : 'bg-black/20'} text-xs`}>
             {formatCurrency(isIncome ? annualIncome : annualExpense)}
          </td>
        </tr>

        {/* Categories and Subcategories */}
        {(Object.entries(categories) as [string, string[]][]).map(([catName, subCats]) => (
          <React.Fragment key={catName}>
            <tr className="bg-slate-100/80 font-semibold text-slate-800 text-xs">
              <td className={`p-2 pl-4 border-b border-r border-slate-200 ${borderColor} border-l-4`}>{catName}</td>
              {Array(13).fill(null).map((_, i) => (
                <td key={i} className="p-2 border-b border-r border-slate-200"></td>
              ))}
            </tr>
            {subCats.map(sub => {
              const key = `${type}|${catName}|${sub}`;
              const values = structure[key] || Array(13).fill(0);
              const isRowZero = values[12] === 0;

              return (
                <tr key={sub} className={`group hover:bg-slate-50 transition-colors text-xs text-slate-600 ${isRowZero ? 'opacity-60 hover:opacity-100' : ''}`}>
                  <td className="p-2.5 border-b border-r border-slate-200 border-l border-l-transparent pl-8 font-medium text-slate-500 group-hover:text-slate-800">
                    {sub}
                  </td>
                  {values.map((val, idx) => {
                    const isTotalCol = idx === 12;
                    return (
                      <td key={idx} className={`p-2.5 border-b border-r border-slate-200 text-center ${isTotalCol ? 'bg-slate-50 font-semibold text-slate-800' : ''}`}>
                        {val > 0 ? (
                           <span className={isIncome ? 'text-[#AFDE22] font-bold' : 'text-slate-700'}>
                             {formatCurrency(val)}
                           </span>
                        ) : (
                           <span className="text-slate-300">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </React.Fragment>
        ))}
      </>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Print Button Header */}
      <div className="p-2 flex justify-end bg-slate-50 border-b border-slate-100">
        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#1B203C] text-white text-xs font-bold rounded-lg hover:bg-black transition-colors shadow-sm"
        >
          <Printer className="w-3.5 h-3.5" />
          Baixar Relatório Anual (PDF)
        </button>
      </div>

      <div className="overflow-x-auto custom-scrollbar flex-1">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-20 shadow-md">
            <tr className="bg-slate-900 text-white font-bold text-xs uppercase">
              <th className="p-3.5 border-r border-slate-700 text-left min-w-[220px] sticky left-0 bg-slate-900 z-30">
                <span className="text-slate-400 font-medium mr-1">Exercício:</span> {year}
              </th>
              {MONTH_NAMES.map(m => (
                <th key={m} className="p-3.5 border-r border-slate-700 text-center min-w-[110px]">{m.substring(0, 3)}</th>
              ))}
              <th className="p-3.5 text-center min-w-[130px] bg-black">Total</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            
            {/* Income Section - Brand Green */}
            {renderSection(TransactionType.INCOME, 'text-[#AFDE22]', 'bg-[#AFDE22]', 'border-[#AFDE22]')}

            {/* Spacer Row */}
            <tr><td colSpan={14} className="h-4 bg-slate-50 border-y border-slate-200"></td></tr>

            {/* Expense Section - Red */}
            {renderSection(TransactionType.EXPENSE, 'text-red-700', 'bg-red-600', 'border-red-500')}

            {/* Final Balance Row */}
            <tr className="bg-slate-900 text-white font-bold sticky bottom-0 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] text-xs uppercase tracking-wide">
              <td className="p-4 border-r border-slate-700 pl-4">Saldo Líquido</td>
              {monthlyTotals.map((m, idx) => (
                <td key={idx} className={`p-4 border-r border-slate-700 text-center ${
                  m.balance >= 0 ? 'text-[#AFDE22]' : 'text-red-400'
                }`}>
                  {formatCurrency(m.balance)}
                </td>
              ))}
              <td className={`p-4 text-center bg-black ${
                annualBalance >= 0 ? 'text-[#AFDE22]' : 'text-red-400'
              }`}>
                {formatCurrency(annualBalance)}
              </td>
            </tr>

          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MonthlyControl;
