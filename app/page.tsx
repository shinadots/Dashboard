"use client";
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface MetaData {
  campanha: string;
  gasto: number;
  leads: number;
  data_inicio: string; 
  CLIENTE: string;     
}

export default function Dashboard() {
  const [data, setData] = useState<MetaData[]>([]);
  const [clienteAtivo, setClienteAtivo] = useState<string>('Todos');
  
  // Estados para o Filtro de Data
  const [periodoAtivo, setPeriodoAtivo] = useState<string>('30d');
  const [dataInicioManual, setDataInicioManual] = useState<string>('');
  const [dataFimManual, setDataFimManual] = useState<string>('');

  useEffect(() => {
    async function fetchData() {
      const { data: metaData } = await supabase.from('meta_ads').select('*');
      if (metaData) setData(metaData as MetaData[]);
    }
    fetchData();
  }, []);

  // Lógica de Filtragem Avançada
  const dadosFiltrados = data.filter(item => {
    const dataItem = new Date(item.data_inicio);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    // Filtro de Cliente (Corrigido para CLIENTE maiúsculo)
    const matchesCliente = clienteAtivo === 'Todos' || item.CLIENTE === clienteAtivo;

    // Filtro de Data (Atalhos ou Personalizado)
    let matchesData = true;

    if (periodoAtivo === 'custom') {
      const inicio = dataInicioManual ? new Date(dataInicioManual) : null;
      const fim = dataFimManual ? new Date(dataFimManual) : null;
      if (inicio) matchesData = matchesData && dataItem >= inicio;
      if (fim) matchesData = matchesData && dataItem <= fim;
    } else {
      const dias = parseInt(periodoAtivo);
      const dataLimite = new Date();
      dataLimite.setDate(hoje.getDate() - dias);
      matchesData = dataItem >= dataLimite;
    }

    return matchesCliente && matchesData;
  });

  // Agrupamento e Cards (mesma lógica anterior)
  const clientes = ['Todos', ...Array.from(new Set(data.map(item => item.CLIENTE).filter(Boolean)))];
  const totalGasto = dadosFiltrados.reduce((acc, curr) => acc + (Number(curr.gasto) || 0), 0);
  const totalLeads = dadosFiltrados.reduce((acc, curr) => acc + (Number(curr.leads) || 0), 0);

  return (
    <main className="min-h-screen bg-[#020617] text-slate-200 p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER COM FILTROS */}
        <header className="space-y-6 mb-10 border-b border-slate-800 pb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white uppercase tracking-tighter">Performance Ads</h1>
            
            {/* SELETOR DE CLIENTE */}
            <select 
              className="bg-slate-900 border border-slate-700 p-2 rounded-xl text-sm outline-none"
              onChange={(e) => setClienteAtivo(e.target.value)}
            >
              {clientes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* FILTROS DE DATA RÁPIDOS */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
              {['1d', '7d', '14d', '30d'].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriodoAtivo(p)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${periodoAtivo === p ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  {p.toUpperCase()}
                </button>
              ))}
              <button
                onClick={() => setPeriodoAtivo('custom')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${periodoAtivo === 'custom' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                PERSONALIZADO
              </button>
            </div>

            {/* INPUTS PERSONALIZADOS (Só aparecem se 'personalizado' estiver ativo) */}
            {periodoAtivo === 'custom' && (
              <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                <input 
                  type="date" 
                  className="bg-slate-900 border border-slate-800 p-1.5 rounded-lg text-xs outline-none focus:border-blue-500"
                  onChange={(e) => setDataInicioManual(e.target.value)}
                />
                <span className="text-slate-600 text-xs font-bold uppercase">até</span>
                <input 
                  type="date" 
                  className="bg-slate-900 border border-slate-800 p-1.5 rounded-lg text-xs outline-none focus:border-blue-500"
                  onChange={(e) => setDataFimManual(e.target.value)}
                />
              </div>
            )}
          </div>
        </header>

        {/* RESTANTE DO DASHBOARD (CARDS E GRÁFICO) */}
        {/* ... (mantenha o código dos cards e do gráfico Recharts aqui) ... */}
        
      </div>
    </main>
  );
}