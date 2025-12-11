import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Transaction, TransactionType } from '../types';

interface FinancialChartProps {
  transactions: Transaction[];
}

const FinancialChart: React.FC<FinancialChartProps> = ({ transactions }) => {
  const chartData = useMemo(() => {
    // Filter out invoice payments
    const validTransactions = transactions.filter(t => !t.isInvoicePayment);

    // Group by date
    const grouped = validTransactions.reduce((acc, curr) => {
      const date = new Date(curr.date).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' });
      if (!acc[date]) {
        acc[date] = { date, income: 0, expense: 0, balance: 0, rawDate: curr.date };
      }
      if (curr.type === TransactionType.INCOME) {
        acc[date].income += curr.amount;
      } else {
        acc[date].expense += curr.amount;
      }
      return acc;
    }, {} as Record<string, { date: string; income: number; expense: number; balance: number; rawDate: string }>);

    // Convert to array and sort
    const data = Object.values(grouped) as { date: string; income: number; expense: number; balance: number; rawDate: string }[];
    
    return data.sort((a, b) => 
      new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime()
    );
  }, [transactions]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-xl">
          <p className="text-slate-700 font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm font-semibold">
              {entry.name === 'income' ? 'Entrada' : 'Saída'}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (transactions.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400 border border-dashed border-slate-200 rounded-xl bg-slate-50">
        Sem dados para exibir neste período
      </div>
    );
  }

  return (
    <div className="bg-[#FBFBFB] rounded-xl p-6 border border-slate-200 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-800 mb-6">Tendências do Período</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#bef264" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#bef264" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis 
              dataKey="date" 
              stroke="#64748b" 
              fontSize={12} 
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis 
              stroke="#64748b" 
              fontSize={12} 
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `R$ ${value}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="income" 
              stroke="#bef264" 
              fillOpacity={1} 
              fill="url(#colorIncome)" 
              strokeWidth={2}
            />
            <Area 
              type="monotone" 
              dataKey="expense" 
              stroke="#ef4444" 
              fillOpacity={1} 
              fill="url(#colorExpense)" 
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default FinancialChart;