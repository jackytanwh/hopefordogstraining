import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { format, parseISO, subMonths, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { DollarSign, TrendingUp, Users, PawPrint, Calendar, Award, AlertCircle, CheckCircle2, Clock } from "lucide-react";

const PROGRAM_LABELS = {
  kinder_puppy_in_home: "Kinder Puppy (In-Home)",
  kinder_puppy_fyog: "Kinder Puppy (FYOG)",
  basic_manners_in_home: "Basic Manners (In-Home)",
  basic_manners_fyog: "Basic Manners (FYOG)",
  basic_manners_group_class: "Basic Manners (Group Class)",
  canine_assessment: "Canine Assessment",
  behavioural_modification: "Behavioural Modification",
  on_demand_1_session: "On-Demand (1 Session)",
  on_demand_2_sessions: "On-Demand (2 Sessions)",
  on_demand_3_sessions: "On-Demand (3 Sessions)",
};

const PROGRAM_COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444",
  "#06b6d4", "#f97316", "#84cc16", "#ec4899", "#6366f1"
];

const STATUS_COLORS = {
  pending: "#f59e0b",
  confirmed: "#10b981",
  completed: "#3b82f6",
  cancelled: "#ef4444",
};

function StatCard({ icon: Icon, title, value, sub, color = "blue" }) {
  const colorMap = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    amber: "bg-amber-50 text-amber-600",
    purple: "bg-purple-50 text-purple-600",
    red: "bg-red-50 text-red-600",
  };
  return (
    <Card className="border-0 shadow-md bg-white">
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`rounded-xl p-3 ${colorMap[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ReportsStats() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [monthRange, setMonthRange] = useState("12");

  useEffect(() => {
    base44.entities.Booking.list().then(data => {
      setBookings(data);
      setLoading(false);
    });
  }, []);

  const months = useMemo(() => {
    const n = parseInt(monthRange);
    return Array.from({ length: n }, (_, i) => {
      const d = subMonths(new Date(), n - 1 - i);
      return { label: format(d, "MMM yy"), start: startOfMonth(d), end: endOfMonth(d) };
    });
  }, [monthRange]);

  const activeBookings = useMemo(() => bookings.filter(b => b.booking_status !== 'cancelled'), [bookings]);
  // Sales bookings exclude both cancelled and pending (pending is not a completed sale)
  const salesBookings = useMemo(() => bookings.filter(b => b.booking_status !== 'cancelled' && b.booking_status !== 'pending'), [bookings]);

  // Monthly sales data
  const monthlySalesData = useMemo(() => {
    return months.map(({ label, start, end }) => {
      const inMonth = bookings.filter(b => {
        if (!b.created_date) return false;
        return isWithinInterval(new Date(b.created_date), { start, end });
      });
      const revenue = inMonth.filter(b => b.booking_status !== 'cancelled' && b.booking_status !== 'pending').reduce((sum, b) => sum + (b.total_price || 0), 0);
      const count = inMonth.filter(b => b.booking_status !== 'cancelled').length;
      const cancelled = inMonth.filter(b => b.booking_status === 'cancelled').length;
      return { label, revenue, bookings: count, cancelled };
    });
  }, [months, bookings]);

  // Programme enrolment
  const programmeData = useMemo(() => {
    const counts = {};
    activeBookings.forEach(b => {
      const key = b.service_type || 'unknown';
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([key, count]) => ({ name: PROGRAM_LABELS[key] || key, count }))
      .sort((a, b) => b.count - a.count);
  }, [activeBookings]);

  // Status breakdown
  const statusData = useMemo(() => {
    const counts = { pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
    bookings.forEach(b => { if (counts[b.booking_status] !== undefined) counts[b.booking_status]++; });
    return Object.entries(counts).map(([status, value]) => ({ name: status.charAt(0).toUpperCase() + status.slice(1), value, status }));
  }, [bookings]);

  // Summary stats
  const totalRevenue = useMemo(() => salesBookings.reduce((s, b) => s + (b.total_price || 0), 0), [salesBookings]);
  const thisMonth = useMemo(() => {
    const start = startOfMonth(new Date());
    const end = endOfMonth(new Date());
    return bookings.filter(b => b.created_date && isWithinInterval(new Date(b.created_date), { start, end }) && b.booking_status !== 'cancelled');
  }, [bookings]);
  const thisMonthRevenue = useMemo(() => thisMonth.filter(b => b.booking_status !== 'pending').reduce((s, b) => s + (b.total_price || 0), 0), [thisMonth]);

  const avgOrderValue = salesBookings.length ? totalRevenue / salesBookings.length : 0;
  const conversionRate = bookings.length ? ((activeBookings.filter(b => b.booking_status === 'completed' || b.booking_status === 'confirmed').length / bookings.length) * 100).toFixed(1) : 0;

  // Top programme by revenue
  const programRevenueData = useMemo(() => {
    const rev = {};
    salesBookings.forEach(b => {
      const key = PROGRAM_LABELS[b.service_type] || b.service_type || 'Unknown';
      rev[key] = (rev[key] || 0) + (b.total_price || 0);
    });
    return Object.entries(rev).map(([name, revenue]) => ({ name, revenue })).sort((a, b) => b.revenue - a.revenue);
  }, [salesBookings]);

  // Adoption discount stats
  const adoptedCount = activeBookings.filter(b => b.is_adopted || (b.furkids && b.furkids.some(f => f.is_adopted || f.isAdopted))).length;

  // Booking source (how did you know)
  const howKnewData = useMemo(() => {
    const counts = {};
    bookings.forEach(b => {
      const src = b.how_did_you_know || 'Unknown';
      counts[src] = (counts[src] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [bookings]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Reports & Stats</h1>
          <p className="text-slate-500 mt-1">Business insights and analytics</p>
        </div>
        <Select value={monthRange} onValueChange={setMonthRange}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3">Last 3 months</SelectItem>
            <SelectItem value="6">Last 6 months</SelectItem>
            <SelectItem value="12">Last 12 months</SelectItem>
            <SelectItem value="24">Last 24 months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} title="Total Revenue" value={`$${totalRevenue.toLocaleString('en-SG', { minimumFractionDigits: 0 })}`} sub="All time (excl. cancelled & pending)" color="green" />
        <StatCard icon={TrendingUp} title="This Month" value={`$${thisMonthRevenue.toLocaleString('en-SG', { minimumFractionDigits: 0 })}`} sub={`${thisMonth.length} bookings`} color="blue" />
        <StatCard icon={Users} title="Total Bookings" value={activeBookings.length} sub={`${bookings.filter(b => b.booking_status === 'pending').length} pending`} color="purple" />
        <StatCard icon={Award} title="Avg. Order Value" value={`$${avgOrderValue.toFixed(0)}`} sub={`${conversionRate}% conversion`} color="amber" />
      </div>

      {/* Monthly Revenue Chart */}
      <Card className="border-0 shadow-md">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="flex items-center gap-2 text-slate-800">
            <TrendingUp className="w-5 h-5" />
            Monthly Revenue
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-6">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlySalesData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={v => `$${v >= 1000 ? (v/1000).toFixed(1)+'k' : v}`} />
              <Tooltip formatter={(v) => [`$${v.toLocaleString()}`, 'Revenue']} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Bookings & Cancellations Line Chart */}
      <Card className="border-0 shadow-md">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="flex items-center gap-2 text-slate-800">
            <Calendar className="w-5 h-5" />
            Monthly Bookings vs Cancellations
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-6">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={monthlySalesData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} />
              <Legend />
              <Line type="monotone" dataKey="bookings" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="New Bookings" />
              <Line type="monotone" dataKey="cancelled" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} name="Cancellations" strokeDasharray="4 2" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Programme Enrolment + Status Pie */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Programme Enrolment */}
        <Card className="border-0 shadow-md">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <PawPrint className="w-5 h-5" />
              Programme Enrolment
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-6">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={programmeData} layout="vertical" margin={{ top: 0, right: 20, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 11, fill: '#475569' }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} name="Enrolments">
                  {programmeData.map((_, i) => <Cell key={i} fill={PROGRAM_COLORS[i % PROGRAM_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Booking Status Pie */}
        <Card className="border-0 shadow-md">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <CheckCircle2 className="w-5 h-5" />
              Booking Status Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-6 flex flex-col items-center">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {statusData.map((entry, i) => <Cell key={i} fill={STATUS_COLORS[entry.status] || '#94a3b8'} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {statusData.map(s => (
                <div key={s.status} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ background: STATUS_COLORS[s.status] }} />
                  <span className="text-sm text-slate-600">{s.name}: <strong>{s.value}</strong></span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue by Programme */}
      <Card className="border-0 shadow-md">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="flex items-center gap-2 text-slate-800">
            <DollarSign className="w-5 h-5" />
            Revenue by Programme
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-6">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={programRevenueData} layout="vertical" margin={{ top: 0, right: 30, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={v => `$${v >= 1000 ? (v/1000).toFixed(1)+'k' : v}`} />
              <YAxis type="category" dataKey="name" width={170} tick={{ fontSize: 11, fill: '#475569' }} />
              <Tooltip formatter={v => [`$${v.toLocaleString()}`, 'Revenue']} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} />
              <Bar dataKey="revenue" radius={[0, 4, 4, 0]} name="Revenue">
                {programRevenueData.map((_, i) => <Cell key={i} fill={PROGRAM_COLORS[i % PROGRAM_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* How Did You Know + Extra Insights */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Referral Source */}
        {howKnewData.length > 0 && (
          <Card className="border-0 shadow-md">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <Users className="w-5 h-5" />
                How Clients Found Us
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-6">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={howKnewData} cx="50%" cy="50%" outerRadius={85} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {howKnewData.map((_, i) => <Cell key={i} fill={PROGRAM_COLORS[i % PROGRAM_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Quick Insights */}
        <Card className="border-0 shadow-md">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <AlertCircle className="w-5 h-5" />
              Quick Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {[
              {
                icon: CheckCircle2,
                color: "text-green-600 bg-green-50",
                label: "Completed Bookings",
                value: `${bookings.filter(b => b.booking_status === 'completed').length} bookings`
              },
              {
                icon: Clock,
                color: "text-amber-600 bg-amber-50",
                label: "Pending Confirmation",
                value: `${bookings.filter(b => b.booking_status === 'pending').length} bookings`
              },
              {
                icon: PawPrint,
                color: "text-purple-600 bg-purple-50",
                label: "Adopted Furkids",
                value: `${adoptedCount} bookings`
              },
              {
                icon: TrendingUp,
                color: "text-blue-600 bg-blue-50",
                label: "Most Popular Programme",
                value: programmeData[0]?.name || "—"
              },
              {
                icon: DollarSign,
                color: "text-emerald-600 bg-emerald-50",
                label: "Highest Revenue Programme",
                value: programRevenueData[0]?.name || "—"
              },
              {
                icon: Users,
                color: "text-rose-600 bg-rose-50",
                label: "Cancellation Rate",
                value: bookings.length ? `${((bookings.filter(b => b.booking_status === 'cancelled').length / bookings.length) * 100).toFixed(1)}%` : "0%"
              },
            ].map(({ icon: Icon, color, label, value }) => (
              <div key={label} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                <div className={`rounded-lg p-2 ${color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="text-sm font-semibold text-slate-800">{value}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}