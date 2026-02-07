import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { AlertTriangle, CheckCircle, Activity, Printer, Filter, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState('todos'); // Valor por defecto: muestra todos los registros

  /**
   * Efecto que se ejecuta cuando cambia el filtro de período
   * Realiza una petición al servidor para obtener los datos del dashboard
   */
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`http://localhost:3001/api/analitica/dashboard?periodo=${periodo}`);
        setData(response.data);
      } catch (err) {
        console.error("Error conectando al dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [periodo]);

  if (loading) return (
    <div className="flex items-center justify-center h-full min-h-screen bg-gray-100">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-policia-green"></div>
        <p className="text-policia-green font-bold animate-pulse">Procesando Estadísticas...</p>
      </div>
    </div>
  );

  const { kpis, graficos } = data;
  const COLORS = ['#006847', '#F59E0B', '#3B82F6', '#EF4444'];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Encabezado del panel de control */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-extrabold text-policia-green tracking-tight">Panel de Control</h1>
          <p className="text-gray-500 font-medium text-sm">Resumen de actividad delictual</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          {/* Selector de filtro por período temporal */}
          <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200 shadow-sm hover:border-policia-green transition-colors">
            <Calendar size={18} className="text-policia-green" />
            <select 
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
              className="bg-transparent border-none text-gray-700 font-bold focus:ring-0 cursor-pointer outline-none text-sm"
            >
              <option value="todos">HISTÓRICO TOTAL</option>
              <option value="hoy">HOY (24h)</option>
              <option value="semana">ESTA SEMANA</option>
              <option value="mes">ESTE MES</option>
              <option value="anio">ESTE AÑO</option>
            </select>
          </div>

          {/* Botón para generar reporte en formato PDF */}
          <button 
            onClick={() => window.print()} 
            className="flex items-center gap-2 bg-policia-green text-white px-5 py-2 rounded-xl shadow-lg shadow-green-900/20 hover:bg-green-800 transition-all hover:scale-105 active:scale-95 print:hidden"
          >
            <Printer size={18} />
            <span className="font-bold text-sm">PDF</span>
          </button>
        </div>
      </header>

      {/* Tarjetas de indicadores clave de rendimiento (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard 
          title="TOTAL INCIDENTES" 
          value={kpis.total_incidentes} 
          icon={<AlertTriangle className="text-white" size={24} />} 
          color="bg-gradient-to-br from-blue-500 to-blue-600"
        />
        <KpiCard 
          title="CASOS RESUELTOS" 
          value={kpis.casos_resueltos} 
          icon={<CheckCircle className="text-white" size={24} />} 
          color="bg-gradient-to-br from-emerald-500 to-emerald-600"
        />
        <KpiCard 
          title="EFICACIA" 
          value={kpis.eficacia} 
          icon={<Activity className="text-white" size={24} />} 
          color="bg-gradient-to-br from-violet-500 to-violet-600"
        />
      </div>

      {/* Sección de visualizaciones gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de barras: distribución de incidentes por zona geográfica */}
        <div className="bg-white p-6 rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6 border-l-4 border-policia-green pl-3">Incidentes por Zona</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={graficos.por_zona}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="zona" axisLine={false} tickLine={false} dy={10} fontSize={11} />
                <YAxis axisLine={false} tickLine={false} fontSize={11} allowDecimals={false} />
                <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}/>
                <Bar dataKey="cantidad" fill="#006847" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de tipo dona: distribución porcentual de incidentes por tipo */}
        <div className="bg-white p-6 rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6 border-l-4 border-blue-500 pl-3">Distribución por Tipo</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={graficos.por_tipo} 
                  dataKey="cantidad" 
                  nameKey="tipo_hecho" 
                  cx="50%" cy="50%" 
                  outerRadius={100} 
                  innerRadius={60}
                  paddingAngle={5}
                >
                  {graficos.por_tipo.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Componente KpiCard - Tarjeta de indicador clave de rendimiento
 * @param {string} title - Título del indicador
 * @param {string|number} value - Valor del indicador
 * @param {ReactNode} icon - Icono a mostrar
 * @param {string} color - Clases CSS para el color de fondo del icono
 */
const KpiCard = ({ title, value, icon, color }) => (
  <div className="bg-white p-6 rounded-2xl shadow-lg shadow-gray-200/40 border border-gray-100 flex items-center justify-between transition-transform hover:-translate-y-1">
    <div>
      <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
      <p className="text-3xl font-black text-gray-800">{value}</p>
    </div>
    <div className={`p-4 rounded-xl shadow-lg ${color} text-white`}>
      {icon}
    </div>
  </div>
);

export default Dashboard;