import React, { useState } from 'react';
import { User, Mail, Shield, Smartphone, MapPin, Edit2, Check, X, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { updateEmail, updatePassword } from 'firebase/auth';

const UserProfileView: React.FC = () => {
  const { user, userData } = useAuth();
  
  // Edit States
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isEditingPass, setIsEditingPass] = useState(false);
  
  const [newEmail, setNewEmail] = useState('');
  const [newPass, setNewPass] = useState('');
  const [msg, setMsg] = useState({ type: '', text: '' });

  if (!user) return null;

  const handleUpdateEmail = async () => {
    try {
      if (newEmail && newEmail !== user.email) {
        await updateEmail(user, newEmail);
        setMsg({ type: 'success', text: 'E-mail atualizado com sucesso!' });
        setIsEditingEmail(false);
      }
    } catch (e: any) {
      setMsg({ type: 'error', text: 'Erro ao atualizar e-mail. Talvez seja necessário fazer login novamente.' });
    }
  };

  const handleUpdatePass = async () => {
    try {
      if (newPass.length >= 6) {
        await updatePassword(user, newPass);
        setMsg({ type: 'success', text: 'Senha atualizada com sucesso!' });
        setIsEditingPass(false);
      } else {
        setMsg({ type: 'error', text: 'A senha deve ter no mínimo 6 caracteres.' });
      }
    } catch (e: any) {
      setMsg({ type: 'error', text: 'Erro ao atualizar senha. Talvez seja necessário fazer login novamente.' });
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="bg-[#FBFBFB] border border-slate-200 rounded-2xl p-8 shadow-sm text-center">
        <div className="w-24 h-24 bg-slate-200 rounded-full mx-auto mb-4 flex items-center justify-center border-4 border-white shadow-lg text-4xl font-bold text-slate-400">
           {user.displayName ? user.displayName.charAt(0).toUpperCase() : <User className="w-10 h-10" />}
        </div>
        <h2 className="text-2xl font-bold text-slate-800">{userData?.displayName || user.displayName || 'Usuário'}</h2>
        <p className="text-slate-500 text-sm">{user.email}</p>
        <span className="inline-block mt-3 px-3 py-1 bg-[#AFDE22]/20 text-[#AFDE22] rounded-full text-xs font-bold border border-[#AFDE22]/30">
           Conta Online
        </span>
      </div>

      {msg.text && (
        <div className={`p-4 rounded-xl text-sm font-medium ${msg.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
          {msg.text}
        </div>
      )}

      <div className="bg-[#FBFBFB] border border-slate-200 rounded-2xl p-6 shadow-sm">
         <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#0C2BD8]" />
            Informações Pessoais
         </h3>
         
         <div className="space-y-4">
            {/* Nome */}
            <div className="flex items-center gap-4 p-3 bg-white border border-slate-100 rounded-xl">
               <div className="p-2 bg-slate-50 rounded-lg">
                  <User className="w-5 h-5 text-slate-400" />
               </div>
               <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase">Nome Completo</p>
                  <p className="text-slate-700 font-medium">{userData?.displayName || user.displayName}</p>
               </div>
            </div>
            
            {/* Data de Nascimento */}
            <div className="flex items-center gap-4 p-3 bg-white border border-slate-100 rounded-xl">
               <div className="p-2 bg-slate-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-slate-400" />
               </div>
               <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase">Data de Nascimento</p>
                  <p className="text-slate-700 font-medium">{userData?.birthDate ? new Date(userData.birthDate).toLocaleDateString('pt-BR') : 'Não informado'}</p>
               </div>
            </div>

            {/* Email */}
            <div className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl">
               <div className="flex items-center gap-4">
                 <div className="p-2 bg-slate-50 rounded-lg">
                    <Mail className="w-5 h-5 text-slate-400" />
                 </div>
                 <div className="flex-1">
                    <p className="text-xs text-slate-400 font-semibold uppercase">E-mail</p>
                    {isEditingEmail ? (
                      <input 
                        type="email" 
                        value={newEmail} 
                        onChange={(e) => setNewEmail(e.target.value)} 
                        className="border border-slate-300 rounded px-2 py-1 text-sm mt-1 focus:outline-none focus:border-blue-500 w-full"
                        placeholder="Novo e-mail"
                      />
                    ) : (
                      <p className="text-slate-700 font-medium">{user.email}</p>
                    )}
                 </div>
               </div>
               
               <div>
                  {isEditingEmail ? (
                     <div className="flex gap-2">
                        <button onClick={handleUpdateEmail} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100"><Check className="w-4 h-4" /></button>
                        <button onClick={() => setIsEditingEmail(false)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><X className="w-4 h-4" /></button>
                     </div>
                  ) : (
                     <button onClick={() => { setIsEditingEmail(true); setNewEmail(user.email || ''); }} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-blue-600">
                        <Edit2 className="w-4 h-4" />
                     </button>
                  )}
               </div>
            </div>

            {/* Senha */}
            <div className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl">
               <div className="flex items-center gap-4">
                 <div className="p-2 bg-slate-50 rounded-lg">
                    <Shield className="w-5 h-5 text-slate-400" />
                 </div>
                 <div className="flex-1">
                    <p className="text-xs text-slate-400 font-semibold uppercase">Senha</p>
                    {isEditingPass ? (
                      <input 
                        type="password" 
                        value={newPass} 
                        onChange={(e) => setNewPass(e.target.value)} 
                        className="border border-slate-300 rounded px-2 py-1 text-sm mt-1 focus:outline-none focus:border-blue-500 w-full"
                        placeholder="Nova senha (min 6 chars)"
                      />
                    ) : (
                      <p className="text-slate-700 font-medium">**********</p>
                    )}
                 </div>
               </div>
               
               <div>
                  {isEditingPass ? (
                     <div className="flex gap-2">
                        <button onClick={handleUpdatePass} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100"><Check className="w-4 h-4" /></button>
                        <button onClick={() => setIsEditingPass(false)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><X className="w-4 h-4" /></button>
                     </div>
                  ) : (
                     <button onClick={() => { setIsEditingPass(true); setNewPass(''); }} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-blue-600">
                        <Edit2 className="w-4 h-4" />
                     </button>
                  )}
               </div>
            </div>

         </div>
      </div>
    </div>
  );
};

export default UserProfileView;