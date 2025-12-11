import React, { useState } from 'react';
import { Transaction, CreditCardConfig } from '../types';
import BankAccountsView from './BankAccountsView';
import CreditCardsView from './CreditCardsView';
import { CreditCard, Landmark, Wallet } from 'lucide-react';

interface BanksTabProps {
  transactions: Transaction[];
  cardConfigs: CreditCardConfig[];
  banks: string[];
  onUpdateConfig: (config: CreditCardConfig) => void;
  onAddConfig: (config: CreditCardConfig) => void;
  onDeleteConfig: (id: string) => void;
  onAddTransaction: (transaction: Transaction) => void;
  onUpdateTransaction: (transaction: Transaction) => void;
  onAddBank: (name: string) => void;
  onDeleteBank: (name: string) => void;
}

type SubTab = 'cards' | 'accounts';

const BanksTab: React.FC<BanksTabProps> = ({ 
  transactions, 
  cardConfigs, 
  banks,
  onUpdateConfig,
  onAddConfig,
  onDeleteConfig,
  onAddTransaction,
  onUpdateTransaction,
  onAddBank,
  onDeleteBank
}) => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('cards');

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Header & Navigation */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Landmark className="w-7 h-7 text-[#0C2BD8]" />
            Bancos & Cartões
          </h2>
          <p className="text-slate-500 mt-1">Gerencie suas contas bancárias, saldos e limites de crédito.</p>
        </div>

        <div className="bg-[#FBFBFB] p-1.5 rounded-xl border border-slate-200 flex w-full md:w-auto">
          <button
            onClick={() => setActiveSubTab('cards')}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 flex-1 md:flex-none ${
              activeSubTab === 'cards' 
                ? 'bg-white text-[#0C2BD8] shadow-sm ring-1 ring-black/5' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            Cartões
          </button>
          <button
            onClick={() => setActiveSubTab('accounts')}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 flex-1 md:flex-none ${
              activeSubTab === 'accounts' 
                ? 'bg-white text-[#0C2BD8] shadow-sm ring-1 ring-black/5' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Wallet className="w-4 h-4" />
            Contas
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="bg-transparent">
        {activeSubTab === 'cards' ? (
          <CreditCardsView 
            transactions={transactions} 
            cardConfigs={cardConfigs}
            banks={banks}
            onUpdateConfig={onUpdateConfig}
            onAddConfig={onAddConfig}
            onDeleteConfig={onDeleteConfig}
            onAddTransaction={onAddTransaction}
            onUpdateTransaction={onUpdateTransaction}
          />
        ) : (
          <BankAccountsView 
            transactions={transactions} 
            banks={banks}
            onAddTransaction={onAddTransaction}
            onAddBank={onAddBank}
            onDeleteBank={onDeleteBank}
          />
        )}
      </div>
    </div>
  );
};

export default BanksTab;