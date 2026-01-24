"use client";
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Dashboard() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      const { data: metaData } = await supabase.from('meta_ads').select('*');
      if (metaData) setData(metaData);
    }
    fetchData();
  }, []);

  const totalGasto = data.reduce((acc, curr) => acc + (Number(curr.gasto) || 0), 0);
  const totalLeads = data.reduce((acc, curr) => acc + (Number(curr.leads) || 0), 0);
  const cpl = totalLeads > 0 ? totalGasto / totalLeads : 0;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-200 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-white border-b border-slate-800 pb-4">
          Performance Meta Ads
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
            <p className="text-slate-400 text-xs uppercase font-semibold mb-1">Investimento Total</p>
            <p className="text-3xl font-bold text-blue-400">
              R$ {totalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
            <p className="text-slate-400 text-xs uppercase font-semibold mb-1">Total Leads</p>
            <p className="text-3xl font-bold text-purple-400">{totalLeads}</p>
          </div>
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
            <p className="text-slate-400 text-xs uppercase font-semibold mb-1">CPL Médio</p>
            <p className="text-3xl font-bold text-emerald-400">
              R$ {cpl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-800/50 text-slate-400 text-sm">
              <tr>
                <th className="p-4 font-medium">Campanha</th>
                <th className="p-4 font-medium">Gasto</th>
                <th className="p-4 font-medium">Leads</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {data.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-4 font-medium text-white">{item.campanha}</td>
                  <td className="p-4 text-slate-300">R$ {Number(item.gasto).toFixed(2)}</td>
                  <td className="p-4 text-slate-300">{item.leads}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}