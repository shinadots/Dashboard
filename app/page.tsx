"use client";
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const [data, setData] = useState<any[]>([]);
  const [clienteAtivo, setClienteAtivo] = useState<string>('Todos');
  const [periodoAtivo, setPeriodoAtivo] = useState<string>('30');

  useEffect(() => {
    async function fetchData() {
      const { data: metaData } = await supabase.from('meta_ads').select('*');
      if (metaData) setData(metaData);
    }
    fetchData();
  }, []);

  // Lógica de filtro (mantida)
  const dadosFiltrados = data.filter(item => {
    const dataItem = new Date(item.data_inicio + "T00:00:00");
    const matchesCliente = clienteAtivo === 'Todos' || item.CLIENTE === clienteAtivo;
    const dias = parseInt(periodoAtivo);
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - dias);
    return matchesCliente && dataItem >= dataLimite;
  });

  const totalGasto = dadosFiltrados.reduce((acc, curr) => acc + (Number(curr.gasto) || 0), 0);
  const totalLeads = dadosFiltrados.reduce((acc, curr) => acc + (Number(curr.leads) || 0), 0);

  return (
    // Fundo Roxo Escuro Profundo com Logo de Fundo Transparente
    <main className="min-h-screen bg-[#0a051a] text-purple-50 p-6 md:p-12 relative overflow-hidden">
      
      {/* Logo de Fundo (Translúcida/Marca d'água) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none">
         <img src="/logo-empresa.png" alt="BG Logo" className="w-[600px]" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* HEADER COM LOGO */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
          <div className="flex items-center gap-4">
            <img src="/logo-empresa.png" alt="Logo" className="h-10 w-auto" />
            <div className="h-8 w-[1px] bg-purple-800/50 hidden md:block"></div>
            <h1 className="text-xl font-black uppercase tracking-widest text-purple-200">Insights Ads</h1>
          </div>

          <div className="flex gap-3">
            <select 
              className="bg-purple-900/40 border border-purple-700/50 p-2 rounded-xl text-sm outline-none text-purple-100 backdrop-blur-md"
              onChange={(e) => setClienteAtivo(e.target.value)}
            >
              <option value="Todos">Todos os Clientes</option>
              {Array.from(new Set(data.map(i => i.CLIENTE))).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </header>

        {/* FILTROS DE PERÍODO (Estilo Roxo Claro) */}
        <div className="flex bg-purple-900/20 p-1 rounded-2xl border border-purple-800/30 mb-10 w-fit">
          {['7', '14', '30'].map((d) => (
            <button
              key={d}
              onClick={() => setPeriodoAtivo(d)}
              className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${periodoAtivo === d ? 'bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'text-purple-400 hover:text-purple-200'}`}
            >
              {d} DIAS
            </button>
          ))}
        </div>

        {/* CARDS ROXOS TRANSPARENTES (Glassmorphism) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-purple-900/10 backdrop-blur-xl p-8 rounded-[2rem] border border-purple-500/20 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
            <p className="text-purple-400 text-xs font-black uppercase tracking-widest mb-2">Investimento</p>
            <p className="text-5xl font-bold text-white tracking-tighter">
              <span className="text-purple-500 text-2xl mr-1">R$</span>
              {totalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          
          <div className="bg-purple-900/10 backdrop-blur-xl p-8 rounded-[2rem] border border-purple-500/20 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
            <p className="text-purple-400 text-xs font-black uppercase tracking-widest mb-2">Resultados</p>
            <p className="text-5xl font-bold text-white tracking-tighter">
              {totalLeads} <span className="text-purple-500 text-2xl ml-1 text-purple-400">Leads</span>
            </p>
          </div>
        </div>

        {/* GRÁFICO PERSONALIZADO */}
        <div className="bg-purple-900/10 backdrop-blur-xl p-8 rounded-[2rem] border border-purple-500/10 h-[400px]">
          <h2 className="text-xs font-black mb-10 uppercase tracking-widest text-purple-400">Evolução do Investimento</h2>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={Object.values(dadosFiltrados.reduce((acc: any, item) => {
                const dia = item.data_inicio;
                if (!acc[dia]) acc[dia] = { dia, gasto: 0 };
                acc[dia].gasto += Number(item.gasto);
                return acc;
              }, {})).sort((a: any, b: any) => new Date(a.dia).getTime() - new Date(b.dia).getTime())}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3b0764" vertical={false} />
              <XAxis dataKey="dia" stroke="#a855f7" fontSize={10} tickFormatter={(v) => v.split('-')[2] + '/' + v.split('-')[1]} />
              <Tooltip 
                cursor={{fill: 'rgba(168, 85, 247, 0.1)'}}
                contentStyle={{ backgroundColor: '#1e1b4b', border: '1px solid #7e22ce', borderRadius: '15px' }}
              />
              <Bar dataKey="gasto" fill="#a855f7" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </main>
  );
}