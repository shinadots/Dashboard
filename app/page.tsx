"use client";
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface MetaData {
  campanha: string;
  gasto: number;
  leads: number;
  data_inicio: string; // Conforme sua imagem do Supabase
  CLIENTE: string;     // Conforme sua imagem do Supabase
}

export default function Dashboard() {
  const [data, setData] = useState<MetaData[]>([]);
  const [clienteAtivo, setClienteAtivo] = useState<string>('Todos');
  const [dataFiltro, setDataFiltro] = useState<string>(''); // Filtro de dia específico

  useEffect(() => {
    async function fetchData() {
      const { data: metaData } = await supabase.from('meta_ads').select('*');
      if (metaData) setData(metaData as MetaData[]);
    }
    fetchData();
  }, []);

  // 1. Lógica de Filtro por Cliente (Corrigido para CLIENTE maiúsculo)
  const clientes = ['Todos', ...Array.from(new Set(data.map(item => item.CLIENTE).filter(Boolean)))];
  
  const dadosFiltrados = data.filter(item => {
    const matchesCliente = clienteAtivo === 'Todos' || item.CLIENTE === clienteAtivo;
    const matchesData = !dataFiltro || item.data_inicio === dataFiltro;
    return matchesCliente && matchesData;
  });

  // 2. Agrupamento para o Gráfico Diário
  const dadosGrafico = Object.values(dadosFiltrados.reduce((acc: any, item) => {
    const dia = item.data_inicio;
    if (!acc[dia]) acc[dia] = { dia, gasto: 0 };
    acc[dia].gasto += Number(item.gasto);
    return acc;
  }, {})).sort((a: any, b: any) => new Date(a.dia).getTime() - new Date(b.dia).getTime());

  const totalGasto = dadosFiltrados.reduce((acc, curr) => acc + (Number(curr.gasto) || 0), 0);
  const totalLeads = dadosFiltrados.reduce((acc, curr) => acc + (Number(curr.leads) || 0), 0);

  return (
    <main className="min-h-screen bg-[#020617] text-slate-200 p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-wrap gap-4 justify-between items-center mb-10 border-b border-slate-800 pb-8">
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Performance Ads</h1>
          
          <div className="flex gap-3">
            {/* FILTRO DE DATA */}
            <input 
              type="date"
              className="bg-slate-900 border border-slate-700 p-2 rounded-xl text-sm outline-none focus:border-blue-500"
              onChange={(e) => setDataFiltro(e.target.value)}
            />
            {/* SELETOR DE CLIENTE */}
            <select 
              className="bg-slate-900 border border-slate-700 p-2 rounded-xl text-sm outline-none focus:border-blue-500 min-w-[150px]"
              onChange={(e) => setClienteAtivo(e.target.value)}
            >
              {clientes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="bg-slate-900/80 p-8 rounded-3xl border border-slate-800 shadow-2xl">
            <p className="text-blue-400 text-xs font-bold uppercase mb-2">Investimento Total</p>
            <p className="text-4xl font-bold text-white font-mono">R$ {totalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-slate-900/80 p-8 rounded-3xl border border-slate-800 shadow-2xl">
            <p className="text-emerald-400 text-xs font-bold uppercase mb-2">Total de Leads</p>
            <p className="text-4xl font-bold text-white font-mono">{totalLeads}</p>
          </div>
        </div>

        {/* GRÁFICO DIÁRIO */}
        <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 mb-10 h-[350px]">
          <h2 className="text-sm font-bold mb-8 uppercase text-slate-500">Evolução de Gastos por Dia</h2>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dadosGrafico}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis 
                dataKey="dia" 
                stroke="#64748b" 
                fontSize={10} 
                tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'})}
              />
              <YAxis stroke="#64748b" fontSize={10} tickFormatter={(value) => `R$${value}`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                labelStyle={{ color: '#fff', marginBottom: '4px' }}
              />
              <Bar dataKey="gasto" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </main>
  );
}