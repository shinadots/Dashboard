"use client";
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface MetaData {
  campanha: string;
  gasto: number;
  leads: number;
  data_inicio: string;
  CLIENTE: string;
  squad: string;
}

export default function Dashboard() {
  const [data, setData] = useState<MetaData[]>([]);
  const [clienteAtivo, setClienteAtivo] = useState('Todos');
  const [squadAtiva, setSquadAtiva] = useState('Todos');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [periodoRapido, setPeriodoRapido] = useState('7');

  useEffect(() => {
    async function fetchData() {
      const { data: metaData } = await supabase.from('meta_ads').select('*');
      if (metaData) setData(metaData as MetaData[]);
    }
    fetchData();
  }, []);

  const dadosFiltrados = data.filter(item => {
    const dataItem = new Date(item.data_inicio + "T00:00:00");
    let atendeData = false;
    
    if (dataInicio || dataFim) {
      const inicio = dataInicio ? new Date(dataInicio + "T00:00:00") : null;
      const fim = dataFim ? new Date(dataFim + "T23:59:59") : null;
      atendeData = (!inicio || dataItem >= inicio) && (!fim || dataItem <= fim);
    } else {
      const limite = new Date();
      // Ajuste para 1D: garante que pegue dados de hoje
      const diasatras = periodoRapido === '1' ? 0 : parseInt(periodoRapido);
      limite.setDate(limite.getDate() - diasatras);
      limite.setHours(0, 0, 0, 0);
      atendeData = dataItem >= limite;
    }

    const matchesCliente = clienteAtivo === 'Todos' || item.CLIENTE === clienteAtivo;
    const matchesSquad = squadAtiva === 'Todos' || item.squad === squadAtiva;

    return atendeData && matchesCliente && matchesSquad;
  });

  const totalGasto = dadosFiltrados.reduce((acc, curr) => acc + (Number(curr.gasto) || 0), 0);
  const totalLeads = dadosFiltrados.reduce((acc, curr) => acc + (Number(curr.leads) || 0), 0);

  const dadosAgrupados = Object.values(dadosFiltrados.reduce((acc: any, item) => {
    const dia = item.data_inicio;
    if (!acc[dia]) acc[dia] = { dia, gasto: 0 };
    acc[dia].gasto += Number(item.gasto);
    return acc;
  }, {})).sort((a: any, b: any) => new Date(a.dia).getTime() - new Date(b.dia).getTime());

  return (
    <main className="min-h-screen p-6 md:p-12 bg-[#0a051a] text-purple-50 relative overflow-hidden font-sans">
      <img src="/logo-empresa.png" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] opacity-[0.03] pointer-events-none z-0" alt="background" />

      <div className="max-w-6xl mx-auto relative z-10">
        <header className="flex flex-col gap-8 mb-12 border-b border-purple-900/40 pb-10">
          <div className="flex justify-between items-center w-full">
            <img src="/logo-empresa.png" alt="Logo" className="h-10 w-auto" />
            
            <div className="flex gap-4">
              {/* SELECTS: PRETO E NEGRITO */}
              <select 
                className="bg-white text-black font-bold p-2 rounded-lg text-xs uppercase outline-none cursor-pointer"
                onChange={(e) => setClienteAtivo(e.target.value)}
              >
                <option value="Todos">Clientes</option>
                {[...new Set(data.map(i => i.CLIENTE))].filter(Boolean).sort().map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              
              <select 
                className="bg-white text-black font-bold p-2 rounded-lg text-xs uppercase outline-none cursor-pointer"
                onChange={(e) => setSquadAtiva(e.target.value)}
              >
                <option value="Todos">Squads</option>
                {[...new Set(data.map(i => i.squad))].filter(Boolean).sort().map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <div className="flex bg-purple-900/30 p-1 rounded-xl border border-purple-700/50">
              {['1', '7', '14'].map((d) => (
                <button
                  key={d}
                  onClick={() => { setPeriodoRapido(d); setDataInicio(''); setDataFim(''); }}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${periodoRapido === d && !dataInicio ? 'bg-purple-600 text-white' : 'text-purple-400 hover:text-purple-200'}`}
                >
                  {d === '1' ? 'Hoje' : `${d}D`}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4 bg-purple-900/20 px-4 py-2 rounded-xl border border-purple-700/30">
              <div className="flex flex-col">
                <span className="text-[8px] uppercase font-black text-purple-500 mb-1">Início</span>
                <input type="date" value={dataInicio} className="bg-transparent text-white text-xs font-bold outline-none" onChange={(e) => { setDataInicio(e.target.value); setPeriodoRapido(''); }} />
              </div>
              <div className="flex flex-col ml-4">
                <span className="text-[8px] uppercase font-black text-purple-500 mb-1">Fim</span>
                <input type="date" value={dataFim} className="bg-transparent text-white text-xs font-bold outline-none" onChange={(e) => { setDataFim(e.target.value); setPeriodoRapido(''); }} />
              </div>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-purple-900/10 backdrop-blur-xl p-8 rounded-[2rem] border border-purple-500/20">
            <p className="text-purple-400 text-[10px] font-black uppercase mb-3 tracking-widest">Investimento Filtrado</p>
            <p className="text-5xl font-bold italic text-white">R$ {totalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-purple-900/10 backdrop-blur-xl p-8 rounded-[2rem] border border-purple-500/20">
            <p className="text-purple-400 text-[10px] font-black uppercase mb-3 tracking-widest">Leads Gerados</p>
            <p className="text-5xl font-bold italic text-white">{totalLeads}</p>
          </div>
        </div>

        <div className="bg-purple-900/5 backdrop-blur-md p-8 rounded-[2rem] border border-purple-500/5 h-[450px]">
          <h2 className="text-[10px] font-black mb-10 uppercase tracking-[0.3em] text-purple-600 text-center">Evolução de Performance Diária</h2>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dadosAgrupados}>
              <XAxis 
                dataKey="dia" 
                stroke="#ffffff" 
                fontSize={11} 
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => v.split('-')[2] + '/' + v.split('-')[1]} 
              />
              <Tooltip contentStyle={{ backgroundColor: '#0a051a', border: '1px solid #3b0764', borderRadius: '15px' }} />
              <Bar dataKey="gasto" fill="#a855f7" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </main>
  );
}