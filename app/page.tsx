"use client";
import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface MetaData {
  gasto: any;
  leads: any;
  data_inicio: string;
  CLIENTE: string;
  Gestor: string;
  "meta cpl"?: number;
}

export default function Dashboard() {
  const [data, setData] = useState<MetaData[]>([]);
  const [gestorAtivo, setGestorAtivo] = useState('Todos');
  const [periodoRapido, setPeriodoRapido] = useState('7');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  // Evita erro de Hydration do Next.js
  useEffect(() => {
    setIsMounted(true);
    async function fetchData() {
      const { data: metaData } = await supabase.from('meta_ads').select('*');
      if (metaData) setData(metaData as MetaData[]);
    }
    fetchData();
  }, []);

  const opcoesGestores = useMemo(() => 
    [...new Set(data.map(i => i.Gestor?.trim()))].filter(Boolean).sort()
  , [data]);

  const dadosFiltrados = useMemo(() => {
    return data.filter(item => {
      const dataItem = new Date(item.data_inicio + "T00:00:00");
      let atendeData = false;
      
      if (dataInicio || dataFim) {
        const inicio = dataInicio ? new Date(dataInicio + "T00:00:00") : null;
        const fim = dataFim ? new Date(dataFim + "T23:59:59") : null;
        atendeData = (!inicio || dataItem >= inicio) && (!fim || dataItem <= fim);
      } else {
        const limite = new Date();
        const dias = periodoRapido === '1' ? 0 : parseInt(periodoRapido);
        limite.setDate(limite.getDate() - (dias === 0 ? 0 : dias - 1));
        limite.setHours(0, 0, 0, 0);
        atendeData = dataItem >= limite;
      }
      return (gestorAtivo === 'Todos' || item.Gestor?.trim() === gestorAtivo) && atendeData;
    });
  }, [data, gestorAtivo, dataInicio, dataFim, periodoRapido]);

  const rankingClientes = useMemo(() => {
    const baseClientes = gestorAtivo === 'Todos' ? data : data.filter(d => d.Gestor?.trim() === gestorAtivo);
    const nomesUnicos = [...new Set(baseClientes.map(i => i.CLIENTE?.trim()))].filter(Boolean);

    return nomesUnicos.map(nome => {
      const registros = dadosFiltrados.filter(d => d.CLIENTE?.trim() === nome);
      const metaCpl = data.find(d => d.CLIENTE?.trim() === nome)?.["meta cpl"] || 0;
      const gasto = registros.reduce((acc, curr) => acc + Number(curr.gasto || 0), 0);
      const leads = registros.reduce((acc, curr) => acc + Number(curr.leads || 0), 0);
      const cpl = leads > 0 ? gasto / leads : (gasto > 0 ? gasto : 0);
      
      return { 
        nome, gasto, leads, cpl, 
        meta: metaCpl,
        estourouMeta: metaCpl > 0 && cpl > metaCpl 
      };
    }).sort((a, b) => b.gasto - a.gasto);
  }, [data, dadosFiltrados, gestorAtivo]);

  const totalGasto = dadosFiltrados.reduce((acc, curr) => acc + Number(curr.gasto || 0), 0);
  const totalLeads = dadosFiltrados.reduce((acc, curr) => acc + Number(curr.leads || 0), 0);
  const totalSOS = rankingClientes.filter(c => c.estourouMeta).length;

  const dadosGrafico = Object.values(dadosFiltrados.reduce((acc: any, item) => {
    const dia = item.data_inicio;
    if (!acc[dia]) acc[dia] = { dia, gasto: 0 };
    acc[dia].gasto += Number(item.gasto || 0);
    return acc;
  }, {})).sort((a: any, b: any) => new Date(a.dia).getTime() - new Date(b.dia).getTime());

  if (!isMounted) return null;

  return (
    <main className="min-h-screen p-6 md:p-12 bg-[#0a051a] text-purple-50 relative overflow-hidden font-sans">
      <style>{`
        @keyframes pulse-red {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); border-color: rgba(239, 68, 68, 0.5); }
          70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); border-color: rgba(239, 68, 68, 1); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); border-color: rgba(239, 68, 68, 0.5); }
        }
        .animate-pulse-red { animation: pulse-red 2s infinite; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #4b2a85; border-radius: 10px; }
      `}</style>

      <div className="max-w-7xl mx-auto relative z-10">
        <header className="flex flex-col gap-8 mb-12 border-b border-purple-900/40 pb-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <img src="/logo-empresa.png" alt="Logo" className="h-10 w-auto" />
            <select className="appearance-none bg-purple-900/40 backdrop-blur-md text-white font-bold py-2 px-8 rounded-full border border-purple-700/50 text-[10px] uppercase outline-none cursor-pointer hover:bg-purple-800 transition-all min-w-[200px] text-left shadow-lg" value={gestorAtivo} onChange={(e) => setGestorAtivo(e.target.value)}>
              <option value="Todos">Todos os Gestores</option>
              {opcoesGestores.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <div className="flex bg-purple-900/30 p-1 rounded-full border border-purple-700/50">
              {['1', '7', '14'].map((d) => (
                <button key={d} onClick={() => { setPeriodoRapido(d); setDataInicio(''); setDataFim(''); }} className={`px-6 py-2 rounded-full text-[10px] font-black uppercase transition-all ${periodoRapido === d && !dataInicio ? 'bg-purple-600 text-white shadow-lg' : 'text-purple-400 hover:text-purple-200'}`}>
                  {d === '1' ? 'Hoje' : `${d}D`}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-4 bg-purple-900/20 px-6 py-2 rounded-full border border-purple-700/30">
               <input type="date" value={dataInicio} onChange={(e) => { setDataInicio(e.target.value); setPeriodoRapido(''); }} className="bg-transparent text-white text-[10px] font-bold outline-none uppercase cursor-pointer" />
               <div className="h-4 w-[1px] bg-purple-700/30"></div>
               <input type="date" value={dataFim} onChange={(e) => { setDataFim(e.target.value); setPeriodoRapido(''); }} className="bg-transparent text-white text-[10px] font-bold outline-none uppercase cursor-pointer" />
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-purple-900/10 backdrop-blur-xl p-6 rounded-[2rem] border border-purple-500/20 shadow-2xl text-center">
                <p className="text-purple-400 text-[9px] font-black uppercase mb-2 tracking-widest">Investimento</p>
                <p className="text-3xl font-bold italic text-white leading-tight">R$ {totalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="bg-purple-900/10 backdrop-blur-xl p-6 rounded-[2rem] border border-purple-500/20 shadow-2xl text-center">
                <p className="text-purple-400 text-[9px] font-black uppercase mb-2 tracking-widest">Leads Gerados</p>
                <p className="text-4xl font-bold italic text-white leading-tight">{totalLeads}</p>
              </div>
              <div className={`p-6 rounded-[2rem] border backdrop-blur-xl shadow-2xl text-center transition-all ${totalSOS > 0 ? 'bg-red-900/20 border-red-500/40 animate-pulse-red' : 'bg-purple-900/10 border-purple-500/20'}`}>
                <p className={`${totalSOS > 0 ? 'text-red-400' : 'text-purple-400'} text-[9px] font-black uppercase mb-2 tracking-widest`}>S.O.S (CPL Alto)</p>
                <p className={`text-4xl font-bold italic leading-tight ${totalSOS > 0 ? 'text-red-500' : 'text-white'}`}>{totalSOS}</p>
              </div>
            </div>

            <div className="bg-purple-900/5 backdrop-blur-md p-8 rounded-[3rem] border border-purple-500/10 h-[450px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosGrafico}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f1433" />
                  <XAxis dataKey="dia" stroke="#4b2a85" fontSize={10} tickFormatter={(v) => v.split('-')[2] + '/' + v.split('-')[1]} />
                  <Tooltip cursor={{fill: 'rgba(139, 92, 246, 0.05)'}} contentStyle={{ backgroundColor: '#0a051a', border: '1px solid #4b2a85', borderRadius: '20px' }} />
                  <Bar dataKey="gasto" fill="#8b5cf6" radius={[10, 10, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-purple-900/20 backdrop-blur-2xl p-6 rounded-[2.5rem] border border-purple-500/30 h-[750px] flex flex-col shadow-2xl">
            <h2 className="text-[10px] font-black mb-6 uppercase tracking-widest text-purple-300 border-b border-purple-500/20 pb-4 text-center">
              Clientes ({rankingClientes.length})
            </h2>
            <div className="overflow-y-auto flex-1 pr-2 space-y-3 custom-scrollbar">
              {rankingClientes.map((c, index) => (
                <div key={c.nome} className={`p-4 rounded-2xl transition-all border ${c.estourouMeta ? 'bg-red-950/40 border-red-500/60' : 'bg-purple-950/40 border-purple-800/30'}`}>
                  <div className="flex justify-between items-start">
                    <div className="max-w-[125px]">
                      <p className="text-[10px] font-black uppercase text-white truncate mb-1">{index + 1}. {c.nome}</p>
                      <p className={`text-[9px] font-bold uppercase ${c.estourouMeta ? 'text-red-400' : 'text-purple-400'}`}>
                        {c.leads} Leads {c.meta > 0 && `| M R$${c.meta}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-black italic uppercase leading-none mb-1 ${c.estourouMeta ? 'text-red-500' : 'text-purple-400'}`}>
                        R$ {c.cpl.toFixed(2)} <span className="text-[7px] not-italic block opacity-70 uppercase">CPL</span>
                      </p>
                      <p className="text-[9px] font-medium text-white/50">
                        R$ {c.gasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
