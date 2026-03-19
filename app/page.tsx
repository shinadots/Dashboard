"use client";
import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell, LabelList
} from 'recharts';
import Image from 'next/image';

interface AdsData { [key: string]: any; }

export default function Dashboard() {
  const [data, setData] = useState<AdsData[]>([]);
  const [plataforma, setPlataforma] = useState<'meta_ads' | 'google_ads'>('meta_ads');
  const [aba, setAba] = useState<'normal' | 'comparacao'>('normal');
  const [gestorAtivo, setGestorAtivo] = useState('Todos');
  const [periodoRapido, setPeriodoRapido] = useState('7');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [loading, setLoading] = useState(false);

  const cols = useMemo(() => {
    if (plataforma === 'google_ads') {
      return { cliente: 'cliente', gestor: 'gestor', gasto: 'gastoTotal', leads: 'leadsTotal', data: 'dataInicio' };
    }
    return { cliente: 'CLIENTE', gestor: 'Gestor', gasto: 'gasto', leads: 'leads', data: 'data_inicio' };
  }, [plataforma]);

  useEffect(() => {
    setIsMounted(true);
    async function fetchData() {
      setLoading(true);
      const { data } = await supabase.from(plataforma).select('*');
      setData(data || []);
      setLoading(false);
    }
    fetchData();
  }, [plataforma]);

  const parse = (v: any) =>
    typeof v === 'string' ? parseFloat(v.replace(',', '.')) || 0 : parseFloat(v) || 0;

  // =============================
  // 🔥 COMPARAÇÃO SEMANAL
  // =============================
  const comparacaoSemanal = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0,0,0,0);

    const inicioAtual = new Date(hoje);
    inicioAtual.setDate(hoje.getDate() - 7);

    const inicioAnterior = new Date(hoje);
    inicioAnterior.setDate(hoje.getDate() - 14);

    const semanaAtual = data.filter(item => {
      const d = item[cols.data]?.substring(0,10);
      return d >= inicioAtual.toISOString().slice(0,10);
    });

    const semanaAnterior = data.filter(item => {
      const d = item[cols.data]?.substring(0,10);
      return d >= inicioAnterior.toISOString().slice(0,10)
          && d < inicioAtual.toISOString().slice(0,10);
    });

    const clientes = [...new Set(data.map(i => i[cols.cliente]))];

    return clientes.map(nome => {
      const atual = semanaAtual.filter(i => i[cols.cliente] === nome);
      const anterior = semanaAnterior.filter(i => i[cols.cliente] === nome);

      const gastoAtual = atual.reduce((a,c)=>a+parse(c[cols.gasto]),0);
      const leadsAtual = atual.reduce((a,c)=>a+parse(c[cols.leads]),0);

      const gastoAnterior = anterior.reduce((a,c)=>a+parse(c[cols.gasto]),0);
      const leadsAnterior = anterior.reduce((a,c)=>a+parse(c[cols.leads]),0);

      const cplAtual = leadsAtual ? gastoAtual / leadsAtual : 0;
      const cplAnterior = leadsAnterior ? gastoAnterior / leadsAnterior : 0;

      const variacaoCPL = cplAnterior ? ((cplAtual - cplAnterior)/cplAnterior)*100 : 0;
      const variacaoLeads = leadsAnterior ? ((leadsAtual - leadsAnterior)/leadsAnterior)*100 : 0;

      return {
        nome,
        variacaoCPL,
        variacaoLeads
      };
    });
  }, [data, cols]);

  if (!isMounted) return null;

  return (
    <main style={{ padding: 24, background: '#0a051a', color: '#fff', minHeight: '100vh' }}>
      
      {/* HEADER */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <button onClick={() => setPlataforma('meta_ads')}>Meta</button>
        <button onClick={() => setPlataforma('google_ads')}>Google</button>
        <button onClick={() => setAba('normal')}>Dashboard</button>
        <button onClick={() => setAba('comparacao')}>Comparação</button>
      </div>

      {/* =========================
          ABA NORMAL (SEU DASH)
         ========================= */}
      {aba === 'normal' && (
        <div>
          <h2>Dashboard normal (igual ao seu)</h2>
        </div>
      )}

      {/* =========================
          ABA COMPARAÇÃO
         ========================= */}
      {aba === 'comparacao' && (
        <div>
          <h2>Comparação Semanal</h2>

          {comparacaoSemanal.map(c => (
            <div key={c.nome} style={{
              padding: 12,
              border: '1px solid #333',
              marginBottom: 10,
              borderRadius: 10
            }}>
              <b>{c.nome}</b><br/>

              CPL:
              <span style={{ color: c.variacaoCPL > 0 ? 'red' : 'green' }}>
                {c.variacaoCPL.toFixed(1)}%
              </span>

              <br/>

              Leads:
              <span style={{ color: c.variacaoLeads > 0 ? 'green' : 'red' }}>
                {c.variacaoLeads.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
