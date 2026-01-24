"use client";
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface MetaData {
  campanha: string;
  gasto: number;
  leads: number;
  data_inicio: string; 
  data_fim: string;
  CLIENTE: string; // Ajustado para maiúsculo conforme seu banco
}

export default function Dashboard() {
  const [data, setData] = useState<MetaData[]>([]);
  const [clienteAtivo, setClienteAtivo] = useState<string>('Todos');
  
  // Estados de Data
  const [periodoAtivo, setPeriodoAtivo] = useState<string>('30'); // Padrão 30 dias
  const [dataInicioManual, setDataInicioManual] = useState<string>('');
  const [dataFimManual, setDataFimManual] = useState<string>('');

  useEffect(() => {
    async function fetchData() {
      const { data: metaData } = await supabase.from('meta_ads').select('*');
      if (metaData) setData(metaData as MetaData[]);
    }
    fetchData();
  }, []);

  // Lógica de Filtragem
  const dadosFiltrados = data.filter(item => {
    const dataItem = new Date(item.data_inicio + "T00:00:00");
    const hoje = new Date();
    hoje.setHours(23, 59, 59, 999);

    // 1. Filtro de Cliente (Corrigido para CLIENTE maiúsculo)
    const matchesCliente = clienteAtivo === 'Todos' || item.CLIENTE === clienteAtivo;

    // 2. Filtro de Data
    let matchesData = true;
    if (periodoAtivo === 'custom') {
      const inicio = dataInicioManual ? new Date(dataInicioManual + "T00:00:00") : null;
      const fim = dataFimManual ? new Date(dataFimManual + "T23:59:59") : null;
      if (inicio) matchesData = matchesData && dataItem >= inicio;
      if (fim) matchesData = matchesData && dataItem <= fim;
    } else {
      const dias = parseInt(periodoAtivo);
      const dataLimite = new Date();
      dataLimite.setDate(hoje.getDate() - dias);
      dataLimite.setHours(0, 0, 0, 0);
      matchesData = dataItem >= dataLimite;
    }

    return matchesCliente && matchesData;
  });

  // Agrupamento para o Gráfico
  const dadosGrafico = Object.values(dadosFiltrados.reduce((acc: any, item) => {
    const dia = item.data_inicio;
    if (!acc[dia]) acc[dia] = { dia, gasto: 0 };
    acc[dia].gasto += Number(item.gasto);
    return acc;
  }, {})).sort((a: any, b: any) => new Date(a.dia).getTime() - new Date(b.dia).getTime());

  const clientes = ['Todos', ...Array.from(new Set(data.map(item => item.CLIENTE).filter(Boolean)))];
  const totalGasto = dadosFiltrados.reduce((acc, curr) => acc + (Number(curr.gasto) || 0), 0);
  const totalLeads = dadosFiltrados.reduce((acc, curr) => acc + (Number(curr.leads) || 0), 0);

  return (
    <main className="min-h-screen bg-[#020617] text-slate-200 p-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col gap-6 mb-10 border-b border-slate-800 pb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white uppercase tracking-tighter">Performance Ads</h1>
            <select 
              className="bg-slate-900 border border-slate-700 p-2 rounded-xl text-sm outline-none"
              value={clienteAtivo}
              onChange={(e) => setClienteAtivo(e.target.value)}
            >
              {clientes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* BOTÕES DE PERÍODO RÁPIDO */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
              {[
                { label: '1D', val: '1' },
                { label: '7D', val: '7' },
                { label: '14D', val: '14' },
                { label: '30D', val: '30' }
              ].map((p) => (
                <button
                  key={p.val}
                  onClick={() => setPeriodoAtivo(p.val)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${periodoAtivo === p.val ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  {p.label}
                </button>
              ))}
              <button
                onClick={() => setPeriodoAtivo('custom')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${periodoAtivo === 'custom' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                PERSONALIZADO
              </button>
            </div>

            {periodoAtivo === 'custom' && (
              <div className="flex items-center gap-2 animate-in fade-in">
                <input 
                  type="date" 
                  className="bg-slate-900 border border-slate-800 p-1.5 rounded-lg text-xs outline-none focus:border-blue-500 text-white"
                  onChange={(e) => setDataInicioManual(e.target.value)}
                />
                <span className="text-slate-600 text-[10px] font-black">ATÉ</span>
                <input 
                  type="date" 
                  className="bg-slate-900 border border-slate-800 p-1.5 rounded-lg text-xs outline-none focus:border-blue-500 text-white"
                  onChange={(e) => setDataFimManual(e.target.value)}
                />
              </div>
            )}
          </div>
        </header>

        {/* CARDS E GRÁFICO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="bg-slate-900/80 p-8 rounded-3xl border border-slate-800 shadow-2xl">
            <p className="text-blue-400 text-xs font-bold uppercase mb-2 text-center md:text-left">Investimento no Período</p>
            <p className="text-4xl font-bold text-white text-center md:text-left">R$ {totalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-slate-900/80 p-8 rounded-3xl border border-slate-800 shadow-2xl">
            <p className="text-emerald-400 text-xs font-bold uppercase mb-2 text-center md:text-left">Leads no Período</p>
            <p className="text-4xl font-bold text-white text-center md:text-left">{totalLeads}</p>
          </div>
        </div>

        <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 h-[350px]">
          <h2 className="text-xs font-bold mb-8 uppercase text-slate-500">Gasto Diário (R$)</h2>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dadosGrafico}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis 
                dataKey="dia" 
                stroke="#64748b" 
                fontSize={10} 
                tickFormatter={(value) => new Date(value + "T00:00:00").toLocaleDateString('pt-BR', {day: '2-digit', month: '2-digit'})}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                labelStyle={{ color: '#fff' }}
              />
              <Bar dataKey="gasto" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </main>
  );
}