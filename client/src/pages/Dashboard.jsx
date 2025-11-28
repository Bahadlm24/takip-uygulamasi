import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { format, parseISO, subDays, subWeeks, subMonths, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Calendar, TrendingUp, DollarSign, Users, PieChart as PieChartIcon } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Dashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [period, setPeriod] = useState('weekly'); // daily, weekly, monthly, 2months, 3months, yearly
  const [stats, setStats] = useState({
    totalRevenue: 0,
    appointmentCount: 0,
    customerCount: 0,
    cashTotal: 0,
    cardTotal: 0
  });
  const [chartData, setChartData] = useState({
    labels: [],
    revenue: [],
    appointments: []
  });

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    try {
      const [appointmentsData, contactsData] = await Promise.all([
        api.getAppointments(),
        api.getContacts()
      ]);

      setAppointments(appointmentsData);
      setContacts(contactsData);
      
      processData(appointmentsData, contactsData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const getDateRange = () => {
    const now = new Date();
    switch (period) {
      case 'daily':
        return { start: subDays(now, 7), end: now, days: 7 };
      case 'weekly':
        return { start: subWeeks(now, 4), end: now, weeks: 4 };
      case 'monthly':
        return { start: subMonths(now, 6), end: now, months: 6 };
      case '2months':
        return { start: subMonths(now, 2), end: now, days: 60 };
      case '3months':
        return { start: subMonths(now, 3), end: now, weeks: 12 };
      case 'yearly':
        return { start: subMonths(now, 12), end: now, months: 12 };
      default:
        return { start: subWeeks(now, 4), end: now, weeks: 4 };
    }
  };

  const processData = (appointmentsData, contactsData) => {
    const { start, end } = getDateRange();
    
    const filteredAppointments = appointmentsData.filter(app => {
      const appDate = parseISO(app.date);
      return isWithinInterval(appDate, { start: startOfDay(start), end: endOfDay(end) });
    });

    // Calculate stats
    const totalRevenue = filteredAppointments.reduce((sum, app) => sum + (Number(app.amount) || 0), 0);
    const cashTotal = filteredAppointments
      .filter(app => app.paymentType === 'cash')
      .reduce((sum, app) => sum + (Number(app.amount) || 0), 0);
    const cardTotal = filteredAppointments
      .filter(app => app.paymentType === 'card')
      .reduce((sum, app) => sum + (Number(app.amount) || 0), 0);

    setStats({
      totalRevenue,
      appointmentCount: filteredAppointments.length,
      customerCount: contactsData.length,
      cashTotal,
      cardTotal
    });

    // Generate chart data
    generateChartData(filteredAppointments);
  };

  const generateChartData = (appointmentsData) => {
    const { start, end, days, weeks, months } = getDateRange();
    let labels = [];
    let revenueData = [];
    let appointmentData = [];

    if (period === 'daily' || period === '2months') {
      // Daily breakdown
      const numDays = days || 60;
      for (let i = numDays - 1; i >= 0; i--) {
        const date = subDays(new Date(), i);
        labels.push(format(date, 'd MMM', { locale: tr }));
        
        const dayAppointments = appointmentsData.filter(app => 
          format(parseISO(app.date), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
        );
        
        revenueData.push(dayAppointments.reduce((sum, app) => sum + (Number(app.amount) || 0), 0));
        appointmentData.push(dayAppointments.length);
      }
    } else if (period === 'weekly' || period === '3months') {
      // Weekly breakdown
      const numWeeks = weeks || 12;
      for (let i = numWeeks - 1; i >= 0; i--) {
        const weekStart = subWeeks(new Date(), i);
        const weekEnd = subWeeks(new Date(), i - 1);
        labels.push(format(weekStart, 'd MMM', { locale: tr }));
        
        const weekAppointments = appointmentsData.filter(app => {
          const appDate = parseISO(app.date);
          return isWithinInterval(appDate, { start: weekStart, end: weekEnd });
        });
        
        revenueData.push(weekAppointments.reduce((sum, app) => sum + (Number(app.amount) || 0), 0));
        appointmentData.push(weekAppointments.length);
      }
    } else {
      // Monthly breakdown
      const numMonths = months || 12;
      for (let i = numMonths - 1; i >= 0; i--) {
        const monthDate = subMonths(new Date(), i);
        labels.push(format(monthDate, 'MMM yyyy', { locale: tr }));
        
        const monthAppointments = appointmentsData.filter(app => 
          format(parseISO(app.date), 'yyyy-MM') === format(monthDate, 'yyyy-MM')
        );
        
        revenueData.push(monthAppointments.reduce((sum, app) => sum + (Number(app.amount) || 0), 0));
        appointmentData.push(monthAppointments.length);
      }
    }

    setChartData({
      labels,
      revenue: revenueData,
      appointments: appointmentData
    });
  };

  const revenueChartData = {
    labels: chartData.labels,
    datasets: [
      {
        label: 'Gelir (₺)',
        data: chartData.revenue,
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const appointmentChartData = {
    labels: chartData.labels,
    datasets: [
      {
        label: 'Randevu Sayısı',
        data: chartData.appointments,
        backgroundColor: 'rgba(139, 92, 246, 0.8)',
        borderColor: 'rgb(139, 92, 246)',
        borderWidth: 1
      }
    ]
  };

  const paymentTypeChartData = {
    labels: ['Nakit', 'Kart'],
    datasets: [
      {
        data: [stats.cashTotal, stats.cardTotal],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(168, 85, 247, 0.8)'
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(168, 85, 247)'
        ],
        borderWidth: 2
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#f8fafc',
          font: { size: 12 }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#f8fafc',
        bodyColor: '#94a3b8',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        ticks: { color: '#94a3b8' },
        grid: { color: 'rgba(255, 255, 255, 0.05)' }
      },
      y: {
        ticks: { color: '#94a3b8' },
        grid: { color: 'rgba(255, 255, 255, 0.05)' }
      }
    }
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: '#f8fafc',
          font: { size: 14 },
          padding: 20
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: '#f8fafc',
        bodyColor: '#94a3b8',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        callbacks: {
          label: (context) => {
            return ` ${context.label}: ${context.parsed} ₺`;
          }
        }
      }
    }
  };

  const StatCard = ({ title, value, icon: Icon, colorClass }) => (
    <div className="card flex items-center gap-4">
      <div className={`p-4 rounded-xl ${colorClass} bg-opacity-10`}>
        <Icon size={32} className={colorClass.replace('bg-', 'text-')} />
      </div>
      <div>
        <p className="text-sm text-muted">{title}</p>
        <p className="text-3xl font-bold text-primary">{value}</p>
      </div>
    </div>
  );

  const periods = [
    { value: 'daily', label: 'Günlük (7 gün)' },
    { value: 'weekly', label: 'Haftalık (4 hafta)' },
    { value: 'monthly', label: 'Aylık (6 ay)' },
    { value: '2months', label: '2 Aylık' },
    { value: '3months', label: '3 Aylık' },
    { value: 'yearly', label: 'Yıllık (12 ay)' }
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start flex-wrap gap-6">
        <h2 className="text-3xl font-bold text-primary">Kontrol Paneli</h2>
        
        {/* Period Selector */}
        <div className="flex gap-2 flex-wrap">
          {periods.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-5 py-2.5 rounded-lg font-medium transition-all text-sm ${
                period === p.value
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                  : 'bg-white/5 text-secondary hover:bg-white/10 hover:text-primary'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Toplam Gelir" 
          value={`${stats.totalRevenue.toFixed(0)} ₺`} 
          icon={DollarSign} 
          colorClass="text-green-500 bg-green-500" 
        />
        <StatCard 
          title="Randevu Sayısı" 
          value={stats.appointmentCount} 
          icon={Calendar} 
          colorClass="text-blue-500 bg-blue-500" 
        />
        <StatCard 
          title="Müşteri Sayısı" 
          value={stats.customerCount} 
          icon={Users} 
          colorClass="text-purple-500 bg-purple-500" 
        />
        <StatCard 
          title="Ortalama Gelir" 
          value={`${stats.appointmentCount > 0 ? (stats.totalRevenue / stats.appointmentCount).toFixed(0) : 0} ₺`} 
          icon={TrendingUp} 
          colorClass="text-orange-500 bg-orange-500" 
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Chart */}
        <div className="card">
          <h3 className="text-xl font-bold text-primary mb-6 flex items-center gap-3">
            <TrendingUp size={24} className="text-indigo-500" />
            Gelir Trendi
          </h3>
          <div className="h-[300px]">
            <Line data={revenueChartData} options={chartOptions} />
          </div>
        </div>

        {/* Appointment Count Chart */}
        <div className="card">
          <h3 className="text-xl font-bold text-primary mb-6 flex items-center gap-3">
            <Calendar size={24} className="text-purple-500" />
            Randevu Sayısı
          </h3>
          <div className="h-[300px]">
            <Bar data={appointmentChartData} options={chartOptions} />
          </div>
        </div>

        {/* Payment Type Distribution */}
        <div className="card">
          <h3 className="text-xl font-bold text-primary mb-6 flex items-center gap-3">
            <PieChartIcon size={24} className="text-green-500" />
            Ödeme Tipi Dağılımı
          </h3>
          <div className="h-[300px]">
            <Pie data={paymentTypeChartData} options={pieChartOptions} />
          </div>
        </div>

        {/* Summary Card */}
        <div className="card space-y-4">
          <h3 className="text-xl font-bold text-primary mb-6">Özet</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 rounded-xl bg-green-500/10 border border-green-500/20">
              <span className="text-secondary font-medium">Nakit Gelir</span>
              <span className="text-2xl font-bold text-green-400">{stats.cashTotal.toFixed(0)} ₺</span>
            </div>
            <div className="flex justify-between items-center p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <span className="text-secondary font-medium">Kart Gelir</span>
              <span className="text-2xl font-bold text-purple-400">{stats.cardTotal.toFixed(0)} ₺</span>
            </div>
            <div className="flex justify-between items-center p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
              <span className="text-secondary font-medium">Toplam</span>
              <span className="text-2xl font-bold text-indigo-400">{stats.totalRevenue.toFixed(0)} ₺</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
