"use client";
import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell, LabelList
} from 'recharts';
import Image from 'next/image';

interface AdsData { [key: string]: any; }

const S = {
  page: { minHeight: '100vh', padding: '24px', backgroundColor: '#0a051a', color: '#faf5ff', fontFamily: 'sans-serif', boxSizing: 'border-box' as const },
  inner: { maxWidth: '1800px', margin: '0 auto', position: 'relative' as const },
  header: { display: 'flex', flexDirection: 'column' as const, gap: '24px', marginBottom: '48px', borderBottom: '1px solid rgba(88,28,135,0.4)', paddingBottom: '32px' },
  headerTop: { display: 'flex', flexWrap: 'wrap' as const, justifyContent: 'space-between', alignItems: 'center', gap: '16px' },
  headerBottom: { display: 'flex', flexWrap: 'wrap' as const, alignItems: 'center', justifyContent: 'space-between', gap: '16px' },
  platformSwitch: { display: 'flex', backgroundColor: 'rgba(88,28,135,0.4)', padding: '4px', borderRadius: '12px', border: '1px solid rgba(126,34,206,0.5)' },
  btnMeta: (active: boolean): React.CSSProperties => ({ padding: '8px 24px', borderRadius: '8px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', border: 'none', cursor: 'pointer', transition: 'all 0.2s', background: active ? '#2563eb' : 'transparent', color: active ? '#fff' : '#a855f7' }),
  btnGoogle: (active: boolean): React.CSSProperties => ({ padding: '8px 24px', borderRadius: '8px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', border: 'none', cursor: 'pointer', transition: 'all 0.2s', background: active ? '#eab308' : 'transparent', color: active ? '#000' : '#a855f7' }),
  select: { appearance: 'none' as const, backgroundColor: 'rgba(88,28,135,0.4)', color: '#fff', fontWeight: 700, padding: '8px 32px', borderRadius: '9999px', border: '1px solid rgba(126,34,206,0.5)', fontSize: '10px', textTransform: 'uppercase' as const, outline: 'none', cursor: 'pointer', minWidth: '200px' },
  periodGroup: { display: 'flex', backgroundColor: 'rgba(88,28,135,0.3)', padding: '4px', borderRadius: '9999px', border: '1px solid rgba(126,34,206,0.5)' },
  btnPeriod: (active: boolean): React.CSSProperties => ({ padding: '8px 24px', borderRadius: '9999px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', border: 'none', cursor: 'pointer', background: active ? '#7c3aed' : 'transparent', color: active ? '#fff' : '#a855f7' }),
  dateGroup: { display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: 'rgba(88,28,135,0.2)', padding: '8px 24px', borderRadius: '9999px', border: '1px solid rgba(126,34,206,0.3)' },
  dateInput: { background: 'transparent', color: '#fff', fontSize: '10px', fontWeight: 700, outline: 'none', border: 'none', cursor: 'pointer' },
  dateDivider: { height: '16px', width: '1px', background: 'rgba(126,34,206,0.3)' },
  loading: { color: '#a855f7', fontSize: '10px', fontWeight: 900 },
  grid: { display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '32px' },
  gridLeft: { display: 'flex', flexDirection: 'column' as const, gap: '32px' },
  cardsRow: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' },
  card: { backgroundColor: 'rgba(88,28,135,0.1)', padding: '24px', borderRadius: '2rem', border: '1px solid rgba(168,85,247,0.2)', textAlign: 'center' as const },
  cardSOS: (sos: boolean): React.CSSProperties => ({ backgroundColor: sos ? 'rgba(127,29,29,0.2)' : 'rgba(88,28,135,0.1)', padding: '24px', borderRadius: '2rem', border: sos ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(168,85,247,0.2)', textAlign: 'center' }),
  cardLabel: { color: '#a855f7', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase' as const, marginBottom: '8px', letterSpacing: '0.1em' },
  cardLabelRed: { color: '#f87171', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase' as const, marginBottom: '8px', letterSpacing: '0.1em' },
  cardValue: { fontSize: '28px', fontWeight: 700, fontStyle: 'italic', color: '#fff', margin: 0 },
  cardValueRed: { fontSize: '28px', fontWeight: 700, fontStyle: 'italic', color: '#ef4444', margin: 0 },
  chartBox: { backgroundColor: 'rgba(88,28,135,0.05)', padding: '32px', borderRadius: '3rem', border: '1px solid rgba(168,85,247,0.1)', height: '500px' },
  chartTitle: { fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: '#a855f7', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' },
  sidebar: { backgroundColor: 'rgba(88,28,135,0.2)', padding: '24px', borderRadius: '2.5rem', border: '1px solid rgba(168,85,247,0.3)', height: '750px', display: 'flex', flexDirection: 'column' as const },
  sidebarTitle: { fontSize: '10px', fontWeight: 900, marginBottom: '24px', textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: '#d8b4fe', borderBottom: '1px solid rgba(168,85,247,0.2)', paddingBottom: '16px', textAlign: 'center' as const },
  sidebarList: { overflowY: 'auto' as const, flex: 1, paddingRight: '8px', display: 'flex', flexDirection: 'column' as const, gap: '12px' },
  clientCard: (sos: boolean): React.CSSProperties => ({ padding: '16px', borderRadius: '1rem', border: sos ? '1px solid rgba(239,68,68,0.6)' : '1px solid rgba(88,28,135,0.3)', backgroundColor: sos ? 'rgba(69,10,10,0.4)' : 'rgba(59,7,100,0.4)' }),
  clientName: { fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' as const, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, margin: 0 },
  clientRow: { display: 'flex', justifyContent: 'space-between', marginTop: '8px' },
  clientRow2: { display: 'flex', justifyContent: 'space-between', marginTop: '4px' },
  clientLeads: { fontSize: '9px', color: '#a855f7', fontWeight: 700 },
  clientCPL: (sos: boolean): React.CSSProperties => ({ fontSize: '9px', fontWeight: 900, color: sos ? '#ef4444' : '#fff' }),
  clientGasto: { fontSize: '9px', color: '#4ade80', fontWeight: 700 },
  clientMeta: { fontSize: '9px', color: '#d8b4fe', fontWeight: 700 },
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{ backgroundColor: '#0a051a', border: '1px solid #4b2a85', borderRadius: '20px', padding: '12px 16px' }}>
        <p style={{ color: '#fff', fontWeight: 'bold', marginBottom: '8px', fontSize: '12px' }}>{data.nome}</p>
        <p style={{ color: '#fff', fontSize: '11px', marginBottom: '4px' }}>Resultado: <span style={{ fontWeight: 'bold' }}>{data.leads}</span></p>
        <p style={{ color: '#fff', fontSize: '11px', marginBottom: '4px' }}>CPL: <span style={{ fontWeight: 'bold' }}>R$ {data.cpl.toFixed(2)}</span></p>
        <p style={{ color: '#fff', fontSize: '11px' }}>Investimento: <span style={{ fontWeight: 'bold' }}>R$ {data.gasto.toFixed(2)}</span></p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [data, setData] = useState<AdsData[]>([]);
  const [plataforma, setPlataforma] = useState<'meta_ads' | 'google_ads'>('meta_ads');
  const [gestorAtivo, setGestorAtivo] = useState('Todos');
  const [periodoRapido, setPeriodoRapido] = useState('7');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(false);

  const cols = useMemo(() => {
    if (plataforma === 'google_ads') {
      return { cliente: 'cliente', gestor: 'gestor', gasto: 'gastoTotal', leads: 'leadsTotal', data: 'dataInicio', meta: 'meta' };
    }
    return { cliente: 'CLIENTE', gestor: 'Gestor', gasto: 'gasto', leads: 'leads', data: 'data_inicio', meta: 'meta cpl' };
  }, [plataforma]);

  useEffect(() => {
    setIsMounted(true);
    async function fetchData() {
      setLoading(true);
      let allData: AdsData[] = [];
      let hasMore = true;
      let page = 0;
      const pageSize = 1000;
      while (hasMore) {
        const from = page * pageSize;
        const { data: adsData, error } = await supabase.from(plataforma).select('*').not(cols.cliente, 'is', null).range(from, from + pageSize - 1);
        if (error) { hasMore = false; }
        else if (adsData && adsData.length > 0) {
          allData = [...allData, ...adsData];
          if (adsData.length < pageSize) hasMore = false; else page++;
        } else { hasMore = false; }
      }
      setData(allData);
      setLoading(false);
    }
    fetchData();
  }, [plataforma, cols]);

  const opcoesGestores = useMemo(() => {
    const gestores = data.map(i => i[cols.gestor]?.trim()).filter(Boolean);
    return [...new Set(gestores)].sort();
  }, [data, cols]);

  const dadosFiltrados = useMemo(() => {
    const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    return data.filter(item => {
      const dateVal = item[cols.data];
      if (!dateVal) return false;
      const str = dateVal.substring(0, 10);
      let ok = false;
      if (dataInicio || dataFim) {
        ok = (!dataInicio || str >= dataInicio) && (!dataFim || str <= dataFim);
      } else {
        const dias = parseInt(periodoRapido);
        const hoje = new Date(); hoje.setHours(0,0,0,0);
        const fim = new Date(hoje); fim.setDate(hoje.getDate() - 1);
        const ini = new Date(hoje); ini.setDate(hoje.getDate() - dias);
        ok = str >= fmt(ini) && str <= fmt(fim);
      }
      return (gestorAtivo === 'Todos' || item[cols.gestor]?.trim() === gestorAtivo) && ok;
    });
  }, [data, gestorAtivo, dataInicio, dataFim, periodoRapido, cols]);

  const todosClientes = useMemo(() => {
    const parse = (val: any) => { if (typeof val === 'string') return parseFloat(val.replace(',','.')) || 0; return parseFloat(val) || 0; };
    const nomes = [...new Set(dadosFiltrados.map(i => i[cols.cliente]?.trim()))].filter(Boolean) as string[];
    return nomes.map(nome => {
      const regs = dadosFiltrados.filter(d => d[cols.cliente]?.trim() === nome);
      const gasto = parseFloat(regs.reduce((a, c) => a + parse(c[cols.gasto]), 0).toFixed(2));
      const leads = regs.reduce((a, c) => a + parse(c[cols.leads]), 0);
      const meta = parse(regs[0][cols.meta]);
      const cpl = parseFloat((leads > 0 ? gasto / leads : 0).toFixed(2));
      return { nome, gasto, leads, cpl, meta, estourouMeta: meta > 0 && cpl > meta };
    }).sort((a, b) => a.estourouMeta === b.estourouMeta ? b.gasto - a.gasto : a.estourouMeta ? -1 : 1);
  }, [dadosFiltrados, cols]);

  const parse = (val: any) => { if (typeof val === 'string') return parseFloat(val.replace(',','.')) || 0; return parseFloat(val) || 0; };
  const totalGasto = dadosFiltrados.reduce((a, c) => a + parse(c[cols.gasto]), 0);
  const totalLeads = dadosFiltrados.reduce((a, c) => a + parse(c[cols.leads]), 0);
  const totalSOS = todosClientes.filter(c => c.estourouMeta).length;

  if (!isMounted) return null;

  return (
    <main style={S.page}>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #4b2a85; border-radius: 10px; }
        * { box-sizing: border-box; }
        @media (max-width: 1024px) {
          .main-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 768px) {
          .cards-row { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div style={S.inner}>
        <header style={S.header}>
          <div style={S.headerTop}>
            <Image src="/logo-empresa.png" alt="Logo" width={200} height={50} style={{ height: '48px', width: 'auto' }} />
            <div style={S.platformSwitch}>
              <button onClick={() => setPlataforma('meta_ads')} style={S.btnMeta(plataforma === 'meta_ads')}>Meta Ads</button>
              <button onClick={() => setPlataforma('google_ads')} style={S.btnGoogle(plataforma === 'google_ads')}>Google Ads</button>
            </div>
            <select style={S.select} value={gestorAtivo} onChange={e => setGestorAtivo(e.target.value)}>
              <option value="Todos">Visão Geral (Apenas S.O.S)</option>
              {opcoesGestores.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          <div style={S.headerBottom}>
            <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={S.periodGroup}>
                {['1','7','14'].map(d => (
                  <button key={d} onClick={() => { setPeriodoRapido(d); setDataInicio(''); setDataFim(''); }}
                    style={S.btnPeriod(periodoRapido === d && !dataInicio && !dataFim)}>{d}D</button>
                ))}
              </div>
              <div style={S.dateGroup}>
                <input type="date" value={dataInicio} style={S.dateInput} onChange={e => { setDataInicio(e.target.value); setPeriodoRapido(''); }} />
                <div style={S.dateDivider} />
                <input type="date" value={dataFim} style={S.dateInput} onChange={e => { setDataFim(e.target.value); setPeriodoRapido(''); }} />
              </div>
            </div>
            {loading && <span style={S.loading}>SINCRONIZANDO SUPABASE...</span>}
          </div>
        </header>

        <div className="main-grid" style={S.grid}>
          <div style={S.gridLeft}>
            <div className="cards-row" style={S.cardsRow}>
              <div style={S.card}>
                <p style={S.cardLabel}>Investimento {plataforma === 'meta_ads' ? 'Meta' : 'Google'}</p>
                <p style={S.cardValue}>R$ {totalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div style={S.card}>
                <p style={S.cardLabel}>{plataforma === 'meta_ads' ? 'Leads' : 'Conversões'}</p>
                <p style={S.cardValue}>{totalLeads}</p>
              </div>
              <div style={S.cardSOS(totalSOS > 0)}>
                <p style={S.cardLabelRed}>Clientes S.O.S</p>
                <p style={S.cardValueRed}>{totalSOS}</p>
              </div>
            </div>

            <div style={S.chartBox}>
              <h3 style={S.chartTitle}>
                {gestorAtivo === 'Todos' ? `🔴 Crítico ${plataforma}` : `📊 Performance ${plataforma}: ${gestorAtivo}`}
              </h3>
              <ResponsiveContainer width="100%" height="90%">
                <ComposedChart data={todosClientes.filter(c => gestorAtivo === 'Todos' ? c.estourouMeta : true)} margin={{ bottom: 100, top: 20, left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f1433" />
                  <XAxis dataKey="nome" stroke="#ffffff" fontSize={10} interval={0} angle={-45} textAnchor="end" tickMargin={25} />
                  <YAxis yAxisId="left" hide />
                  <YAxis yAxisId="right" orientation="right" hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar yAxisId="left" dataKey="leads" fill="#8b5cf6" radius={[6,6,0,0]} barSize={25}>
                    <LabelList dataKey="leads" position="top" fill="#8b5cf6" fontSize={10} fontWeight="bold" />
                  </Bar>
                  <Bar yAxisId="left" dataKey="cpl" radius={[6,6,0,0]} barSize={25}>
                    {todosClientes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.estourouMeta ? '#ef4444' : '#4b2a85'} />
                    ))}
                    <LabelList dataKey="cpl" position="top" fill="#fff" fontSize={9} formatter={(v: any) => `R$${Number(v).toFixed(2)}`} />
                  </Bar>
                  <Line yAxisId="right" type="monotone" dataKey="gasto" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={S.sidebar}>
            <h2 style={S.sidebarTitle}>Clientes {plataforma} ({todosClientes.length})</h2>
            <div className="custom-scrollbar" style={S.sidebarList}>
              {todosClientes.map((c, index) => {
                const cplExibido = c.leads === 0 ? c.gasto : c.cpl;
                return (
                  <div key={c.nome} style={S.clientCard(c.estourouMeta)}>
                    <p style={S.clientName}>{index + 1}. {c.nome}</p>
                    <div style={S.clientRow}>
                      <span style={S.clientLeads}>{c.leads} {plataforma === 'meta_ads' ? 'Leads' : 'Conv.'}</span>
                      <span style={S.clientCPL(c.estourouMeta)}>CPL R$ {cplExibido.toFixed(2)}</span>
                    </div>
                    <div style={S.clientRow2}>
                      <span style={S.clientGasto}>Gasto R$ {c.gasto.toFixed(2)}</span>
                      {c.meta > 0 && <span style={S.clientMeta}>Meta R$ {c.meta.toFixed(2)}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
