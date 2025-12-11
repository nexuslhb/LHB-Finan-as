
export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  date: string; // ISO Date string
  type: TransactionType;
  category: string;
  subCategory: string; // "Tipo"
  bank: string; // "Banco"
  paymentMethod: string; // "Forma de Pagamento"
  isPaid?: boolean; // Control for Credit Card invoices
  isInvoicePayment?: boolean; // Indicates this transaction is a credit card invoice payment
}

export interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
}

export interface Budget {
  id: string;
  type: TransactionType;
  category: string;
  subCategory: string;
  month: number; // 0-11
  year: number;
  amount: number;
}

export interface Investment {
  id: string;
  category: string; // e.g., "Renda Fixa"
  type: string;     // e.g., "CDB"
  description: string;
  amount: number;
  date: string;
  bank: string; // The institution where the investment is held
}

export interface CreditCardConfig {
  id: string;
  name: string; // Custom name (e.g., "Nubank Black")
  bank: string; // Linked bank (e.g., "Nubank")
  limit: number;
  closingDay: number;
  dueDay: number;
  color?: string; // Gradient class string
}

export interface Bill {
  id: string;
  description: string;
  amount: number; // Estimated/Fixed amount
  dueDay: number;
  category: string; // Maps to Expense Categories
  subCategory: string; // Maps to Expense Types
  type: 'FIXED' | 'INSTALLMENT';
  startDate: string; // ISO String, when the bill/installment started
  endDate?: string; // ISO String, optional end date for the bill (used for deferred one-time bills)
  totalInstallments?: number;
  currentInstallment?: number; // Deprecated in UI logic in favor of calculated date diff, but kept for legacy
  paymentHistory: string[]; // Array of ISO strings representing payments made
  exclusions?: string[]; // Array of "Year-Month" strings (e.g. "2025-0") to skip specific occurrences
  lastPaidDate?: string; // Legacy support
  autoPay?: boolean;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'WARNING' | 'DANGER' | 'INFO';
  billId?: string;
}

export type TabView = 'dashboard' | 'control' | 'months' | 'banks' | 'investments' | 'goals' | 'bills' | 'settings' | 'profile';

export const DEFAULT_BANKS = [
  "Carteira"
];

export const DEFAULT_PAYMENT_METHODS = [
  "Pix",
  "Dinheiro",
  "Débito",
  "Crédito",
  "Boleto"
];

export const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export interface AIAnalysisResult {
  summary: string;
  financialHealthScore: number; // 0-100
  actionableTips: string[];
  projectedSavings: number;
}

// Hierarchy: Type -> Category -> SubCategories (Types)
export const DEFAULT_TRANSACTION_HIERARCHY: Record<TransactionType, Record<string, string[]>> = {
  [TransactionType.INCOME]: {
    "Receita": [
      "Pró-labore",
      "Salário",
      "Freelance",
      "Comissão"
    ],
    "Juros": [
      "Aluguel Recebido",
      "Rendimentos de Investimentos"
    ],
    "Outras receitas": [
      "Venda de Bem Pessoal",
      "Doação",
      "Outros (Entradas)"
    ]
  },
  [TransactionType.EXPENSE]: {
    "Moradia": [
      "Aluguel/Parcelas do Imóvel",
      "Seguros",
      "Conta de Luz",
      "Conta de Água",
      "Telefone",
      "Tv a Cabo",
      "Internet",
      "Eletrodomésticos",
      "Melhorias",
      "Outros (Moradia)"
    ],
    "Transporte": [
      "Parcelamento do Carro",
      "Seguro do Carro",
      "IPVA / Licenciamento",
      "Combustível",
      "Aplicativos",
      "Transporte Público",
      "Pedágio",
      "Estacionamento",
      "Outros (Transporte)"
    ],
    "Saúde": [
      "Seguro de Vida",
      "Plano de Saúde",
      "Farmácia",
      "Consultas Médicas",
      "Dentista / Tratamento Odontológico",
      "Medicamentos",
      "Veterinário",
      "Outros (Saúde)"
    ],
    "Alimentação": [
      "Supermercado",
      "Suplementação",
      "Padaria",
      "Açougue / Peixaria",
      "Feira / Hortifrúti",
      "Delivery",
      "Água Mineral",
      "Outros (Alimentação)"
    ],
    "Pessoal": [
      "Compras pessoais",
      "Roupas",
      "Barbearia",
      "Games",
      "Shows",
      "Livros",
      "Hobbies",
      "Fotografia",
      "Esportes",
      "Academia",
      "Passeios",
      "Férias",
      "Viagem",
      "Outros (Pessoa)"
    ],
    "Obrigações": [
      "Dívidas",
      "Empréstimos",
      "Taxas e Impostos",
      "Outros (Obrigações)"
    ],
    "Investimentos": [
      "Renda Fixa",
      "Renda Variável",
      "Criptomoeda",
      "Investimento Exterior",
      "Outros Investimentos",
      "Metas"
    ]
  }
};

// Specific hierarchy for "Adicionar Investimento" modal
export const DEFAULT_INVESTMENT_HIERARCHY: Record<string, string[]> = {
  "Renda Fixa": [
    "Tesouro Direto",
    "CDB",
    "LCI",
    "LCA",
    "Poupança"
  ],
  "Renda Variável": [
    "Ações",
    "FIIs",
    "ETFs",
    "BDRs"
  ],
  "Criptomoeda": [
    "Bitcoin",
    "Ethereum",
    "Stablecoins",
    "Altcoins",
    "Outras (Criptos)"
  ],
  "Investimento Exterior": [
    "Stocks",
    "ETF",
    "REITs",
    "Bonds"
  ],
  "Outros Investimentos": [
    "Específico"
  ]
};
