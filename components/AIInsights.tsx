import React, { useState } from 'react';
import { Sparkles, Brain, TrendingUp, Lightbulb } from 'lucide-react';
import { Transaction, AIAnalysisResult } from '../types';
import { analyzeFinances } from '../services/geminiService';

interface AIInsightsProps {
  transactions: Transaction[];
}

const AIInsights: React.FC<AIInsightsProps> = ({ transactions }) => {
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyze = async () => {
    setIsLoading(true);
    try {
      // Filter out invoice payments to avoid double counting expenses in AI analysis
      const validTransactions = transactions.filter(t => !t.isInvoicePayment);
      const result = await analyzeFinances(validTransactions);
      setAnalysis(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-white rounded-xl p-6 border border-indigo-100 shadow-md relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-100/50 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-[#0C2BD8]/10 text-[#0C2BD8] rounded-lg">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800">Insights Financeiros Gemini</h3>
        </div>
        
        <button
          onClick={handleAnalyze}
          disabled={isLoading || transactions.length === 0}
          className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all ${
            isLoading 
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
              : 'bg-[#0C2BD8] hover:bg-[#0C2BD8]/90 text-white shadow-md active:scale-95'
          }`}
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Analisando...
            </>
          ) : (
            <>
              <Brain className="w-4 h-4" />
              Analisar Gastos
            </>
          )}
        </button>
      </div>

      {analysis ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white/60 rounded-lg p-4 border border-indigo-100 shadow-sm">
            <p className="text-slate-700 leading-relaxed text-sm">
              {analysis.summary}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4 border border-slate-100 shadow-sm flex flex-col justify-center items-center">
              <span className="text-slate-500 text-xs uppercase tracking-wider mb-1">Saúde Financeira</span>
              <div className="relative flex items-center justify-center">
                 <svg className="w-20 h-20 transform -rotate-90">
                    <circle
                      className="text-slate-100"
                      strokeWidth="8"
                      stroke="currentColor"
                      fill="transparent"
                      r="36"
                      cx="40"
                      cy="40"
                    />
                    <circle
                      className={`${
                        analysis.financialHealthScore > 70 ? 'text-emerald-500' :
                        analysis.financialHealthScore > 40 ? 'text-amber-500' : 'text-red-500'
                      }`}
                      strokeWidth="8"
                      strokeDasharray={226} // 2 * pi * 36
                      strokeDashoffset={226 - (226 * analysis.financialHealthScore) / 100}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      r="36"
                      cx="40"
                      cy="40"
                    />
                 </svg>
                 <span className="absolute text-xl font-bold text-slate-800">{analysis.financialHealthScore}</span>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-slate-100 shadow-sm">
               <div className="flex items-center gap-2 mb-3">
                 <TrendingUp className="w-4 h-4 text-emerald-500" />
                 <span className="text-slate-500 text-xs uppercase tracking-wider">Economia Potencial</span>
               </div>
               <p className="text-2xl font-bold text-emerald-600">{formatCurrency(analysis.projectedSavings)}</p>
               <p className="text-xs text-slate-500 mt-1">Estimativa mensal</p>
            </div>
          </div>

          <div>
             <h4 className="text-sm font-semibold text-[#0C2BD8] mb-3 flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                Dicas Práticas
             </h4>
             <ul className="space-y-2">
                {analysis.actionableTips.map((tip, idx) => (
                  <li key={idx} className="flex gap-3 text-sm text-slate-700 bg-white/50 p-2 rounded-md border border-slate-100">
                    <span className="text-[#0C2BD8] font-bold select-none">{idx + 1}.</span>
                    {tip}
                  </li>
                ))}
             </ul>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-slate-500">
           <p className="text-sm">Clique no botão analisar para gerar um relatório financeiro com IA.</p>
        </div>
      )}
    </div>
  );
};

export default AIInsights;