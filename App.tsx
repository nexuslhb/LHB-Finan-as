
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Transaction, TransactionType, Goal, TabView, Budget, Investment, CreditCardConfig, Bill, DEFAULT_BANKS, DEFAULT_TRANSACTION_HIERARCHY, DEFAULT_INVESTMENT_HIERARCHY, DEFAULT_PAYMENT_METHODS } from './types';
import DashboardTab from './components/DashboardTab';
import FinancialControlTab from './components/FinancialControlTab';
import InvestmentsTab from './components/InvestmentsTab';
import GoalsTab from './components/GoalsTab';
import MonthsTab from './components/MonthsTab';
import BanksTab from './components/BanksTab';
import BillsTab from './components/BillsTab';
import SettingsView from './components/SettingsView';
import UserProfileView from './components/UserProfileView';
import NotificationCenter from './components/NotificationCenter';
import AuthScreen from './components/AuthScreen';
import { Wallet, LayoutDashboard, ListTodo, TrendingUp, Target, CalendarDays, Landmark, FileText, Settings, ChevronDown, User, LogOut, Loader2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './context/AuthContext';
import { db } from './services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const App: React.FC = () => {
  const { user, loading, logout, userData } = useAuth();
  
  // --- APP DATA STATE ---
  const [activeTab, setActiveTab] = useState<TabView>('dashboard');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [dataLoading, setDataLoading] = useState(true);
  
  // Dynamic Configuration State
  const [transactionHierarchy, setTransactionHierarchy] = useState(DEFAULT_TRANSACTION_HIERARCHY);
  const [investmentHierarchy, setInvestmentHierarchy] = useState(DEFAULT_INVESTMENT_HIERARCHY);
  const [paymentMethods, setPaymentMethods] = useState(DEFAULT_PAYMENT_METHODS);
  const [banks, setBanks] = useState<string[]>(DEFAULT_BANKS);

  // Core Data
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [cardConfigs, setCardConfigs] = useState<CreditCardConfig[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);

  // Get First Name for Header
  const firstName = useMemo(() => {
    const name = userData?.displayName || user?.displayName || '';
    return name.split(' ')[0] || 'Visitante';
  }, [user, userData]);

  // --- FIRESTORE SYNC ---

  // Load Data on Mount (when user exists)
  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        setDataLoading(false);
        return;
      }
      
      try {
        const docRef = doc(db, 'users', user.uid, 'data', 'finance_data');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setTransactions(data.transactions || []);
          setGoals(data.goals || []);
          setBudgets(data.budgets || []);
          setInvestments(data.investments || []);
          setCardConfigs(data.cardConfigs || []);
          setBills(data.bills || []);
          setBanks(data.banks || DEFAULT_BANKS);
          setTransactionHierarchy(data.transactionHierarchy ? JSON.parse(data.transactionHierarchy) : DEFAULT_TRANSACTION_HIERARCHY);
          setInvestmentHierarchy(data.investmentHierarchy ? JSON.parse(data.investmentHierarchy) : DEFAULT_INVESTMENT_HIERARCHY);
          setPaymentMethods(data.paymentMethods || DEFAULT_PAYMENT_METHODS);
        } else {
          // Initialize defaults if no data
          setBanks(DEFAULT_BANKS);
          setTransactions([]);
          setGoals([]);
          setBudgets([]);
          setInvestments([]);
          setCardConfigs([]);
          setBills([]);
        }
      } catch (error) {
        console.error("Error loading data from Firestore", error);
      } finally {
        setDataLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Save Data Effect (Debounced or simple trigger)
  const isFirstRender = useRef(true);

  // Helper function to remove undefined values (Firestore does not support undefined)
  // This converts the object to JSON and back, stripping undefined keys
  const sanitize = (data: any) => {
      if (data === undefined) return null;
      return JSON.parse(JSON.stringify(data));
  };

  // Função dedicada para salvar os dados
  const saveData = async () => {
      if (!user) return;
      try {
        const docRef = doc(db, 'users', user.uid, 'data', 'finance_data');
        // Sanitize data before saving
        const dataToSave = sanitize({
          transactions,
          goals,
          budgets,
          investments,
          cardConfigs,
          bills,
          banks,
          transactionHierarchy: JSON.stringify(transactionHierarchy),
          investmentHierarchy: JSON.stringify(investmentHierarchy),
          paymentMethods
        });
        
        await setDoc(docRef, dataToSave, { merge: true });
      } catch (error) {
        console.error("Erro ao salvar dados no Firestore", error);
      }
  };

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    if (!user || dataLoading) return;

    const timeoutId = setTimeout(saveData, 1000); // Debounce 1s
    return () => clearTimeout(timeoutId);
    
  }, [transactions, goals, budgets, investments, cardConfigs, bills, banks, transactionHierarchy, investmentHierarchy, paymentMethods, user, dataLoading]);


  // Click outside to close menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // --- APP ACTIONS ---
  const addBank = (name: string) => {
    if (!banks.includes(name)) {
      setBanks(prev => [...prev, name]);
    }
  };

  const deleteBank = (name: string) => {
    setBanks(prev => prev.filter(b => b !== name));
  };

  const addTransaction = (transaction: Transaction) => {
    setTransactions(prev => [transaction, ...prev]);
  };

  const updateTransaction = (updatedTransaction: Transaction) => {
    setTransactions(prev => prev.map(t => t.id === updatedTransaction.id ? updatedTransaction : t));
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const addGoal = (goal: Goal) => {
    setGoals(prev => [...prev, goal]);
  };

  const deleteGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const updateGoal = (id: string, amount: number) => {
     setGoals(prev => prev.map(g => g.id === id ? { ...g, currentAmount: amount } : g));
  };

  const addInvestment = (investment: Investment) => {
    setInvestments(prev => [investment, ...prev]);
  };

  const deleteInvestment = (id: string) => {
    setInvestments(prev => prev.filter(i => i.id !== id));
  };

  const saveBudget = (budget: Budget) => {
    setBudgets(prev => {
      // Check if budget exists for this specific category/month/year
      const existingIndex = prev.findIndex(b => 
        b.type === budget.type && 
        b.category === budget.category && 
        b.subCategory === budget.subCategory && 
        b.month === budget.month && 
        b.year === budget.year
      );

      if (existingIndex >= 0) {
        const newBudgets = [...prev];
        newBudgets[existingIndex] = budget;
        return newBudgets;
      }
      return [...prev, budget];
    });
  };

  const updateCardConfig = (config: CreditCardConfig) => {
    setCardConfigs(prev => {
      const existingIndex = prev.findIndex(c => c.id === config.id);
      if (existingIndex >= 0) {
        const newConfigs = [...prev];
        newConfigs[existingIndex] = config;
        return newConfigs;
      }
      return [...prev, config];
    });
  };

  const addCardConfig = (config: CreditCardConfig) => {
    setCardConfigs(prev => [...prev, config]);
  };

  const deleteCardConfig = (id: string) => {
    setCardConfigs(prev => prev.filter(c => c.id !== id));
  };

  const addBill = (bill: Bill) => {
    setBills(prev => [...prev, bill]);
  };

  const updateBill = (updatedBill: Bill) => {
    setBills(prev => prev.map(b => b.id === updatedBill.id ? updatedBill : b));
  };

  const deleteBill = (id: string) => {
    setBills(prev => prev.filter(b => b.id !== id));
  };

  const handleLogout = async () => {
    if (window.confirm("Deseja realmente sair?")) {
       // 1. Salva tudo antes de sair para garantir
       await saveData(); 
       
       // 2. Desloga do Firebase
       await logout();
       
       // 3. Limpa a tela local (segurança visual)
       setTransactions([]);
       setGoals([]);
       setBudgets([]);
       setInvestments([]);
       setCardConfigs([]);
       setBills([]);
       setBanks(DEFAULT_BANKS);
       
       setActiveTab('dashboard');
       setIsMenuOpen(false);
    }
  };

  const stats = useMemo(() => {
    // Filter out invoice payments to avoid double counting expenses
    const validTransactions = transactions.filter(t => !t.isInvoicePayment);

    const income = validTransactions
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((acc, curr) => acc + curr.amount, 0);
    const expense = validTransactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((acc, curr) => acc + curr.amount, 0);
    return {
      income,
      expense,
      balance: income - expense
    };
  }, [transactions]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'control', label: 'Controle', icon: ListTodo },
    { id: 'bills', label: 'Contas', icon: FileText },
    { id: 'banks', label: 'Bancos', icon: Landmark },
    { id: 'investments', label: 'Investimentos', icon: TrendingUp },
    { id: 'goals', label: 'Metas', icon: Target },
    { id: 'months', label: 'Meses', icon: CalendarDays },
  ];

  // --- RENDER CONDITIONS ---

  if (loading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#EFF1F1]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-[#0C2BD8] animate-spin" />
          <p className="text-slate-500 font-medium">Carregando seus dados...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-[#EFF1F1] pb-20">
      {/* Header */}
      <header className="border-b border-slate-200 bg-[#FBFBFB] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 flex items-center justify-between">
            {/* Logo & Menu Section */}
            <div className="relative" ref={menuRef}>
                <button 
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center gap-2 select-none group hover:bg-slate-100 p-2 -ml-2 rounded-xl transition-all"
                >
                    <div className="bg-[#0C2BD8] p-2 rounded-lg shadow-sm flex items-center justify-center">
                       <Wallet className="w-6 h-6 text-white" />
                    </div>
                    
                    <div className="text-left">
                       <h1 className="text-lg sm:text-xl font-bold text-[#1B203C] leading-none flex items-center gap-2">
                         LHB Finanças 
                         <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isMenuOpen ? 'rotate-180' : ''}`} />
                       </h1>
                       <p className="text-xs text-slate-500 font-medium mt-0.5">Olá {firstName}</p>
                    </div>
                </button>

                {/* Dropdown Menu */}
                {isMenuOpen && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
                     <div className="p-3 border-b border-slate-100 bg-slate-50">
                        <p className="text-xs font-bold text-slate-500 uppercase">Logado como</p>
                        <p className="text-sm font-semibold text-slate-800 truncate">{user.displayName || user.email}</p>
                     </div>
                     <div className="p-2 space-y-1">
                        <button 
                          onClick={() => { setActiveTab('profile'); setIsMenuOpen(false); }}
                          className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-[#0C2BD8] rounded-lg flex items-center gap-3 transition-colors"
                        >
                           <User className="w-4 h-4" />
                           Usuário
                        </button>
                        <button 
                          onClick={() => { setActiveTab('settings'); setIsMenuOpen(false); }}
                          className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-[#0C2BD8] rounded-lg flex items-center gap-3 transition-colors"
                        >
                           <Settings className="w-4 h-4" />
                           Configurações
                        </button>
                     </div>
                     <div className="border-t border-slate-100 p-2">
                        <button 
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-3 transition-colors"
                        >
                           <LogOut className="w-4 h-4" />
                           Fazer Logoff
                        </button>
                     </div>
                  </div>
                )}
            </div>
            
            {/* Notification Center */}
            <NotificationCenter 
              bills={bills} 
              cardConfigs={cardConfigs}
              transactions={transactions}
              budgets={budgets}
              onNavigateToBills={() => setActiveTab('bills')} 
              onNavigateToCards={() => setActiveTab('banks')}
            />
          </div>
          
          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar -mb-px">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as TabView)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap rounded-t-lg ${
                    isActive 
                      ? 'border-[#0C2BD8] text-[#0C2BD8] bg-slate-50' 
                      : 'border-transparent text-[#1B203C] hover:text-[#0C2BD8] hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#0C2BD8]' : 'text-[#1B203C]'}`} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <DashboardTab transactions={transactions} budgets={budgets} stats={stats} />
        )}
        
        {activeTab === 'control' && (
          <FinancialControlTab 
            transactions={transactions} 
            cardConfigs={cardConfigs} 
            banks={banks}
            transactionHierarchy={transactionHierarchy}
            paymentMethods={paymentMethods}
            onAdd={addTransaction} 
            onDelete={deleteTransaction} 
          />
        )}

        {activeTab === 'investments' && (
          <InvestmentsTab 
            transactions={transactions} 
            investments={investments}
            banks={banks}
            investmentHierarchy={investmentHierarchy}
            onAddInvestment={addInvestment}
            onDeleteInvestment={deleteInvestment}
            onAddTransaction={addTransaction}
            onUpdateTransaction={updateTransaction}
            onDeleteTransaction={deleteTransaction}
          />
        )}

        {activeTab === 'goals' && (
          <GoalsTab 
            goals={goals} 
            transactions={transactions}
            onAddGoal={addGoal} 
            onDeleteGoal={deleteGoal} 
            onUpdateGoal={updateGoal}
          />
        )}

        {activeTab === 'months' && (
          <MonthsTab 
            transactions={transactions} 
            budgets={budgets}
            transactionHierarchy={transactionHierarchy}
            onSaveBudget={saveBudget}
          />
        )}

        {activeTab === 'banks' && (
          <BanksTab 
            transactions={transactions}
            cardConfigs={cardConfigs}
            banks={banks}
            onUpdateConfig={updateCardConfig}
            onAddConfig={addCardConfig}
            onDeleteConfig={deleteCardConfig}
            onAddTransaction={addTransaction}
            onUpdateTransaction={updateTransaction}
            onAddBank={addBank}
            onDeleteBank={deleteBank}
          />
        )}

        {activeTab === 'bills' && (
          <BillsTab 
             bills={bills}
             cardConfigs={cardConfigs}
             banks={banks}
             transactionHierarchy={transactionHierarchy}
             onAddBill={addBill}
             onDeleteBill={deleteBill}
             onUpdateBill={updateBill}
             onAddTransaction={addTransaction}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView 
            transactionHierarchy={transactionHierarchy}
            investmentHierarchy={investmentHierarchy}
            paymentMethods={paymentMethods}
            onUpdateTransactionHierarchy={setTransactionHierarchy}
            onUpdateInvestmentHierarchy={setInvestmentHierarchy}
            onUpdatePaymentMethods={setPaymentMethods}
          />
        )}

        {activeTab === 'profile' && (
          <UserProfileView />
        )}
      </main>
    </div>
  );
};

export default App;
