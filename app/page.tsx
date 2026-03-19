"use client";
import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell, LabelList
} from 'recharts';
import Image from 'next/image';

interface AdsData { [key: string]: any; }

// ─── ESTILOS BASE ──────────────────────────────────────────────────────────────
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
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{ backgroundColor: '#0a051a', border: '1px solid #4b2a85', borderRadius: '20px', padding: '12px 16px' }}>
        <p style={{ color: '#fff', fontWeight: 'bold', marginBottom: '8px', fontSize: '12px' }}>{data.nome || data.data}</p>
        <p style={{ color: '#fff', fontSize: '11px', marginBottom: '4px' }}>Resultado: <b>{data.leads}</b></p>
        <p style={{ color: '#fff', fontSize: '11px', marginBottom: '4px' }}>CPL: <b>R$ {data.cpl.toFixed(2)}</b></p>
        <p style={{ color: '#fff', fontSize: '11px' }}>Investimento: <b>R$ {data.gasto.toFixed(2)}</b></p>
      </div>
    );
  }
  return null;
};

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
function ClienteSidebar({
  clientes,
  plataforma,
  clienteSelecionado,
  onSelect,
}: {
  clientes: { nome: string; gasto: number; leads: number; cpl: number; meta: number; estourouMeta: boolean }[];
  plataforma: 'meta_ads' | 'google_ads';
  clienteSelecionado: string | null;
  onSelect: (nome: string) => void;
}) {
  const label = plataforma === 'google_ads' ? 'Google Ads' : 'Meta Ads';
  const sosCount = clientes.filter(c => c.estourouMeta).length;

  return (
    <aside style={{
      background: '#13102a',
      border: '1px solid rgba(120,80,255,0.18)',
      borderRadius: '18px',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 0 60px rgba(124,58,237,0.10), 0 2px 24px rgba(0,0,0,0.5)',
      position: 'relative',
      overflow: 'hidden',
      height: '750px',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: '20%', right: '20%', height: '2px',
        background: 'linear-gradient(90deg, transparent, #a855f7, transparent)',
        borderRadius: '99px', zIndex: 1,
      }} />
      <div style={{
        padding: '16px 18px 14px',
        borderBottom: '1px solid rgba(120,80,255,0.18)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: '8px', flexShrink: 0,
      }}>
        <span style={{
          fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: '#c084fc', whiteSpace: 'nowrap',
        }}>
          Clientes {label}
        </span>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {sosCount > 0 && (
            <span style={{
              background: 'rgba(255,77,109,0.18)',
              border: '1px solid rgba(255,77,109,0.4)',
              borderRadius: '6px', padding: '2px 7px',
              fontSize: '9px', fontWeight: 800, color: '#ff4d6d',
              letterSpacing: '0.08em',
              display: 'flex', alignItems: 'center', gap: '4px',
            }}>
              <span style={{ animation: 'sosPulse 1.2s ease-in-out infinite' }}>●</span>
              {sosCount} S.O.S
            </span>
          )}
          <span style={{
            background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
            color: '#fff', fontSize: '10px', fontWeight: 700,
            padding: '3px 9px', borderRadius: '99px',
          }}>
            {clientes.length}
          </span>
        </div>
      </div>
      <div style={{
        overflowY: 'auto', flex: 1,
        padding: '10px 14px',
        display: 'flex', flexDirection: 'column', gap: '8px',
        scrollbarWidth: 'thin', scrollbarColor: '#7c3aed transparent',
      }}>
        {clientes.map((c, i) => {
          const ativo = clienteSelecionado === c.nome;
          const cplExibido = c.leads === 0 ? c.gasto : c.cpl;
          return (
            <div
              key={c.nome}
              onClick={() => onSelect(c.nome)}
              style={{
                background: ativo
                  ? 'rgba(124,58,237,0.35)'
                  : c.estourouMeta ? 'rgba(255,77,109,0.07)' : '#1a1535',
                border: `1px solid ${ativo ? 'rgba(168,85,247,0.6)' : c.estourouMeta ? 'rgba(255,77,109,0.28)' : 'rgba(120,80,255,0.16)'}`,
                borderRadius: '12px', padding: '11px 13px',
                cursor: 'pointer', transition: 'border-color .15s, background .15s',
              }}
            >
              <div style={{
                fontSize: '10.5px', fontWeight: 700,
                letterSpacing: '0.06em', textTransform: 'uppercase',
                color: '#fff', marginBottom: '7px',
                display: 'flex', alignItems: 'center', gap: '5px',
              }}>
                <span style={{ color: 'rgba(255,255,255,0.38)', fontWeight: 600, flexShrink: 0 }}>{i + 1}.</span>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.nome}</span>
                {c.estourouMeta && (
                  <span style={{
                    background: 'rgba(255,77,109,0.2)', border: '1px solid rgba(255,77,109,0.4)',
                    borderRadius: '5px', padding: '1px 6px',
                    fontSize: '8.5px', fontWeight: 800, color: '#ff4d6d', flexShrink: 0,
                  }}>S.O.S</span>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>{c.leads} {plataforma === 'meta_ads' ? 'Leads' : 'Conv.'}</span>
                  <span style={{ fontWeight: 600, color: c.estourouMeta ? '#ff4d6d' : '#00e5a0' }}>CPL R$ {cplExibido.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px' }}>
                  <span style={{ color: 'rgba(255,255,255,0.4)' }}>
                    Gasto <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>R$ {c.gasto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </span>
                  {c.meta > 0 && <span style={{ color: '#c084fc', fontSize: '10px' }}>Meta R$ {c.meta.toFixed(2)}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <style>{`@keyframes sosPulse { 0%,100%{opacity:1} 50%{opacity:.25} }`}</style>
    </aside>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [data, setData] = useState<AdsData[]>([]);
  const [plataforma, setPlataforma] = useState<'meta_ads' | 'google_ads'>('meta_ads');
  const [gestorAtivo, setGestorAtivo] = useState('Todos');
  const [squadAtivo, setSquadAtivo] = useState('Todos'); // ← NOVO
  const [periodoRapido, setPeriodoRapido] = useState('7');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [clienteSelecionado, setClienteSelecionado] = useState<string | null>(null);
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
    setClienteSelecionado(null);
    setSquadAtivo('Todos'); // ← NOVO: reset ao trocar plataforma
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

  // Opções de gestores
  const opcoesGestores = useMemo(() => {
    const gestores = data.map(i => i[cols.gestor]?.trim()).filter(Boolean);
    return [...new Set(gestores)].sort();
  }, [data, cols]);

  // ← NOVO: Opções de squads
  const opcoesSquads = useMemo(() => {
    const squads = data.map(i => i['squad']?.trim()).filter(Boolean);
    return [...new Set(squads)].sort();
  }, [data]);

  const dadosFiltrados = useMemo(() => {
    const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return data.filter(item => {
      const dateVal = item[cols.data];
      if (!dateVal) return false;
      const str = dateVal.substring(0, 10);
      let ok = false;
      if (dataInicio || dataFim) {
        ok = (!dataInicio || str >= dataInicio) && (!dataFim || str <= dataFim);
      } else {
        const dias = parseInt(periodoRapido);
        const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
        const fim = new Date(hoje);
        const ini = new Date(hoje); ini.setDate(hoje.getDate() - dias);
        ok = str >= fmt(ini) && str <= fmt(fim);
      }
      return (
        (gestorAtivo === 'Todos' || item[cols.gestor]?.trim() === gestorAtivo) &&
        (squadAtivo === 'Todos' || item['squad']?.trim() === squadAtivo) && // ← NOVO
        ok
      );
    });
  }, [data, gestorAtivo, squadAtivo, dataInicio, dataFim, periodoRapido, cols]); // ← squadAtivo adicionado

  const todosClientes = useMemo(() => {
    const parse = (val: any) => { if (typeof val === 'string') return parseFloat(val.replace(',', '.')) || 0; return parseFloat(val) || 0; };
    const nomes = [...new Set(dadosFiltrados.map(i => i[cols.cliente]?.trim()))].filter(Boolean) as string[];
    return nomes.map(nome => {
      const regs = dadosFiltrados.filter(d => d[cols.cliente]?.trim() === nome);
      const gasto = parseFloat(regs.reduce((a, c) => a + parse(c[cols.gasto]), 0).toFixed(2));
      const leads = regs.reduce((a, c) => a + parse(c[cols.leads]), 0);
      const meta = parse(regs[0][cols.meta]);
      const cpl = parseFloat((leads > 0 ? gasto / leads : 0).toFixed(2));
      return { nome, gasto, leads, cpl, meta, estourouMeta: meta > 0 && cpl > meta };
    }).sort((a, b) => a.estourouMeta === b.estourouMeta ? b.cpl - a.cpl : a.estourouMeta ? -1 : 1);
  }, [dadosFiltrados, cols]);

  const dadosPorDia = useMemo(() => {
    if (!clienteSelecionado) return [];
    const parse = (val: any) => { if (typeof val === 'string') return parseFloat(val.replace(',', '.')) || 0; return parseFloat(val) || 0; };
    const registros = dadosFiltrados.filter(d => d[cols.cliente]?.trim() === clienteSelecionado);
    const agrupado: Record<string, { data: string; gasto: number; leads: number }> = {};
    registros.forEach(r => {
      const dia = r[cols.data]?.substring(0, 10);
      if (!dia) return;
      if (!agrupado[dia]) agrupado[dia] = { data: dia, gasto: 0, leads: 0 };
      agrupado[dia].gasto += parse(r[cols.gasto]);
      agrupado[dia].leads += parse(r[cols.leads]);
    });
    return Object.values(agrupado)
      .map(d => ({ ...d, cpl: d.leads > 0 ? parseFloat((d.gasto / d.leads).toFixed(2)) : 0 }))
      .sort((a, b) => a.data.localeCompare(b.data));
  }, [clienteSelecionado, dadosFiltrados, cols]);

  const parse = (val: any) => { if (typeof val === 'string') return parseFloat(val.replace(',', '.')) || 0; return parseFloat(val) || 0; };

  const totalGasto = clienteSelecionado
    ? dadosPorDia.reduce((a, c) => a + c.gasto, 0)
    : dadosFiltrados.reduce((a, c) => a + parse(c[cols.gasto]), 0);
  const totalLeads = clienteSelecionado
    ? dadosPorDia.reduce((a, c) => a + c.leads, 0)
    : dadosFiltrados.reduce((a, c) => a + parse(c[cols.leads]), 0);
  const totalSOS = todosClientes.filter(c => c.estourouMeta).length;

  const dadosGrafico = clienteSelecionado
    ? dadosPorDia
    : todosClientes.filter(c => gestorAtivo === 'Todos' ? c.estourouMeta : true);

  if (!isMounted) return null;

  return (
    <main style={S.page}>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #4b2a85; border-radius: 10px; }
        * { box-sizing: border-box; }
        @media (max-width: 1024px) { .main-grid { grid-template-columns: 1fr !important; } }
        @media (max-width: 768px) { .cards-row { grid-template-columns: 1fr !important; } }
      `}</style>

      <div aria-hidden="true" style={{
        position: 'fixed', inset: 0,
        backgroundImage: "url('/logo-empresa.png')",
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center center',
        backgroundSize: '35%',
        opacity: 0.04,
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      <div style={{ ...S.inner, zIndex: 1 }}>
        <header style={S.header}>
          <div style={S.headerTop}>
            <Image src="/logo-empresa.png" alt="Logo" width={220} height={64} style={{ height: '64px', width: 'auto' }} priority />
            <div style={S.platformSwitch}>
              <button onClick={() => setPlataforma('meta_ads')} style={S.btnMeta(plataforma === 'meta_ads')}>Meta Ads</button>
              <button onClick={() => setPlataforma('google_ads')} style={S.btnGoogle(plataforma === 'google_ads')}>Google Ads</button>
            </div>

            {/* ─── FILTROS GESTOR + SQUAD ─────────────────────────────────── */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <select style={S.select} value={gestorAtivo} onChange={e => setGestorAtivo(e.target.value)}>
                <option value="Todos">Visão Geral (Apenas S.O.S)</option>
                {opcoesGestores.map(g => <option key={g} value={g}>{g}</option>)}
              </select>

              <select style={S.select} value={squadAtivo} onChange={e => setSquadAtivo(e.target.value)}>
                <option value="Todos">Todos os Squads</option>
                {opcoesSquads.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {/* ─────────────────────────────────────────────────────────────── */}
          </div>

          <div style={S.headerBottom}>
            <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={S.periodGroup}>
                {['1', '7', '14'].map(d => (
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {loading && <span style={S.loading}>SINCRONIZANDO SUPABASE...</span>}
              {clienteSelecionado && (
                <button
                  onClick={() => setClienteSelecionado(null)}
                  style={{
                    background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(168,85,247,0.4)',
                    borderRadius: '8px', color: '#c084fc',
                    fontSize: '10px', fontWeight: 700, padding: '5px 14px',
                    cursor: 'pointer', letterSpacing: '0.06em',
                  }}
                >
                  ✕ {clienteSelecionado}
                </button>
              )}
            </div>
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
                {clienteSelecionado
                  ? `📅 ${clienteSelecionado} — performance por dia`
                  : gestorAtivo === 'Todos'
                    ? `🔴 Crítico ${plataforma}`
                    : `📊 Performance ${plataforma}: ${gestorAtivo}`
                }
              </h3>
              <ResponsiveContainer width="100%" height="90%">
                <ComposedChart data={dadosGrafico} margin={{ bottom: 100, top: 20, left: 10, right: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f1433" />
                  <XAxis
                    dataKey={clienteSelecionado ? 'data' : 'nome'}
                    stroke="#ffffff" fontSize={10} interval={0} angle={-45}
                    textAnchor="end" tickMargin={25}
                    tickFormatter={(v) => {
                      if (!clienteSelecionado) return v;
                      const d = new Date(`${v}T00:00:00`);
                      return `${d.getDate()}/${d.getMonth() + 1}`;
                    }}
                  />
                  <YAxis yAxisId="left" hide />
                  <YAxis yAxisId="right" orientation="right" hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar yAxisId="left" dataKey="leads" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={25}>
                    <LabelList dataKey="leads" position="top" fill="#8b5cf6" fontSize={10} fontWeight="bold" />
                  </Bar>
                  <Bar yAxisId="left" dataKey="cpl" radius={[6, 6, 0, 0]} barSize={25}>
                    {dadosGrafico.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={(entry as any).estourouMeta ? '#ef4444' : '#4b2a85'} />
                    ))}
                    <LabelList dataKey="cpl" position="top" fill="#fff" fontSize={9} formatter={(v: any) => `R$${Number(v).toFixed(2)}`} />
                  </Bar>
                  <Line yAxisId="right" type="monotone" dataKey="gasto" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <ClienteSidebar
            clientes={todosClientes}
            plataforma={plataforma}
            clienteSelecionado={clienteSelecionado}
            onSelect={(nome) => setClienteSelecionado(prev => prev === nome ? null : nome)}
          />
        </div>
      </div>
    </main>
  );
}
