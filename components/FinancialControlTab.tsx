
import React from 'react';
import { Transaction, CreditCardConfig, TransactionType } from '../types';
import TransactionForm from './TransactionForm';
import TransactionList from './TransactionList';

interface FinancialControlTabProps {
  transactions: Transaction[];
  cardConfigs: CreditCardConfig[];
  banks: string[];
  transactionHierarchy: Record<TransactionType, Record<string, string[]>>;
  paymentMethods: string[];
  onAdd: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
}

const FinancialControlTab: React.FC<FinancialControlTabProps> = ({ transactions, cardConfigs, banks, transactionHierarchy, paymentMethods, onAdd, onDelete }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-500">
      {/* Left Column: Form */}
      <div className="lg:col-span-4">
        <TransactionForm 
          onAdd={onAdd} 
          cardConfigs={cardConfigs} 
          banks={banks} 
          transactionHierarchy={transactionHierarchy}
          paymentMethods={paymentMethods}
        />
      </div>

      {/* Right Column: List */}
      <div className="lg:col-span-8 h-full min-h-[500px]">
        <TransactionList 
          transactions={transactions} 
          onDelete={onDelete} 
          banks={banks} 
          transactionHierarchy={transactionHierarchy}
        />
      </div>
    </div>
  );
};

export default FinancialControlTab;
