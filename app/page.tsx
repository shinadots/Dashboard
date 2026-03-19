"use client";
import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts';
import Image from 'next/image';

interface AdsData { [key: string]: any; }

// 🔥 SEU STYLE ORIGINAL (mantido seguro)
const S = {
  page: { minHeight: '100vh', padding: '24px', backgroundColor: '#0a051a', color: '#faf5ff', fontFamily: 'sans-serif' },
  inner: { maxWidth: '1800px', margin: '0 auto' },
  header: { display: 'flex', flexDirection: 'column' as const, gap: '24px', marginBottom: '48px' },
  headerTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' as const, gap: '16px' },
  headerBottom: { display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' as const },
  platformSwitch: { display: 'flex', background: '#2e1065', padding: '4px', borderRadius: '12px' },
  btnMeta: (a: boolean) => ({ padding: '8px 20px', borderRadius: '8px', background: a ? '#2563eb' : 'transparent', color: a ? '#fff' : '#a855f7', border: 'none', cursor: 'pointer' }),
  btnGoogle: (a: boolean) => ({ padding: '8px 20px', borderRadius: '8px', background: a ? '#eab308' : 'transparent', color: a ? '#000' : '#a855f7', border: 'none', cursor: 'pointer' }),
  cardsRow: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' },
  card: { background: '#1e1b4b', padding: '20px', borderRadius: '16px', textAlign: 'center' as const },
  chartBox: { height: '500px', background: '#0f0b2e', borderRadius: '20px', padding: '20px' }
};

const parse = (v: any) =>
  typeof v === 'string' ? parseFloat(v.replace(',', '.')) || 0 : Number(v) || 0;

export default function Dashboard() {

  const [metaData, setMetaData] = useState<AdsData[]>([]);
  const [googleData, setGoogleData] = useState<AdsData[]>([]);
  const [plataforma, setPlataforma] = useState<'meta_ads' | 'google_ads'>('meta_ads');

  const [periodoRapido, setPeriodoRapido] = useState('7');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [loading, setLoading] = useState(false);

  // 🔥 FETCH SEGURO
  useEffect(() => {
    async function fetchAll() {
      setLoading(true);

      const fetchTable = async (table: string) => {
        try {
          const { data } = await supabase.from(table).select('*');
          return data || [];
        } catch {
          return [];
        }
      };

      const [meta, google] = await Promise.all([
        fetchTable('meta_ads'),
        fetchTable('google_ads')
      ]);

      setMetaData(meta);
      setGoogleData(google);
      setLoading(false);
    }

    fetchAll();
  }, []);

  // 🔥 FILTRO
  const filtrar = (dados: AdsData[], isGoogle = false) => {
    return dados.filter(item => {
      const dataCampo = isGoogle ? item.dataInicio : item.data_inicio;
      if (!dataCampo) return false;

      const str = String(dataCampo).substring(0, 10);

      if (dataInicio || dataFim) {
        return (!dataInicio || str >= dataInicio) &&
               (!dataFim || str <= dataFim);
      }

      const dias = parseInt(periodoRapido || '7');
      const hoje = new Date();
      const inicio = new Date();
      inicio.setDate(hoje.getDate() - dias);

      return str >= inicio.toISOString().slice(0,10);
    });
  };

  const metaFiltrado = filtrar(metaData);
  const googleFiltrado = filtrar(googleData, true);

  // 🔥 RESUMO
  const resumo = useMemo(() => {

    const calc = (dados: AdsData[], isGoogle = false) => {
      const gasto = dados.reduce((a, c) =>
        a + parse(isGoogle ? c.gastoTotal : c.gasto), 0);

      const leads = dados.reduce((a, c) =>
        a + parse(isGoogle ? c.leadsTotal : c.leads), 0);

      return {
        gasto,
        leads,
        cpl: leads > 0 ? gasto / leads : 0
      };
    };

    return {
      meta: calc(metaFiltrado),
      google: calc(googleFiltrado, true)
    };

  }, [metaFiltrado, googleFiltrado]);

  // 🔥 DADOS GRÁFICO
  const dadosAtuais = plataforma === 'meta_ads' ? metaFiltrado : googleFiltrado;

  const clientes = useMemo(() => {
    const keyCliente = plataforma === 'google_ads' ? 'cliente' : 'CLIENTE';

    const nomes = [...new Set(dadosAtuais.map(i => i[keyCliente]))];

    return nomes.map(nome => {
      const regs = dadosAtuais.filter(d => d[keyCliente] === nome);

      const gasto = regs.reduce((a, c) =>
        a + parse(plataforma === 'google_ads' ? c.gastoTotal : c.gasto), 0);

      const leads = regs.reduce((a, c) =>
        a + parse(plataforma === 'google_ads' ? c.leadsTotal : c.leads), 0);

      return {
        nome,
        gasto,
        leads,
        cpl: leads > 0 ? gasto / leads : 0
      };

    }).sort((a, b) => b.gasto - a.gasto);

  }, [dadosAtuais, plataforma]);

  return (
    <main style={S.page}>
      <div style={S.inner}>

        {/* HEADER */}
        <div style={S.header}>
          <div style={S.headerTop}>
            <Image src="/logo-empresa.png" alt="Logo" width={180} height={50} />
            <div style={S.platformSwitch}>
              <button onClick={() => setPlataforma('meta_ads')} style={S.btnMeta(plataforma === 'meta_ads')}>Meta</button>
              <button onClick={() => setPlataforma('google_ads')} style={S.btnGoogle(plataforma === 'google_ads')}>Google</button>
            </div>
          </div>

          <div style={S.headerBottom}>
            <div>
              <button onClick={() => setPeriodoRapido('7')}>7D</button>
              <button onClick={() => setPeriodoRapido('14')}>14D</button>
            </div>

            {loading && <span>Carregando...</span>}
          </div>
        </div>

        {/* 🔥 COMPARAÇÃO */}
        <div style={S.cardsRow}>
          <div style={S.card}>
            <p>Meta</p>
            <p>R$ {resumo.meta.gasto.toFixed(0)}</p>
            <p>{resumo.meta.leads} leads</p>
            <p>CPL R$ {resumo.meta.cpl.toFixed(2)}</p>
          </div>

          <div style={S.card}>
            <p>Google</p>
            <p>R$ {resumo.google.gasto.toFixed(0)}</p>
            <p>{resumo.google.leads} leads</p>
            <p>CPL R$ {resumo.google.cpl.toFixed(2)}</p>
          </div>

          <div style={S.card}>
            <p>Insight</p>
            <p>
              {resumo.meta.cpl < resumo.google.cpl
                ? 'Meta mais barato'
                : 'Google melhor qualidade'}
            </p>
          </div>
        </div>

        {/* GRÁFICO */}
        <div style={S.chartBox}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={clientes}>
              <CartesianGrid stroke="#222" />
              <XAxis dataKey="nome" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="leads" />
              <Bar dataKey="cpl" />
              <Line dataKey="gasto" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

      </div>
    </main>
  );
}
