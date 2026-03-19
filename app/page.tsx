"use client";
import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell, LabelList
} from 'recharts';
import Image from 'next/image';

interface AdsData { [key: string]: any; }

// (SEU OBJETO S CONTINUA IGUAL — NÃO ALTEREI)
const S = { ... } // 👈 mantém exatamente o seu

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{ backgroundColor: '#0a051a', border: '1px solid #4b2a85', borderRadius: '20px', padding: '12px 16px' }}>
        <p style={{ color: '#fff', fontWeight: 'bold', marginBottom: '8px', fontSize: '12px' }}>{data.nome}</p>
        <p style={{ color: '#fff', fontSize: '11px' }}>Leads: <b>{data.leads}</b></p>
        <p style={{ color: '#fff', fontSize: '11px' }}>CPL: <b>R$ {data.cpl.toFixed(2)}</b></p>
        <p style={{ color: '#fff', fontSize: '11px' }}>Gasto: <b>R$ {data.gasto.toFixed(2)}</b></p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {

  const [dataMeta, setDataMeta] = useState<AdsData[]>([]);
  const [dataGoogle, setDataGoogle] = useState<AdsData[]>([]);
  const [plataforma, setPlataforma] = useState<'meta_ads' | 'google_ads'>('meta_ads');

  const [gestorAtivo, setGestorAtivo] = useState('Todos');
  const [periodoRapido, setPeriodoRapido] = useState('7');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(false);

  // 🔥 FETCH DUPLO (META + GOOGLE)
  useEffect(() => {
    setIsMounted(true);

    async function fetchAll() {
      setLoading(true);

      const fetchTable = async (table: string) => {
        let all: AdsData[] = [];
        let page = 0;
        let hasMore = true;
        const pageSize = 1000;

        while (hasMore) {
          const { data, error } = await supabase
            .from(table)
            .select('*')
            .range(page * pageSize, page * pageSize + pageSize - 1);

          if (error) break;

          if (data?.length) {
            all = [...all, ...data];
            if (data.length < pageSize) hasMore = false;
            else page++;
          } else {
            hasMore = false;
          }
        }
        return all;
      };

      const [meta, google] = await Promise.all([
        fetchTable('meta_ads'),
        fetchTable('google_ads')
      ]);

      setDataMeta(meta);
      setDataGoogle(google);
      setLoading(false);
    }

    fetchAll();
  }, []);

  const parse = (v: any) =>
    typeof v === 'string' ? parseFloat(v.replace(',', '.')) || 0 : parseFloat(v) || 0;

  // 🔥 FILTRO GLOBAL (APLICADO NOS DOIS)
  const filtrar = (dados: AdsData[], isGoogle = false) => {
    return dados.filter(item => {

      const dataCampo = isGoogle ? item.dataInicio : item.data_inicio;
      if (!dataCampo) return false;

      const str = dataCampo.substring(0, 10);

      let ok = false;

      if (dataInicio || dataFim) {
        ok = (!dataInicio || str >= dataInicio) && (!dataFim || str <= dataFim);
      } else {
        const dias = parseInt(periodoRapido);
        const hoje = new Date(); hoje.setHours(0,0,0,0);

        const fim = new Date(hoje);
        fim.setDate(hoje.getDate() - 1);

        const ini = new Date(hoje);
        ini.setDate(hoje.getDate() - dias);

        const fmt = (d: Date) =>
          `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

        ok = str >= fmt(ini) && str <= fmt(fim);
      }

      return ok;
    });
  };

  const metaFiltrado = filtrar(dataMeta, false);
  const googleFiltrado = filtrar(dataGoogle, true);

  // 🔥 RESUMO COMPARATIVO
  const resumo = useMemo(() => {

    const calc = (dados: AdsData[], isGoogle = false) => {
      const gasto = dados.reduce((a, c) =>
        a + parse(isGoogle ? c.gastoTotal : c.gasto), 0);

      const leads = dados.reduce((a, c) =>
        a + parse(isGoogle ? c.leadsTotal : c.leads), 0);

      const cpl = leads > 0 ? gasto / leads : 0;

      return { gasto, leads, cpl };
    };

    return {
      meta: calc(metaFiltrado),
      google: calc(googleFiltrado, true)
    };

  }, [metaFiltrado, googleFiltrado]);

  // 🔥 DADOS ATUAIS (para gráfico normal)
  const dadosAtuais = plataforma === 'meta_ads' ? metaFiltrado : googleFiltrado;

  const todosClientes = useMemo(() => {
    const nomes = [...new Set(dadosAtuais.map(i =>
      plataforma === 'google_ads' ? i.cliente : i.CLIENTE
    ))].filter(Boolean);

    return nomes.map(nome => {

      const regs = dadosAtuais.filter(d =>
        (plataforma === 'google_ads' ? d.cliente : d.CLIENTE) === nome
      );

      const gasto = regs.reduce((a, c) =>
        a + parse(plataforma === 'google_ads' ? c.gastoTotal : c.gasto), 0);

      const leads = regs.reduce((a, c) =>
        a + parse(plataforma === 'google_ads' ? c.leadsTotal : c.leads), 0);

      const cpl = leads > 0 ? gasto / leads : 0;

      return {
        nome,
        gasto,
        leads,
        cpl
      };

    }).sort((a, b) => b.gasto - a.gasto);

  }, [dadosAtuais, plataforma]);

  if (!isMounted) return null;

  return (
    <main style={S.page}>
      <div style={S.inner}>

        {/* HEADER */}
        <header style={S.header}>
          <div style={S.headerTop}>
            <Image src="/logo-empresa.png" alt="Logo" width={200} height={50} />
            <div style={S.platformSwitch}>
              <button onClick={() => setPlataforma('meta_ads')} style={S.btnMeta(plataforma === 'meta_ads')}>Meta Ads</button>
              <button onClick={() => setPlataforma('google_ads')} style={S.btnGoogle(plataforma === 'google_ads')}>Google Ads</button>
            </div>
          </div>

          {/* FILTRO DATA */}
          <div style={S.headerBottom}>
            <div style={{ display: 'flex', gap: '24px' }}>
              <div style={S.periodGroup}>
                {['1','7','14'].map(d => (
                  <button key={d} onClick={() => { setPeriodoRapido(d); setDataInicio(''); setDataFim(''); }}
                    style={S.btnPeriod(periodoRapido === d && !dataInicio && !dataFim)}>{d}D</button>
                ))}
              </div>

              <div style={S.dateGroup}>
                <input type="date" value={dataInicio} style={S.dateInput}
                  onChange={e => { setDataInicio(e.target.value); setPeriodoRapido(''); }} />
                <div style={S.dateDivider} />
                <input type="date" value={dataFim} style={S.dateInput}
                  onChange={e => { setDataFim(e.target.value); setPeriodoRapido(''); }} />
              </div>
            </div>

            {loading && <span style={S.loading}>SINCRONIZANDO...</span>}
          </div>
        </header>

        {/* 🔥 COMPARAÇÃO META VS GOOGLE */}
        <div style={S.cardsRow}>
          <div style={S.card}>
            <p style={S.cardLabel}>Meta Ads</p>
            <p>R$ {resumo.meta.gasto.toFixed(0)}</p>
            <p>{resumo.meta.leads} leads</p>
            <p>CPL R$ {resumo.meta.cpl.toFixed(2)}</p>
          </div>

          <div style={S.card}>
            <p style={S.cardLabel}>Google Ads</p>
            <p>R$ {resumo.google.gasto.toFixed(0)}</p>
            <p>{resumo.google.leads} leads</p>
            <p>CPL R$ {resumo.google.cpl.toFixed(2)}</p>
          </div>

          <div style={S.card}>
            <p style={S.cardLabel}>Insight</p>
            <p>
              {resumo.meta.cpl < resumo.google.cpl
                ? 'Meta mais barato'
                : 'Google mais qualificado'}
            </p>
          </div>
        </div>

        {/* GRID NORMAL */}
        <div style={S.grid}>
          <div style={S.gridLeft}>

            <div style={S.chartBox}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={todosClientes}>
                  <CartesianGrid stroke="#1f1433" />
                  <XAxis dataKey="nome" stroke="#fff" fontSize={10} angle={-45} textAnchor="end" />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} />

                  <Bar dataKey="leads" fill="#8b5cf6" />
                  <Bar dataKey="cpl" fill="#4b2a85" />
                  <Line dataKey="gasto" stroke="#10b981" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

          </div>
        </div>

      </div>
    </main>
  );
}
