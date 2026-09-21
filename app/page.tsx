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
  funilBox: { marginTop: '32px', backgroundColor: 'rgba(88,28,135,0.05)', padding: '32px', borderRadius: '3rem', border: '1px solid rgba(168,85,247,0.1)' },
  funilHeader: { display: 'flex', flexWrap: 'wrap' as const, justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '24px' },
  funilGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' },
  pipelineCard: { backgroundColor: 'rgba(88,28,135,0.15)', borderRadius: '1.5rem', border: '1px solid rgba(168,85,247,0.15)', padding: '20px' },
  pipelineTitle: { fontSize: '11px', fontWeight: 900, color: '#c084fc', textTransform: 'uppercase' as const, marginBottom: '4px' },
  pipelineTotal: { fontSize: '9px', color: '#a855f7', marginBottom: '16px' },
  statusRow: { marginBottom: '10px' },
  statusLabel: { display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#faf5ff', marginBottom: '4px' },
  statusBarTrack: { width: '100%', height: '8px', borderRadius: '999px', backgroundColor: 'rgba(255,255,255,0.06)', overflow: 'hidden' as const },
  statusBarFill: (pct: number): React.CSSProperties => ({ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #7c3aed, #c084fc)' }),
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
  const [abaAtiva, setAbaAtiva] = useState<'anuncios' | 'funil'>('anuncios');
  const [plataforma, setPlataforma] = useState<'meta_ads' | 'google_ads'>('meta_ads');
  const [gestorAtivo, setGestorAtivo] = useState('Todos');
  const [squadAtivo, setSquadAtivo] = useState('Todos'); // ← NOVO
  const [periodoRapido, setPeriodoRapido] = useState('7');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [clienteSelecionado, setClienteSelecionado] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Mapeamento de plataforma pros nomes de coluna que o Windsor gerou e pra
  // tabela clientes_config (Gestor/Squad/meta de CPL, que não vem do Windsor —
  // é mantida manualmente e cruzada por account_id).
  const PLATFORM_CONFIG = {
    meta_ads: {
      idField: 'conta_fb_id',
      metaField: 'meta_cpl_fb',
      // Soma leads de formulário nativo/pixel (actions_lead) + conversas de
      // WhatsApp iniciadas (campanhas de mensagem) — as duas contam como lead.
      leadsCols: ['actions_lead', 'actions_onsite_conversion_messaging_conversation_started_7d__dv0'],
      gastoCol: 'spend',
      dataCol: 'date',
    },
    google_ads: {
      // Google Ads vem do ETL Python (API oficial), não do Windsor — a
      // tabela google_ads já é criada por nós com esses nomes de coluna.
      idField: 'conta_google_id',
      metaField: 'meta_cpl_google',
      leadsCols: ['conversions'],
      gastoCol: 'spend',
      dataCol: 'date',
    },
  } as const;

  // Soma o valor de uma ou mais colunas de "lead" numa linha — meta_ads tem
  // duas (formulário + WhatsApp), google_ads só uma. Parsing inline (não usa
  // o `parse` do componente) porque essa função é definida antes dele.
  const sumLeadsCols = (row: AdsData, cols: readonly string[]) =>
    cols.reduce((total, col) => {
      const val = row[col];
      const num = typeof val === 'string' ? parseFloat(val.replace(',', '.')) : parseFloat(val);
      return total + (isNaN(num) ? 0 : num);
    }, 0);

  const [clientesConfig, setClientesConfig] = useState<AdsData[]>([]);

  // clientes_config é pequeno e não depende de plataforma/período — busca uma vez.
  useEffect(() => {
    supabase.from('clientes_config').select('*').then(({ data, error }) => {
      if (!error && data) setClientesConfig(data);
    });
  }, []);

  const configByAccountId = useMemo(() => {
    const map = new Map<string, AdsData>();
    const idField = PLATFORM_CONFIG[plataforma].idField;
    for (const c of clientesConfig) {
      if (c[idField]) map.set(String(c[idField]), c);
    }
    return map;
  }, [clientesConfig, plataforma]);

  // Calcula o intervalo de datas ANTES de buscar, pra filtrar direto no Supabase
  // em vez de trazer a tabela inteira e filtrar no navegador. fimExclusivo é o
  // dia seguinte ao fim do período, usado com .lt() pra incluir o dia inteiro
  // mesmo se a coluna tiver componente de hora.
  const { rangeInicio, rangeFimExclusivo } = useMemo(() => {
    const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const addDay = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };

    if (dataInicio || dataFim) {
      const fimDate = dataFim ? new Date(`${dataFim}T00:00:00`) : null;
      return {
        rangeInicio: dataInicio || null,
        rangeFimExclusivo: fimDate ? fmt(addDay(fimDate, 1)) : null,
      };
    }
    const dias = parseInt(periodoRapido || '7');
    const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    const ini = addDay(hoje, -dias);
    return { rangeInicio: fmt(ini), rangeFimExclusivo: fmt(addDay(hoje, 1)) };
  }, [dataInicio, dataFim, periodoRapido]);

  useEffect(() => {
    setIsMounted(true);
    setClienteSelecionado(null);
    async function fetchData() {
      setLoading(true);
      let allData: AdsData[] = [];
      let hasMore = true;
      let page = 0;
      const pageSize = 1000;
      const { dataCol } = PLATFORM_CONFIG[plataforma];
      while (hasMore) {
        const from = page * pageSize;
        // account_id é o que permite cruzar com clientes_config — linhas sem
        // ele (sincronizadas antes do campo ser adicionado no Windsor) ficam
        // de fora, já que não dá pra atribuir a um cliente com segurança.
        let query = supabase.from(plataforma).select('*').not('account_id', 'is', null);
        if (rangeInicio) query = query.gte(dataCol, rangeInicio);
        if (rangeFimExclusivo) query = query.lt(dataCol, rangeFimExclusivo);
        const { data: adsData, error } = await query.range(from, from + pageSize - 1);
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
  }, [plataforma, rangeInicio, rangeFimExclusivo]);

  // Junta cada linha de ads com cliente/gestor/squad/meta vindos do
  // clientes_config, cruzando por account_id.
  const dadosEnriquecidos = useMemo(() => {
    const { metaField } = PLATFORM_CONFIG[plataforma];
    return data.map((row): AdsData => {
      const config = configByAccountId.get(String(row.account_id));
      return {
        ...row,
        _cliente: config?.cliente ?? row.account_name,
        _gestor: config?.gestor ?? null,
        _squad: config?.squad != null ? String(config.squad) : null,
        _meta: config ? (parseFloat(config[metaField]) || 0) : 0,
      };
    });
  }, [data, configByAccountId, plataforma]);

  const opcoesGestores = useMemo(() => {
    const gestores = dadosEnriquecidos.map(i => i._gestor).filter(Boolean);
    return [...new Set(gestores)].sort();
  }, [dadosEnriquecidos]);

  const opcoesSquads = useMemo(() => {
    const squads = dadosEnriquecidos.map(i => i._squad).filter(Boolean);
    return [...new Set(squads)].sort();
  }, [dadosEnriquecidos]);

  const dadosFiltrados = useMemo(() => {
    return dadosEnriquecidos.filter(item => (
      (gestorAtivo === 'Todos' || item._gestor === gestorAtivo) &&
      (squadAtivo === 'Todos' || item._squad === squadAtivo)
    ));
  }, [dadosEnriquecidos, gestorAtivo, squadAtivo]);

  const todosClientes = useMemo(() => {
    const { leadsCols, gastoCol } = PLATFORM_CONFIG[plataforma];
    const parse = (val: any) => { if (typeof val === 'string') return parseFloat(val.replace(',', '.')) || 0; return parseFloat(val) || 0; };
    const nomes = [...new Set(dadosFiltrados.map(i => i._cliente?.trim()))].filter(Boolean) as string[];
    return nomes.map(nome => {
      const regs = dadosFiltrados.filter(d => d._cliente?.trim() === nome);
      const gasto = parseFloat(regs.reduce((a, c) => a + parse(c[gastoCol]), 0).toFixed(2));
      const leads = regs.reduce((a, c) => a + sumLeadsCols(c, leadsCols), 0);
      const meta = regs[0]._meta ?? 0;
      // Sem leads: CPL vira o próprio valor gasto (não zero) — assim o card
      // continua sinalizando estouro de meta mesmo sem nenhum lead registrado.
      const cpl = parseFloat((leads > 0 ? gasto / leads : gasto).toFixed(2));
      return { nome, gasto, leads, cpl, meta, estourouMeta: meta > 0 && cpl > meta };
    }).sort((a, b) => a.estourouMeta === b.estourouMeta ? b.cpl - a.cpl : a.estourouMeta ? -1 : 1);
  }, [dadosFiltrados, plataforma]);

  const dadosPorDia = useMemo(() => {
    if (!clienteSelecionado) return [];
    const { leadsCols, gastoCol, dataCol } = PLATFORM_CONFIG[plataforma];
    const parse = (val: any) => { if (typeof val === 'string') return parseFloat(val.replace(',', '.')) || 0; return parseFloat(val) || 0; };
    const registros = dadosFiltrados.filter(d => d._cliente?.trim() === clienteSelecionado);
    const agrupado: Record<string, { data: string; gasto: number; leads: number }> = {};
    registros.forEach(r => {
      const dia = r[dataCol]?.substring(0, 10);
      if (!dia) return;
      if (!agrupado[dia]) agrupado[dia] = { data: dia, gasto: 0, leads: 0 };
      agrupado[dia].gasto += parse(r[gastoCol]);
      agrupado[dia].leads += sumLeadsCols(r, leadsCols);
    });
    return Object.values(agrupado)
      .map(d => ({ ...d, cpl: parseFloat((d.leads > 0 ? d.gasto / d.leads : d.gasto).toFixed(2)) }))
      .sort((a, b) => a.data.localeCompare(b.data));
  }, [clienteSelecionado, dadosFiltrados, plataforma]);

  const parse = (val: any) => { if (typeof val === 'string') return parseFloat(val.replace(',', '.')) || 0; return parseFloat(val) || 0; };

  const totalGasto = clienteSelecionado
    ? dadosPorDia.reduce((a, c) => a + c.gasto, 0)
    : dadosFiltrados.reduce((a, c) => a + parse(c[PLATFORM_CONFIG[plataforma].gastoCol]), 0);
  const totalLeads = clienteSelecionado
    ? dadosPorDia.reduce((a, c) => a + c.leads, 0)
    : dadosFiltrados.reduce((a, c) => a + sumLeadsCols(c, PLATFORM_CONFIG[plataforma].leadsCols), 0);
  const totalSOS = todosClientes.filter(c => c.estourouMeta).length;

  const dadosGrafico = clienteSelecionado
    ? dadosPorDia
    : todosClientes.filter(c => gestorAtivo === 'Todos' ? c.estourouMeta : true);

  // ─── FUNIL DE CRM (Kommo / RD Station) ────────────────────────────────────
  // Usa o MESMO range de data (rangeInicio/rangeFimExclusivo) já calculado
  // pra ads — filtra crm_leads por created_at OU updated_at dentro do período,
  // e agrupa por pipeline/status aqui no front (igual todosClientes faz pra ads).
  const [funilCrm, setFunilCrm] = useState<'kommo' | 'rdstation'>('kommo');
  const [funilData, setFunilData] = useState<AdsData[]>([]);
  const [funilLoading, setFunilLoading] = useState(false);
  const [funilMarca, setFunilMarca] = useState(''); // '' = visão geral normalizada

  const [statusCategoria, setStatusCategoria] = useState<AdsData[]>([]);
  useEffect(() => {
    supabase.from('status_categoria').select('*').then(({ data, error }) => {
      if (!error && data) setStatusCategoria(data);
    });
  }, []);

  const categoriaByKey = useMemo(() => {
    const map = new Map<string, string>();
    statusCategoria.forEach(row => {
      map.set(`${row.crm}|${row.pipeline_name}|${row.status_name}`, row.categoria);
    });
    return map;
  }, [statusCategoria]);

  useEffect(() => {
    async function fetchFunil() {
      setFunilLoading(true);
      let query = supabase.from('crm_leads').select('*').eq('crm', funilCrm);
      if (rangeInicio && rangeFimExclusivo) {
        query = query.or(
          `and(created_at.gte.${rangeInicio},created_at.lt.${rangeFimExclusivo}),` +
          `and(updated_at.gte.${rangeInicio},updated_at.lt.${rangeFimExclusivo})`
        );
      }
      const { data: rows, error } = await query;
      setFunilData(error ? [] : (rows ?? []));
      setFunilLoading(false);
    }
    fetchFunil();
  }, [funilCrm, rangeInicio, rangeFimExclusivo]);

  useEffect(() => { setFunilMarca(''); }, [funilCrm]);

  const marcasDisponiveis = useMemo(() => {
    const nomes = [...new Set(funilData.map(r => r.pipeline_name).filter(Boolean))] as string[];
    return nomes.sort();
  }, [funilData]);

  const CATEGORIA_LABELS: Record<string, string> = {
    leads_frios: 'Leads frios',
    leads_mornos: 'Leads mornos',
    leads_avancados: 'Leads avançados',
    reuniao_agendada: 'Reunião agendada',
    reuniao_realizada: 'Reunião realizada',
    cof: 'COF',
    venda: 'Venda',
    perdidos: 'Perdidos',
    nao_mapeado: 'Não mapeado',
  };
  const CATEGORIA_ORDEM = ['leads_frios', 'leads_mornos', 'leads_avancados', 'reuniao_agendada', 'reuniao_realizada', 'cof', 'venda', 'perdidos', 'nao_mapeado'];

  // Sem marca selecionada: agrupa TODOS os pipelines pelas 8 categorias
  // padrão (via status_categoria). Com marca selecionada: mostra os status
  // reais daquele pipeline, do jeito que ele foi configurado no CRM.
  const funilVisao = useMemo(() => {
    if (funilMarca) {
      const dadosMarca = funilData.filter(r => r.pipeline_name === funilMarca);
      const statuses: Record<string, { nome: string; leads: number; valor: number }> = {};
      let totalLeads = 0, totalValor = 0;
      dadosMarca.forEach(row => {
        const nome = row.status_name || row.status_id || 'Sem status';
        if (!statuses[nome]) statuses[nome] = { nome, leads: 0, valor: 0 };
        const valor = parseFloat(row.price) || 0;
        statuses[nome].leads += 1;
        statuses[nome].valor += valor;
        totalLeads += 1;
        totalValor += valor;
      });
      return {
        modo: 'marca' as const,
        etapas: Object.values(statuses).sort((a, b) => b.leads - a.leads),
        totalLeads,
        totalValor,
      };
    }

    const categorias: Record<string, { leads: number; valor: number }> = {};
    let totalLeads = 0, totalValor = 0;
    funilData.forEach(row => {
      const key = `${row.crm}|${row.pipeline_name}|${row.status_name}`;
      const categoria = categoriaByKey.get(key) || 'nao_mapeado';
      if (!categorias[categoria]) categorias[categoria] = { leads: 0, valor: 0 };
      const valor = parseFloat(row.price) || 0;
      categorias[categoria].leads += 1;
      categorias[categoria].valor += valor;
      totalLeads += 1;
      totalValor += valor;
    });
    return {
      modo: 'geral' as const,
      etapas: CATEGORIA_ORDEM
        .filter(c => categorias[c])
        .map(c => ({ nome: CATEGORIA_LABELS[c], leads: categorias[c].leads, valor: categorias[c].valor })),
      totalLeads,
      totalValor,
    };
  }, [funilMarca, funilData, categoriaByKey]);

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

            {/* ─── ABAS ────────────────────────────────────────────────────── */}
            <div style={S.platformSwitch}>
              <button onClick={() => setAbaAtiva('anuncios')} style={S.btnMeta(abaAtiva === 'anuncios')}>Anúncios</button>
              <button onClick={() => setAbaAtiva('funil')} style={S.btnGoogle(abaAtiva === 'funil')}>Funil de CRM</button>
            </div>

            {abaAtiva === 'anuncios' ? (
              <>
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
              </>
            ) : (
              <>
                <div style={S.platformSwitch}>
                  <button onClick={() => setFunilCrm('kommo')} style={S.btnMeta(funilCrm === 'kommo')}>Kommo</button>
                  <button onClick={() => setFunilCrm('rdstation')} style={S.btnGoogle(funilCrm === 'rdstation')}>RD Station</button>
                </div>

                {/* ─── FILTRO DE MARCA ────────────────────────────────────────── */}
                <select style={S.select} value={funilMarca} onChange={e => setFunilMarca(e.target.value)}>
                  <option value="">Visão geral (todas as marcas)</option>
                  {marcasDisponiveis.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                {/* ─────────────────────────────────────────────────────────────── */}
              </>
            )}
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
              {(abaAtiva === 'anuncios' ? loading : funilLoading) && <span style={S.loading}>{abaAtiva === 'anuncios' ? 'SINCRONIZANDO SUPABASE...' : 'CARREGANDO FUNIL...'}</span>}
              {abaAtiva === 'anuncios' && clienteSelecionado && (
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

        {abaAtiva === 'anuncios' && (
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
        )}

        {abaAtiva === 'funil' && (
        <div style={S.funilBox}>
          <div style={S.funilHeader}>
            <h3 style={S.chartTitle}>
              🧭 {funilMarca ? funilMarca : 'Visão geral — todas as marcas'}
            </h3>
            <p style={{ color: '#a855f7', fontSize: '10px' }}>
              {funilVisao.totalLeads} leads · R$ {funilVisao.totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>

          {!funilLoading && funilData.length === 0 && (
            <p style={{ color: '#a855f7', fontSize: '11px' }}>Nenhum lead encontrado pra {funilCrm === 'kommo' ? 'Kommo' : 'RD Station'} nesse período.</p>
          )}

          <div style={S.funilGrid}>
            <div style={{ ...S.pipelineCard, gridColumn: '1 / -1' }}>
              {funilVisao.etapas.map(s => (
                <div key={s.nome} style={S.statusRow}>
                  <div style={S.statusLabel}>
                    <span>{s.nome}</span>
                    <span>{s.leads} · R$ {s.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div style={S.statusBarTrack}>
                    <div style={S.statusBarFill(funilVisao.totalLeads > 0 ? (s.leads / funilVisao.totalLeads) * 100 : 0)} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        )}
      </div>
    </main>
  );
}
