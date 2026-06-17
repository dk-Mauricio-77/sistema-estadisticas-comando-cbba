import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  AlertTriangle, Activity, Printer, Filter, BarChart3, PieChart as PieChartIcon,
  Users, Shield, Car,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { API_BASE } from '../config/api';
import { getAllForms } from '../config/formsConfig';

const COLORS = ['#006847', '#F59E0B', '#3B82F6', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];
const SEVERIDAD_COLORS = { 'Solo Daños': '#3B82F6', 'Con Heridos': '#F59E0B', 'Con Fallecidos': '#EF4444' };
const SOAT_COLORS = { 'SÍ': '#006847', 'NO': '#EF4444' };

const PRINT_STYLES = `
  @media print {
    @page {
      size: A4 landscape;
      margin: 10mm;
    }

    aside,
    .no-print {
      display: none !important;
    }

    body, html {
      background: white !important;
      overflow: visible !important;
    }

    .flex.h-screen {
      display: block !important;
      height: auto !important;
      overflow: visible !important;
    }

    main {
      overflow: visible !important;
      width: 100% !important;
    }

    .dashboard-print-root {
      max-width: 100% !important;
      width: 100% !important;
      padding: 0 !important;
      margin: 0 !important;
      background: white !important;
    }

    .print-only {
      display: block !important;
    }

    .chart-card {
      break-inside: avoid;
      page-break-inside: avoid;
      box-shadow: none !important;
      border: 1px solid #e5e7eb !important;
    }

    .recharts-wrapper,
    .recharts-surface,
    .recharts-layer,
    svg {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }

    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
  }

  @media screen {
    .print-only {
      display: none !important;
    }
  }
`;

const Dashboard = () => {
  const [data, setData]                   = useState(null);
  const [loading, setLoading]             = useState(true);
  const [tipoFormulario, setTipoFormulario] = useState('todos');
  const [filtros, setFiltros]             = useState([{ value: 'todos', label: 'Todos los formularios' }]);

  useEffect(() => {
    const forms = getAllForms();
    const opciones = [
      { value: 'todos', label: 'Todos los formularios' },
      ...forms.map(f => ({
        value: f.codigo.replace(/^FORM\.\s*/i, '').trim(),
        label: `${f.codigo.replace(/^FORM\.\s*/i, '').trim()} — ${f.nombre}`,
      })),
    ];
    setFiltros(opciones);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `${API_BASE}/dashboard/estadisticas?tipo_formulario=${tipoFormulario}`,
        );
        setData(response.data);
      } catch (err) {
        console.error('Error al cargar dashboard:', err);
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [tipoFormulario]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen bg-gray-100">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-policia-green" />
          <p className="text-policia-green font-bold animate-pulse">Procesando Estadísticas...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full min-h-screen bg-gray-100">
        <p className="text-gray-500">No se pudieron cargar los datos del dashboard</p>
      </div>
    );
  }

  const { kpis, graficos } = data;
  const porZona       = graficos?.por_zona     || [];
  const porFormulario = graficos?.por_formulario || [];
  const dinamico      = graficos?.dinamico;
  const transito03a   = graficos?.transito_03a;
  const esTodos       = tipoFormulario === 'todos';
  const es03A         = tipoFormulario.toUpperCase() === '03A' && !!transito03a;

  const datosGraficoPrincipal = esTodos
    ? porFormulario.map(f => ({ etiqueta: f.codigo, cantidad: f.cantidad }))
    : (dinamico?.datos || []).map(d => ({ etiqueta: d.etiqueta, cantidad: d.cantidad }));

  const tituloGraficoPrincipal = esTodos
    ? 'Registros Validados por Formulario'
    : (dinamico?.titulo || 'Distribución Dinámica');

  const usarPie = !esTodos && dinamico?.tipo_grafico === 'pie' && datosGraficoPrincipal.length <= 6;

  const etiquetaActiva = filtros.find(f => f.value === tipoFormulario)?.label || tipoFormulario;
  const fechaReporte = new Date().toLocaleDateString('es-BO', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <>
      <style>{PRINT_STYLES}</style>

      <div className="dashboard-print-root p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
        <div className="print-only text-center border-b border-gray-300 pb-4 mb-2">
          <h1 className="text-xl font-extrabold text-policia-green uppercase tracking-wide">
            Comando Departamental de Policía — Cochabamba
          </h1>
          <p className="text-sm text-gray-600 font-medium mt-1">
            Informe Estadístico — {etiquetaActiva} — {fechaReporte}
          </p>
        </div>

        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-3xl font-extrabold text-policia-green tracking-tight">Panel de Control</h1>
            <p className="text-gray-500 font-medium text-sm">
              {esTodos
                ? 'Estadísticas consolidadas — solo registros validados'
                : `Filtrando: ${etiquetaActiva}`}
            </p>
          </div>

          <div className="flex flex-wrap gap-3 no-print">
            <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200 shadow-sm hover:border-policia-green transition-colors">
              <Filter size={18} className="text-policia-green shrink-0" />
              <select
                value={tipoFormulario}
                onChange={(e) => setTipoFormulario(e.target.value)}
                className="bg-transparent border-none text-gray-700 font-bold focus:ring-0 cursor-pointer outline-none text-sm max-w-[420px]"
              >
                {filtros.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-2 bg-policia-green text-white px-5 py-2 rounded-xl shadow-lg shadow-green-900/20 hover:bg-green-800 transition-all"
            >
              <Printer size={18} />
              <span className="font-bold text-sm">PDF</span>
            </button>
          </div>
        </header>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard
            title="REGISTROS VALIDADOS"
            value={kpis?.total_registros ?? 0}
            icon={<BarChart3 className="text-white" size={24} />}
            color="bg-gradient-to-br from-blue-500 to-blue-600"
          />
          <KpiCard
            title="TOTAL CASOS"
            value={kpis?.total_casos ?? 0}
            icon={<Activity className="text-white" size={24} />}
            color="bg-gradient-to-br from-violet-500 to-violet-600"
          />
          <KpiCard
            title="TOTAL HERIDOS"
            value={kpis?.total_heridos ?? 0}
            icon={<AlertTriangle className="text-white" size={24} />}
            color="bg-gradient-to-br from-orange-500 to-orange-600"
          />
          <KpiCard
            title="TOTAL MUERTOS"
            value={kpis?.total_muertos ?? 0}
            icon={<AlertTriangle className="text-white" size={24} />}
            color="bg-gradient-to-br from-red-500 to-red-600"
          />
        </div>

        {/* Gráficos generales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard title="Incidentes por Zona" accent="border-policia-green">
            <BarChartSimple data={porZona} dataKey="zona" fill="#006847" emptyMessage="Sin datos de zona para este filtro" />
          </ChartCard>

          <ChartCard
            title={tituloGraficoPrincipal}
            accent="border-blue-500"
            icon={usarPie ? <PieChartIcon size={20} /> : <BarChart3 size={20} />}
          >
            {datosGraficoPrincipal.length > 0 && datosGraficoPrincipal.some(d => d.cantidad > 0) ? (
              usarPie ? (
                <PieChartDonut data={datosGraficoPrincipal} />
              ) : (
                <BarChartAdaptive data={datosGraficoPrincipal} fill="#3B82F6" />
              )
            ) : (
              <EmptyChart message={esTodos ? 'Sin registros validados' : 'Sin datos para graficar en este tipo'} />
            )}
          </ChartCard>
        </div>

        {/* Panel analítico extendido — Formulario 03A Tránsito */}
        {es03A && (
          <section className="space-y-6">
            <div className="bg-policia-green/5 border border-policia-green/20 rounded-2xl px-6 py-4">
              <h2 className="text-xl font-extrabold text-policia-green flex items-center gap-2">
                <Car size={22} />
                Análisis Estadístico — Formulario 03A (Hechos de Tránsito)
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Métricas extraídas de datos_especificos — registros con estado validado
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard title="Clasificación del Hecho" accent="border-policia-green">
                <BarChartAdaptive data={transito03a.clasificacion_hecho} fill="#006847" />
              </ChartCard>

              <ChartCard title="Severidad del Caso" accent="border-red-500" icon={<AlertTriangle size={20} />}>
                <PieChartDonut
                  data={transito03a.severidad}
                  colorMap={SEVERIDAD_COLORS}
                />
              </ChartCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard title="Causas del Hecho" accent="border-amber-500">
                <BarChartAdaptive data={transito03a.causas} fill="#F59E0B" vertical />
              </ChartCard>

              <ChartCard title="Estado de la Vía" accent="border-blue-500">
                <BarChartSimple data={transito03a.estado_via} dataKey="etiqueta" fill="#3B82F6" />
              </ChartCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <ChartCard title="Control SOAT" accent="border-policia-green" icon={<Shield size={20} />}>
                <PieChartDonut
                  data={transito03a.soat}
                  colorMap={SOAT_COLORS}
                  innerRadius={50}
                />
              </ChartCard>

              <ChartCard title="Género del Conductor" accent="border-violet-500" icon={<Users size={20} />}>
                <PieChartDonut data={transito03a.sexo} />
              </ChartCard>

              <ChartCard title="Rangos de Edad" accent="border-teal-500">
                <BarChartSimple data={transito03a.rangos_edad} dataKey="etiqueta" fill="#14B8A6" />
              </ChartCard>
            </div>
          </section>
        )}

        {/* Tendencia mensual */}
        {graficos?.por_mes?.length > 0 && (
          <ChartCard title="Tendencia Mensual (Registros Validados)" accent="border-amber-500">
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={graficos.por_mes}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis dataKey="etiqueta" fontSize={11} />
                  <YAxis allowDecimals={false} fontSize={11} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
                  <Bar dataKey="cantidad" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        )}
      </div>
    </>
  );
};

const ChartCard = ({ title, accent, icon, children }) => (
  <div className={`chart-card bg-white p-6 rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100`}>
    <h3 className={`text-lg font-bold text-gray-800 mb-6 border-l-4 ${accent} pl-3 flex items-center gap-2`}>
      {icon}
      {title}
    </h3>
    <div className="h-[300px]">{children}</div>
  </div>
);

const EmptyChart = ({ message }) => (
  <div className="flex items-center justify-center h-full text-gray-400 text-sm">{message}</div>
);

const BarChartSimple = ({ data, dataKey = 'etiqueta', fill, emptyMessage }) => {
  if (!data?.length) return <EmptyChart message={emptyMessage || 'Sin datos disponibles'} />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
        <XAxis dataKey={dataKey} axisLine={false} tickLine={false} fontSize={11} angle={-25} textAnchor="end" height={70} />
        <YAxis axisLine={false} tickLine={false} fontSize={11} allowDecimals={false} />
        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
        <Bar dataKey="cantidad" fill={fill} radius={[4, 4, 0, 0]} barSize={36} />
      </BarChart>
    </ResponsiveContainer>
  );
};

const BarChartAdaptive = ({ data, fill, vertical }) => {
  if (!data?.length) return <EmptyChart message="Sin datos disponibles" />;
  const usarVertical = vertical || data.length > 5;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout={usarVertical ? 'vertical' : 'horizontal'}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        {usarVertical ? (
          <>
            <XAxis type="number" allowDecimals={false} fontSize={11} />
            <YAxis type="category" dataKey="etiqueta" width={140} fontSize={10} />
          </>
        ) : (
          <>
            <XAxis dataKey="etiqueta" fontSize={11} angle={-20} textAnchor="end" height={60} />
            <YAxis allowDecimals={false} fontSize={11} />
          </>
        )}
        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
        <Bar dataKey="cantidad" fill={fill} radius={[4, 4, 0, 0]} barSize={32} />
      </BarChart>
    </ResponsiveContainer>
  );
};

const PieChartDonut = ({ data, colorMap, innerRadius = 55 }) => {
  if (!data?.length) return <EmptyChart message="Sin datos disponibles" />;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          dataKey="cantidad"
          nameKey="etiqueta"
          cx="50%"
          cy="50%"
          outerRadius={100}
          innerRadius={innerRadius}
          paddingAngle={4}
          label={({ etiqueta, cantidad }) => `${etiqueta}: ${cantidad}`}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${entry.etiqueta}`}
              fill={colorMap?.[entry.etiqueta] || COLORS[index % COLORS.length]}
              stroke="none"
            />
          ))}
        </Pie>
        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
        <Legend verticalAlign="bottom" height={36} iconType="circle" />
      </PieChart>
    </ResponsiveContainer>
  );
};

const KpiCard = ({ title, value, icon, color }) => (
  <div className="chart-card bg-white p-6 rounded-2xl shadow-lg shadow-gray-200/40 border border-gray-100 flex items-center justify-between transition-transform hover:-translate-y-1">
    <div>
      <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
      <p className="text-3xl font-black text-gray-800">{value}</p>
    </div>
    <div className={`p-4 rounded-xl shadow-lg ${color} text-white`}>{icon}</div>
  </div>
);

export default Dashboard;
