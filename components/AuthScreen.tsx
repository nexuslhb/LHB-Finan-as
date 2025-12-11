
import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Wallet, Mail, Lock, User, Calendar, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

const AuthScreen: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        // Registration Logic
        if (password !== confirmPassword) {
          throw new Error("As senhas não coincidem.");
        }
        if (password.length < 6) {
           throw new Error("A senha deve ter pelo menos 6 caracteres.");
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Update Display Name in Auth
        await updateProfile(user, {
          displayName: name
        });

        // Create User Document in Firestore
        await setDoc(doc(db, 'users', user.uid), {
          displayName: name,
          email: email,
          birthDate: birthDate,
          createdAt: new Date().toISOString()
        });
        
        // Initialize empty collections structure could happen here, or lazily in App.tsx
      }
    } catch (err: any) {
      console.error(err);
      let msg = "Ocorreu um erro. Tente novamente.";
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        msg = "E-mail ou senha incorretos.";
      } else if (err.code === 'auth/email-already-in-use') {
        msg = "Este e-mail já está em uso.";
      } else if (err.code === 'auth/weak-password') {
        msg = "A senha é muito fraca.";
      } else if (err.message) {
         msg = err.message;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#EFF1F1] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-b from-[#0C2BD8] to-[#051367] p-8 text-center relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-3xl opacity-10 -mr-10 -mt-10"></div>
           <div className="relative z-10 flex flex-col items-center">
              <div className="bg-white p-3 rounded-xl mb-4 shadow-lg shadow-blue-900/20">
                 <Wallet className="w-8 h-8 text-[#0C2BD8]" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-1">LHB Finanças</h1>
              <p className="text-blue-200 text-sm">Controle Financeiro Pessoal</p>
           </div>
        </div>

        {/* Form */}
        <div className="p-8">
           <div className="flex gap-4 mb-8 bg-slate-100 p-1 rounded-xl">
              <button 
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${isLogin ? 'bg-white text-[#0C2BD8] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Entrar
              </button>
              <button 
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${!isLogin ? 'bg-white text-[#0C2BD8] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Cadastrar
              </button>
           </div>

           {error && (
             <div className="mb-6 bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
             </div>
           )}

           <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome Completo</label>
                    <div className="relative">
                       <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                       <input 
                         type="text" 
                         value={name}
                         onChange={e => setName(e.target.value)}
                         className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-[#0C2BD8]"
                         placeholder="Seu nome"
                         required
                       />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data de Nascimento</label>
                    <div className="relative">
                       <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                       <input 
                         type="date" 
                         value={birthDate}
                         onChange={e => setBirthDate(e.target.value)}
                         className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-[#0C2BD8]"
                         required
                       />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">E-mail</label>
                <div className="relative">
                   <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                   <input 
                     type="email" 
                     value={email}
                     onChange={e => setEmail(e.target.value)}
                     className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-[#0C2BD8]"
                     placeholder="seu@email.com"
                     required
                   />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Senha</label>
                <div className="relative">
                   <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                   <input 
                     type="password" 
                     value={password}
                     onChange={e => setPassword(e.target.value)}
                     className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-[#0C2BD8]"
                     placeholder="******"
                     required
                   />
                </div>
              </div>

              {!isLogin && (
                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Confirmar Senha</label>
                   <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="password" 
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-[#0C2BD8]"
                        placeholder="******"
                        required
                      />
                   </div>
                </div>
              )}

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-[#0C2BD8] hover:bg-[#0C2BD8]/90 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2 mt-4"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    {isLogin ? 'Entrar' : 'Criar Conta'} <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
           </form>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
