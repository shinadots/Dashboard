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
    <main className="min-h-screen bg-gray-900 text-white p-10">
      <h1 className="text-3xl font-bold mb-10 text-blue-400">Performance Meta Ads</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
          <p className="text-gray-400 text-sm">Investimento Total</p>
          <p className="text-2xl font-bold text-green-400 font-mono">R$ {totalGasto.toFixed(2)}</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
          <p className="text-gray-400 text-sm">Total Leads</p>
          <p className="text-2xl font-bold text-purple-400 font-mono">{totalLeads}</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
          <p className="text-gray-400 text-sm">CPL Médio</p>
          <p className="text-2xl font-bold text-yellow-400 font-mono">R$ {cpl.toFixed(2)}</p>
        </div>
      </div>
    </main>
  );
}