
import React, { useMemo, useState } from 'react';
import { Bill, Notification, CreditCardConfig, Transaction, Budget, TransactionType } from '../types';
import { Bell, AlertCircle, AlertTriangle, CheckCircle, X, Trash2, CreditCard, Target, TrendingUp, TrendingDown } from 'lucide-react';

interface NotificationCenterProps {
  bills: Bill[];
  cardConfigs: CreditCardConfig[];
  transactions: Transaction[];
  budgets: Budget[];
  onNavigateToBills: () => void;
  onNavigateToCards: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ 
  bills, 
  cardConfigs, 
  transactions,
  budgets,
  onNavigateToBills, 
  onNavigateToCards 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
  };

  const notifications = useMemo(() => {
    const alerts: Notification[] = [];
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    // Previous Month info for "Month Ended" alerts
    let prevMonth = currentMonth - 1;
    let prevYear = currentYear;
    if (prevMonth < 0) {
        prevMonth = 11;
        prevYear -= 1;
    }

    // Key to check for exclusions in the current month
    const currentMonthExclusionKey = `${currentYear}-${currentMonth}`;

    // --- 1. BILLS ---
    bills.forEach(bill => {
      // 0. Check Exclusions: If bill is excluded for THIS month (e.g. deferred), ignore it.
      if (bill.exclusions && bill.exclusions.includes(currentMonthExclusionKey)) {
        return;
      }

      // Check if bill is active for this month
      let isActive = false;
      let displayInstallment = 0;

      if (bill.startDate) {
        const start = new Date(bill.startDate);
        // Fixed bill check
        if (bill.type === 'INSTALLMENT') {
           const diffMonths = (currentYear - start.getFullYear()) * 12 + (currentMonth - start.getMonth());
           displayInstallment = diffMonths + 1;
           if (displayInstallment >= 1 && displayInstallment <= (bill.totalInstallments || 0)) {
             isActive = true;
           }
        } else {
           if (bill.endDate) {
              const end = new Date(bill.endDate);
              const viewMonthIndex = currentYear * 12 + currentMonth;
              const endMonthIndex = end.getFullYear() * 12 + end.getMonth();
              if (viewMonthIndex <= endMonthIndex) isActive = true;
           } else {
             if (start <= new Date(currentYear, currentMonth + 1, 0)) isActive = true;
           }
        }
      }

      if (!isActive) return;

      // Check if already paid this month
      const isPaid = bill.paymentHistory.some(dateStr => {
        const d = new Date(dateStr);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });

      if (isPaid) return;

      // Determine Due Date Logic
      const effectiveDueDay = Math.min(bill.dueDay, lastDayOfMonth);
      const remainingDays = effectiveDueDay - currentDay;

      if (remainingDays < 0) {
        alerts.push({
          id: `${bill.id}-overdue`,
          title: 'Conta Atrasada!',
          message: `A conta "${bill.description}" venceu dia ${effectiveDueDay}/${currentMonth + 1}.`,
          type: 'DANGER',
          billId: bill.id
        });
      } else if (remainingDays === 0) {
        alerts.push({
          id: `${bill.id}-today`,
          title: 'Vence Hoje!',
          message: `A conta "${bill.description}" vence hoje.`,
          type: 'WARNING',
          billId: bill.id
        });
      } else if (remainingDays <= 3) {
        alerts.push({
          id: `${bill.id}-soon`,
          title: 'Vence em Breve',
          message: `A conta "${bill.description}" vence em ${remainingDays} dias (dia ${effectiveDueDay}).`,
          type: 'INFO',
          billId: bill.id
        });
      }
    });

    // --- 2. CREDIT CARDS ---
    cardConfigs.forEach(card => {
        const effectiveDueDay = Math.min(card.dueDay, lastDayOfMonth);
        const remainingDays = effectiveDueDay - currentDay;

        if (remainingDays < 0) {
            if (remainingDays > -5) {
                alerts.push({
                    id: `card-${card.id}-overdue`,
                    title: 'Fatura Atrasada!',
                    message: `A fatura do cartão "${card.name}" venceu dia ${effectiveDueDay}/${currentMonth + 1}.`,
                    type: 'DANGER'
                });
            }
        } else if (remainingDays === 0) {
            alerts.push({
                id: `card-${card.id}-today`,
                title: 'Fatura Vence Hoje!',
                message: `A fatura do cartão "${card.name}" vence hoje.`,
                type: 'WARNING'
            });
        } else if (remainingDays <= 3) {
             alerts.push({
                id: `card-${card.id}-soon`,
                title: 'Fatura em Breve',
                message: `A fatura do cartão "${card.name}" vence em ${remainingDays} dias.`,
                type: 'INFO'
            });
        }
    });

    // --- 3. BUDGETS (PLANEJAMENTO) ---
    budgets.forEach(budget => {
        // Only process if a value is set
        if (budget.amount <= 0) return;

        // Determine if this budget is for Current Month or Previous Month
        const isCurrentMonth = budget.month === currentMonth && budget.year === currentYear;
        const isPrevMonth = budget.month === prevMonth && budget.year === prevYear;

        if (!isCurrentMonth && !isPrevMonth) return;

        // Calculate Realized Amount for this specific budget category/month
        const realized = transactions
            .filter(t => 
                !t.isInvoicePayment &&
                t.type === budget.type &&
                t.category === budget.category &&
                t.subCategory === budget.subCategory &&
                new Date(t.date).getMonth() === budget.month &&
                new Date(t.date).getFullYear() === budget.year
            )
            .reduce((sum, t) => sum + t.amount, 0);

        const diff = Math.abs(realized - budget.amount);
        const diffFormatted = formatCurrency(diff);
        const metaName = budget.subCategory; // Nome da meta estipulada

        // --- INCOME (ENTRADAS) ---
        if (budget.type === TransactionType.INCOME) {
            if (realized > budget.amount) {
                // EXCEEDED (Current or Past)
                alerts.push({
                    id: `budget-inc-exceeded-${budget.id}`,
                    title: 'Meta Excedida',
                    message: `Parabéns você excedeu sua meta de ${metaName}, você está ${diffFormatted} mais rico.`,
                    type: 'INFO' // Green
                });
            } else if (realized === budget.amount) {
                // EXACT (Current or Past)
                alerts.push({
                    id: `budget-inc-hit-${budget.id}`,
                    title: 'Meta Batida',
                    message: `Parabéns sua meta de ${metaName} foi batida com sucesso`,
                    type: 'INFO' // Green
                });
            } else if (realized < budget.amount && isPrevMonth) {
                // MISSED (Only relevant if month ended)
                alerts.push({
                    id: `budget-inc-miss-${budget.id}`,
                    title: 'Meta Não Batida',
                    message: `Infelizmente sua meta de ${metaName} não foi batida, você está ${diffFormatted} mais pobre.`,
                    type: 'DANGER' // Red
                });
            }
        } 
        // --- EXPENSE (SAÍDAS) ---
        else {
            if (realized > budget.amount) {
                // OVERSPENT (Current or Past)
                alerts.push({
                    id: `budget-exp-over-${budget.id}`,
                    title: 'Meta Estourada',
                    message: `Infelizmente você gastou demais em sua meta de ${metaName}, você está ${diffFormatted} mais pobre.`,
                    type: 'DANGER' // Red
                });
            } else if (realized < budget.amount && isPrevMonth) {
                // SAVED (Only relevant if month ended)
                alerts.push({
                    id: `budget-exp-save-${budget.id}`,
                    title: 'Economia Realizada',
                    message: `Parabéns você economizou mais que estabeleceu para sua meta de ${metaName}, você está ${diffFormatted} mais rico`,
                    type: 'INFO' // Green
                });
            } else if (realized === budget.amount && isPrevMonth) {
                 // EXACT (Only relevant if month ended)
                 alerts.push({
                    id: `budget-exp-hit-${budget.id}`,
                    title: 'Meta Batida',
                    message: `Parabéns sua meta de ${metaName} foi batida com sucesso`,
                    type: 'INFO' // Green
                });
            }
        }
    });

    return alerts
      .filter(a => !dismissedIds.includes(a.id)) // Filter out dismissed notifications
      .sort((a, b) => {
        // Sort Priority: DANGER > WARNING > INFO
        const priority = { 'DANGER': 3, 'WARNING': 2, 'INFO': 1 };
        return priority[b.type] - priority[a.type];
    });
  }, [bills, cardConfigs, transactions, budgets, dismissedIds]);

  const handleDismiss = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent navigating
    setDismissedIds(prev => [...prev, id]);
  };

  const handleClickNotification = (notification: Notification) => {
      setIsOpen(false);
      if (notification.id.startsWith('card-')) {
          onNavigateToCards();
      } else if (notification.id.startsWith('budget-')) {
          // Stay or navigate to Month Planning? For now just close.
      } else {
          onNavigateToBills();
      }
  };

  if (notifications.length === 0) {
    return (
      <div className="relative p-2 text-[#1B203C] hover:text-[#0C2BD8] transition-colors cursor-pointer group">
         <Bell className="w-6 h-6" />
      </div>
    );
  }

  return (
    <div className="relative z-50">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-[#1B203C] hover:text-[#0C2BD8] transition-colors"
      >
        <Bell className="w-6 h-6" />
        <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          ></div>
          <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
            <div className="p-3 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h3 className="font-semibold text-slate-800 text-sm">Notificações ({notifications.length})</h3>
              <button onClick={() => setIsOpen(false)}><X className="w-4 h-4 text-slate-400 hover:text-slate-600" /></button>
            </div>
            
            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              {notifications.map(note => (
                <div 
                  key={note.id} 
                  onClick={() => handleClickNotification(note)}
                  className={`group/item p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors flex gap-3 items-start relative`}
                >
                  <div className={`mt-0.5 p-1.5 rounded-full shrink-0 ${
                      note.type === 'DANGER' ? 'bg-red-100 text-red-600' :
                      note.type === 'WARNING' ? 'bg-amber-100 text-amber-600' :
                      'bg-emerald-100 text-emerald-600'
                  }`}>
                      {note.id.startsWith('card-') ? <CreditCard className="w-4 h-4" /> : 
                       note.id.startsWith('budget-') ? <Target className="w-4 h-4" /> :
                       note.type === 'DANGER' ? <AlertCircle className="w-4 h-4" /> :
                       note.type === 'WARNING' ? <AlertTriangle className="w-4 h-4" /> :
                       <CheckCircle className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 pr-6">
                    <h4 className={`text-sm font-bold ${
                        note.type === 'DANGER' ? 'text-red-600' :
                        note.type === 'WARNING' ? 'text-amber-600' :
                        'text-emerald-600'
                    }`}>
                        {note.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{note.message}</p>
                  </div>
                  
                  {/* Delete Icon */}
                  <button 
                    onClick={(e) => handleDismiss(e, note.id)}
                    className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded transition-all opacity-0 group-hover/item:opacity-100"
                    title="Excluir notificação"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationCenter;
