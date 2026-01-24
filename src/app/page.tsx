"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface MetaData {
  campanha: string;
  gasto: number;
  leads: number;
}

export default function Dashboard() {
  const [data, setData] = useState<MetaData[]>([]);

  useEffect(() => {
    async function fetchData() {
      const { data: metaData } = await supabase.from('meta_ads').select('*');
      if (metaData) setData(metaData as MetaData[]);
    }
    fetchData();
  }, []);

  const totalGasto = data.reduce((acc, curr) => acc + (Number(curr.gasto) || 0), 0);
  const totalLeads = data.reduce((acc, curr) => acc + (Number(curr.leads) || 0), 0);
  const cpl = totalLeads > 0 ? totalGasto / totalLeads : 0;

  return (
    <main className="min-h-screen p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 border-b border-slate-800 pb-8">
          <h1 className="text-4xl font-black text-white uppercase tracking-tight">Performance Meta Ads</h1>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl">
            <p className="text-blue-400 text-xs font-bold uppercase mb-3">Investimento</p>
            <p className="text-4xl font-bold text-white">R$ {totalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl">
            <p className="text-purple-400 text-xs font-bold uppercase mb-3">Leads</p>
            <p className="text-4xl font-bold text-white">{totalLeads}</p>
          </div>
          <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl">
            <p className="text-emerald-400 text-xs font-bold uppercase mb-3">CPL Médio</p>
            <p className="text-4xl font-bold text-white">R$ {cpl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        <div className="bg-slate-900/50 rounded-3xl border border-slate-800 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-800/50 text-slate-400 text-xs uppercase">
              <tr>
                <th className="p-5">Campanha</th>
                <th className="p-5">Investido</th>
                <th className="p-5">Resultados</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {data.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition-all text-slate-300">
                  <td className="p-5 font-semibold text-white">{item.campanha}</td>
                  <td className="p-5 font-mono">R$ {Number(item.gasto).toFixed(2)}</td>
                  <td className="p-5 font-mono">{item.leads} leads</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}