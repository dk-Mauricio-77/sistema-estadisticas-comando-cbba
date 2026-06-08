import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  AlertTriangle, Activity, Printer, Filter, BarChart3, PieChart as PieChartIcon,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { API_BASE } from '../config/api';

const FILTROS = [
  { value: 'todos',    label: 'Todos' },
  { value: 'felcv',    label: 'FELCV' },
  { value: 'transito', label: 'Tránsito' },
  { value: 'diprove',  label: 'DIPROVE' },
];

const COLORS = ['#006847', '#F59E0B', '#3B82F6', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tipoFormulario, setTipoFormulario] = useState('todos');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `${API_BASE}/dashboard/estadisticas?tipo_formulario=${tipoFormulario}`
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
  const porZona = graficos?.por_zona || [];
  const porFormulario = graficos?.por_formulario || [];
  const dinamico = graficos?.dinamico;
  const esTodos = tipoFormulario === 'todos';

  const datosGraficoPrincipal = esTodos
    ? porFormulario.map((f) => ({ etiqueta: f.codigo, cantidad: f.cantidad }))
    : (dinamico?.datos || []).map((d) => ({ etiqueta: d.etiqueta, cantidad: d.cantidad }));

  const tituloGraficoPrincipal = esTodos
    ? 'Registros Validados por Formulario'
    : (dinamico?.titulo || 'Distribución Dinámica');

  const usarPie = !esTodos && dinamico?.tipo_grafico === 'pie' && datosGraficoPrincipal.length <= 6;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-extrabold text-policia-green tracking-tight">Panel de Control</h1>
          <p className="text-gray-500 font-medium text-sm">
            Estadísticas consolidadas — solo registros validados
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200 shadow-sm hover:border-policia-green transition-colors">
            <Filter size={18} className="text-policia-green" />
            <select
              value={tipoFormulario}
              onChange={(e) => setTipoFormulario(e.target.value)}
              className="bg-transparent border-none text-gray-700 font-bold focus:ring-0 cursor-pointer outline-none text-sm"
            >
              {FILTROS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-policia-green text-white px-5 py-2 rounded-xl shadow-lg shadow-green-900/20 hover:bg-green-800 transition-all print:hidden"
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

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Por zona */}
        <div className="bg-white p-6 rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6 border-l-4 border-policia-green pl-3">
            Incidentes por Zona
          </h3>
          <div className="h-[300px]">
            {porZona.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={porZona}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis dataKey="zona" axisLine={false} tickLine={false} fontSize={11} angle={-30} textAnchor="end" height={70} />
                  <YAxis axisLine={false} tickLine={false} fontSize={11} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="cantidad" fill="#006847" radius={[4, 4, 0, 0]} barSize={36} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message="Sin datos de zona para este filtro" />
            )}
          </div>
        </div>

        {/* Gráfico principal: por formulario (Todos) o dinámico JSONB (tipo específico) */}
        <div className="bg-white p-6 rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6 border-l-4 border-blue-500 pl-3 flex items-center gap-2">
            {usarPie ? <PieChartIcon size={20} /> : <BarChart3 size={20} />}
            {tituloGraficoPrincipal}
          </h3>
          <div className="h-[300px]">
            {datosGraficoPrincipal.length > 0 && datosGraficoPrincipal.some((d) => d.cantidad > 0) ? (
              usarPie ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={datosGraficoPrincipal}
                      dataKey="cantidad"
                      nameKey="etiqueta"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      innerRadius={55}
                      paddingAngle={4}
                      label={({ etiqueta, cantidad }) => `${etiqueta}: ${cantidad}`}
                    >
                      {datosGraficoPrincipal.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={datosGraficoPrincipal} layout={datosGraficoPrincipal.length > 5 ? 'vertical' : 'horizontal'}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    {datosGraficoPrincipal.length > 5 ? (
                      <>
                        <XAxis type="number" allowDecimals={false} />
                        <YAxis type="category" dataKey="etiqueta" width={120} fontSize={10} />
                      </>
                    ) : (
                      <>
                        <XAxis dataKey="etiqueta" fontSize={11} angle={-20} textAnchor="end" height={60} />
                        <YAxis allowDecimals={false} fontSize={11} />
                      </>
                    )}
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none' }} />
                    <Bar dataKey="cantidad" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              )
            ) : (
              <EmptyChart message={esTodos ? 'Sin registros validados' : 'Sin datos JSONB para graficar en este tipo'} />
            )}
          </div>
        </div>
      </div>

      {/* Tendencia mensual */}
      {graficos?.por_mes?.length > 0 && (
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6 border-l-4 border-amber-500 pl-3">
            Tendencia Mensual (Registros Validados)
          </h3>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={graficos.por_mes}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="etiqueta" fontSize={11} />
                <YAxis allowDecimals={false} fontSize={11} />
                <Tooltip />
                <Bar dataKey="cantidad" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

const EmptyChart = ({ message }) => (
  <div className="flex items-center justify-center h-full text-gray-400 text-sm">{message}</div>
);

const KpiCard = ({ title, value, icon, color }) => (
  <div className="bg-white p-6 rounded-2xl shadow-lg shadow-gray-200/40 border border-gray-100 flex items-center justify-between transition-transform hover:-translate-y-1">
    <div>
      <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
      <p className="text-3xl font-black text-gray-800">{value}</p>
    </div>
    <div className={`p-4 rounded-xl shadow-lg ${color} text-white`}>{icon}</div>
  </div>
);

export default Dashboard;
