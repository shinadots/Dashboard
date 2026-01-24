"use client";
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// Define a estrutura dos dados para o TypeScript parar de reclamar
interface MetaData {
  campanha: string;
  gasto: number;
  leads: number;
}

export default function Dashboard() {
  const [data, setData] = useState<MetaData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const { data: metaData, error } = await supabase
        .from('meta_ads')
        .select('*');
      
      if (error) {
        console.error("Erro ao buscar dados:", error);
      } else if (metaData) {
        setData(metaData as MetaData[]);
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  // Cálculos automáticos com base nos dados do Supabase
  const totalGasto = data.reduce((acc, curr) => acc + (Number(curr.gasto) || 0), 0);
  const totalLeads = data.reduce((acc, curr) => acc + (Number(curr.leads) || 0), 0);
  const cpl = totalLeads > 0 ? totalGasto / totalLeads : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <p className="text-blue-400 animate-pulse font-mono">Carregando dados do Supabase...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#020617] text-slate-200 p-6 md:p-12 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Cabeçalho Profissional */}
        <header className="mb-12 border-b border-slate-800 pb-8 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tight uppercase">Performance Meta Ads</h1>
            <p className="text-slate-500 mt-2 font-medium italic">Gestão de Tráfego em Tempo Real</p>
          </div>
          <div className="text-right hidden md:block">
            <span className="bg-emerald-500/10 text-emerald-500 text-xs px-3 py-1 rounded-full border border-emerald-500/20 font-bold">
              CONECTADO AO SUPABASE
            </span>
          </div>
        </header>
        
        {/* Cards de Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-slate-900/50 backdrop-blur-md p-8 rounded-3xl border border-slate-800 shadow-2xl hover:border-blue-500/50 transition-all">
            <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mb-3">Investimento Total</p>
            <p className="text-4xl font-bold text-white">
              R$ {totalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          
          <div className="bg-slate-900/50 backdrop-blur-md p-8 rounded-3xl border border-slate-800 shadow-2xl hover:border-purple-500/50 transition-all">
            <p className="text-purple-400 text-xs font-bold uppercase tracking-widest mb-3">Conversões (Leads)</p>
            <p className="text-4xl font-bold text-white">
              {totalLeads.toLocaleString('pt-BR')} <span className="text-lg font-normal text-slate-500 font-mono">un</span>
            </p>
          </div>
          
          <div className="bg-slate-900/50 backdrop-blur-md p-8 rounded-3xl border border-slate-800 shadow-2xl hover:border-emerald-500/50 transition-all">
            <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-3">Custo Médio p/ Lead</p>
            <p className="text-4xl font-bold text-white">
              R$ {cpl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Tabela de Campanhas Detalhada */}
        <div className="bg-slate-900/30 rounded-3xl border border-slate-800 overflow-hidden shadow-inner">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-800/50 text-slate-400 text-xs uppercase tracking-tighter">
                <tr>
                  <th className="p-5 font-bold">Campanha Ativa</th>
                  <th className="p-5 font-bold text-center">Investido</th>
                  <th className="p-5 font-bold text-center">Leads</th>
                  <th className="p-5 font-bold text-center">CPL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {data.map((item, idx) => {
                  const itemCpl = item.leads > 0 ? item.gasto / item.leads : 0;
                  return (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors group">
                      <td className="p-5 font-semibold text-white group-hover:text-blue-400 transition-colors">
                        {item.campanha}
                      </td>
                      <td className="p-5 text-slate-400 text-center font-mono">
                        R$ {Number(item.gasto).toFixed(2)}
                      </td>
                      <td className="p-5 text-slate-400 text-center font-mono">
                        {item.leads}
                      </td>
                      <td className="p-5 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${itemCpl > 30 ? 'text-red-400 bg-red-400/10' : 'text-emerald-400 bg-emerald-400/10'}`}>
                          R$ {itemCpl.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}