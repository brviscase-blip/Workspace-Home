
import { Lock, User, ShieldCheck, AlertCircle, ArrowRight, Terminal } from 'lucide-react';
import { supabase } from '../lib/supabase';
import React, { useState } from 'react';

interface LoginProps {
  onLogin: (username: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [debugMsg, setDebugMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setError(false);
    setDebugMsg('Iniciando handshake com servidor...');

    try {
      const { data, error: dbError } = await supabase
        .from('profiles')
        .select('display_name, password')
        .eq('username', username)
        .single();

      if (dbError) {
        console.error('Erro de Autenticação:', dbError);
        setDebugMsg(`Erro SQL: ${dbError.message} (Código: ${dbError.code})`);
        setError(true);
      } else if (!data) {
        setDebugMsg('Usuário não localizado no diretório.');
        setError(true);
      } else if (data.password === password) {
        setDebugMsg('Chave validada. Carregando interface...');
        onLogin(data.display_name);
      } else {
        setDebugMsg('Falha na autenticação da chave.');
        setError(true);
      }
    } catch (err) {
      console.error('Erro Fatal:', err);
      setDebugMsg('Erro crítico de conexão com o terminal.');
      setError(true);
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[#020617] flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/5 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-md relative">
        <div className="flex flex-col items-center mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="w-16 h-16 bg-black border border-slate-800 rounded-sm flex items-center justify-center mb-6 shadow-2xl shadow-blue-500/10">
            <ShieldCheck className="text-blue-500" size={32} />
          </div>
          <h1 className="text-xl font-black uppercase tracking-[0.4em] text-white">Artifacts</h1>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-2">Cofre Vibrante v3 • Autenticação SQL</p>
        </div>

        <div className="bg-[#030712] border border-slate-800 p-8 rounded-sm shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-500">
          {isAuthenticating && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4">
               <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
               <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Validando Token...</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Usuário / Login</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={16} />
                <input 
                  autoFocus
                  required
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Seu ID de acesso"
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-sm py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all placeholder:text-slate-700"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-1">Chave de Segurança</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-500 transition-colors" size={16} />
                <input 
                  required
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-sm py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all placeholder:text-slate-700"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-sm animate-in slide-in-from-left-2 duration-300">
                <AlertCircle className="text-rose-500 flex-shrink-0" size={16} />
                <p className="text-[10px] font-black uppercase tracking-widest text-rose-400">Falha na Conexão</p>
              </div>
            )}

            <button 
              type="submit"
              disabled={isAuthenticating}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-black uppercase tracking-[0.3em] rounded-sm transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-3 group"
            >
              {isAuthenticating ? 'Processando...' : 'Acessar Workspace'}
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
        </div>

        <div className="mt-8 flex flex-col items-center gap-4">
           <div className="flex items-center gap-4 opacity-30">
              <div className="h-px w-12 bg-slate-800" />
              <Terminal size={12} className="text-slate-500" />
              <div className="h-px w-12 bg-slate-800" />
           </div>
           {debugMsg && (
             <span className="text-[8px] font-mono uppercase tracking-[0.2em] text-slate-600 animate-pulse text-center">
               System Log: {debugMsg}
             </span>
           )}
        </div>
      </div>
    </div>
  );
};

export default Login;