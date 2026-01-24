"use client";
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface MetaData {
  campanha: string;
  gasto: number;
  leads: number;
  data: string;
  cliente: string; // Nova coluna para separação
}

export default function Dashboard() {
  const [data, setData] = useState<MetaData[]>([]);
  const [clienteAtivo, setClienteAtivo] = useState<string>('Todos');

  useEffect(() => {
    async function fetchData() {
      const { data: metaData } = await supabase.from('meta_ads').select('*');
      if (metaData) setData(metaData as MetaData[]);
    }
    fetchData();
  }, []);

  // 1. Lógica de Filtro por Cliente
  const clientes = ['Todos', ...Array.from(new Set(data.map(item => item.cliente).filter(Boolean)))];
  const dadosFiltrados = clienteAtivo === 'Todos' ? data : data.filter(item => item.cliente === clienteAtivo);

  // 2. Lógica do Gráfico (Agrupar gasto por dia)
  const dadosGrafico = Object.values(dadosFiltrados.reduce((acc: any, item) => {
    const dataFormatada = new Date(item.data).toLocaleDateString('pt-BR');
    if (!acc[dataFormatada]) acc[dataFormatada] = { data: dataFormatada, gasto: 0 };
    acc[dataFormatada].gasto += Number(item.gasto);
    return acc;
  }, {}));

  const totalGasto = dadosFiltrados.reduce((acc, curr) => acc + (Number(curr.gasto) || 0), 0);
  const totalLeads = dadosFiltrados.reduce((acc, curr) => acc + (Number(curr.leads) || 0), 0);

  return (
    <main className="min-h-screen bg-[#020617] text-slate-200 p-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-10 border-b border-slate-800 pb-6">
          <h1 className="text-2xl font-bold text-white uppercase tracking-tighter">Performance Ads</h1>
          
          {/* SELETOR DE CLIENTE */}
          <select 
            className="bg-slate-900 border border-slate-700 p-2 rounded-lg text-sm outline-none focus:border-blue-500"
            onChange={(e) => setClienteAtivo(e.target.value)}
          >
            {clientes.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </header>

        {/* CARDS PRINCIPAIS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
            <p className="text-slate-500 text-xs font-bold uppercase mb-2">Investimento Total</p>
            <p className="text-3xl font-bold text-white">R$ {totalGasto.toLocaleString('pt-BR')}</p>
          </div>
          <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
            <p className="text-slate-500 text-xs font-bold uppercase mb-2">Leads Gerados</p>
            <p className="text-3xl font-bold text-white">{totalLeads}</p>
          </div>
        </div>

        {/* GRÁFICO DIÁRIO */}
        <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 mb-10 h-[300px]">
          <h2 className="text-sm font-bold mb-6 uppercase text-blue-400">Gasto Diário (R$)</h2>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dadosGrafico}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="data" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                itemStyle={{ color: '#60a5fa' }}
              />
              <Bar dataKey="gasto" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* TABELA DETALHADA */}
        <div className="bg-slate-900/50 rounded-2xl border border-slate-800 overflow-hidden text-sm">
          <table className="w-full text-left">
            <thead className="bg-slate-800/50 text-slate-500 uppercase">
              <tr>
                <th className="p-4 font-bold">Campanha</th>
                <th className="p-4 font-bold text-right">Investido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {dadosFiltrados.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                  <td className="p-4 text-white font-medium">{item.campanha}</td>
                  <td className="p-4 text-right text-slate-400 font-mono">R$ {Number(item.gasto).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}