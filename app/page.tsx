"use client";
import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts';
import Image from 'next/image';

type Plataforma = 'meta_ads' | 'google_ads' | 'comparacao';

export default function Dashboard() {

  const [data, setData] = useState<any[]>([]);
  const [plataforma, setPlataforma] = useState<Plataforma>('meta_ads');
  const [loading, setLoading] = useState(false);

  const cols = {
    cliente: 'CLIENTE',
    gasto: 'gasto',
    leads: 'leads',
    data: 'data_inicio',
  };

  // =============================
  // FETCH (sempre puxa meta_ads)
  // =============================
  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      const { data } = await supabase
        .from('meta_ads')
        .select('*')
        .not('CLIENTE', 'is', null);

      setData(data || []);
      setLoading(false);
    }

    fetchData();
  }, []);

  // =============================
  // COMPARAÇÃO SEMANAL
  // =============================
  const comparacao = useMemo(() => {

    const parse = (v: any) =>
      typeof v === 'string' ? parseFloat(v.replace(',', '.')) || 0 : parseFloat(v) || 0;

    const hoje = new Date();
    hoje.setHours(0,0,0,0);

    const inicioSemanaAtual = new Date(hoje);
    inicioSemanaAtual.setDate(hoje.getDate() - 7);

    const inicioSemanaAnterior = new Date(hoje);
    inicioSemanaAnterior.setDate(hoje.getDate() - 14);

    const atual = data.filter(d => {
      const dt = new Date(d[cols.data]);
      return dt >= inicioSemanaAtual;
    });

    const anterior = data.filter(d => {
      const dt = new Date(d[cols.data]);
      return dt >= inicioSemanaAnterior && dt < inicioSemanaAtual;
    });

    const agrupar = (arr: any[]) => {
      const map: any = {};

      arr.forEach(item => {
        const nome = item[cols.cliente]?.trim();
        if (!map[nome]) map[nome] = { gasto: 0, leads: 0 };

        map[nome].gasto += parse(item[cols.gasto]);
        map[nome].leads += parse(item[cols.leads]);
      });

      return map;
    };

    const atualMap = agrupar(atual);
    const anteriorMap = agrupar(anterior);

    return Object.keys(atualMap).map(nome => {

      const a = atualMap[nome] || { gasto: 0, leads: 0 };
      const b = anteriorMap[nome] || { gasto: 0, leads: 0 };

      const cplAtual = a.leads > 0 ? a.gasto / a.leads : 0;
      const cplAnterior = b.leads > 0 ? b.gasto / b.leads : 0;

      const variacaoCPL = cplAnterior > 0
        ? ((cplAtual - cplAnterior) / cplAnterior) * 100
        : 0;

      const variacaoLeads = b.leads > 0
        ? ((a.leads - b.leads) / b.leads) * 100
        : 0;

      return {
        nome,
        cplAtual,
        variacaoCPL,
        variacaoLeads,
      };
    });

  }, [data]);

  // =============================
  // UI
  // =============================
  return (
    <main className="min-h-screen bg-[#0a051a] text-white p-8">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-10">
        <Image src="/logo-empresa.png" width={160} height={40} alt="logo" />

        <div className="flex gap-2 bg-purple-900/40 p-1 rounded-xl">
          <button onClick={() => setPlataforma('meta_ads')} className={`px-4 py-2 text-xs font-bold ${plataforma === 'meta_ads' ? 'bg-blue-600' : ''}`}>Meta</button>
          <button onClick={() => setPlataforma('google_ads')} className={`px-4 py-2 text-xs font-bold ${plataforma === 'google_ads' ? 'bg-yellow-500 text-black' : ''}`}>Google</button>
          <button onClick={() => setPlataforma('comparacao')} className={`px-4 py-2 text-xs font-bold ${plataforma === 'comparacao' ? 'bg-purple-600' : ''}`}>Comparação</button>
        </div>
      </div>

      {loading && <p>Carregando...</p>}

      {/* ========================= */}
      {/* ABA COMPARAÇÃO */}
      {/* ========================= */}
      {plataforma === 'comparacao' && (
        <div className="space-y-10">

          {/* CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            <div className="bg-purple-900/10 p-6 rounded-2xl text-center">
              <p className="text-xs text-purple-400">Clientes analisados</p>
              <p className="text-3xl font-bold">{comparacao.length}</p>
            </div>

            <div className="bg-purple-900/10 p-6 rounded-2xl text-center">
              <p className="text-xs text-purple-400">CPL Médio %</p>
              <p className="text-3xl font-bold">
                {(
                  comparacao.reduce((acc, c) => acc + c.variacaoCPL, 0) / (comparacao.length || 1)
                ).toFixed(1)}%
              </p>
            </div>

            <div className="bg-purple-900/10 p-6 rounded-2xl text-center">
              <p className="text-xs text-purple-400">Leads Médio %</p>
              <p className="text-3xl font-bold">
                {(
                  comparacao.reduce((acc, c) => acc + c.variacaoLeads, 0) / (comparacao.length || 1)
                ).toFixed(1)}%
              </p>
            </div>

          </div>

          {/* GRÁFICO */}
          <div className="bg-purple-900/5 p-8 rounded-3xl h-[500px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparacao}>
                <CartesianGrid stroke="#1f1433" />
                <XAxis dataKey="nome" fontSize={10} angle={-45} textAnchor="end" />
                <YAxis />
                <Tooltip />

                <Bar dataKey="variacaoCPL" fill="#ef4444" name="CPL %" />
                <Bar dataKey="variacaoLeads" fill="#10b981" name="Leads %" />
              </BarChart>
            </ResponsiveContainer>
          </div>

        </div>
      )}

    </main>
  );
}
