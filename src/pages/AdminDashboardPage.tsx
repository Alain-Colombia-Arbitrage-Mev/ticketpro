import { useState, useEffect, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  DollarSign,
  ShoppingCart,
  Ticket,
  AlertTriangle,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  LayoutDashboard,
  FileText,
  Users,
  Loader2,
  Calendar,
  Radio,
  Shield,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import logo from "../assets/images/logo2.svg";
// Using plain buttons with explicit colors — shadcn Button relies on CSS vars that don't work in this dark panel
import { supabase } from "../utils/supabase/client";
import { useAuth } from "../hooks/useAuth";
import { useRouter } from "../hooks/useRouter";
import { EventsTab } from "../components/admin/EventsTab";
import { TicketsAdminTab } from "../components/admin/TicketsAdminTab";
import { ValidationsLiveTab } from "../components/admin/ValidationsLiveTab";
import { RolesTab } from "../components/admin/RolesTab";
import { ExportCsvButton } from "../components/admin/ExportCsvButton";
import { CsvColumn } from "../utils/exportCsv";

// ─── Types ───────────────────────────────────────────────────────────────────

type Tab = "overview" | "events" | "orders" | "tickets" | "live" | "roles" | "logs" | "marketing";

interface SummaryData {
  totalRevenue: number;
  totalOrders: number;
  totalTickets: number;
  fraudAlerts: number;
}

interface OrderRow {
  id: string;
  order_id: string;
  buyer_email: string;
  total_amount: number;
  payment_status: string;
  payment_method: string;
  created_at: string;
}

interface LogRow {
  id: string;
  event_type: string;
  stripe_event_id: string;
  order_id: string;
  buyer_email: string;
  amount: number;
  payment_status: string;
  created_at: string;
}

interface MarketingContact {
  buyer_email: string;
  order_count: number;
  total_spend: number;
  first_purchase: string;
  last_purchase: string;
}

interface DailyOrders {
  date: string;
  count: number;
}

interface StatusDist {
  name: string;
  value: number;
}

const PAGE_SIZE = 25;

const STATUS_COLORS: Record<string, string> = {
  paid: "#22c55e",
  completed: "#22c55e",
  pending: "#eab308",
  failed: "#ef4444",
  fraud_detected: "#f97316",
  refunded: "#8b5cf6",
  cancelled: "#6b7280",
  active: "#22c55e",
  issued_unused: "#3b82f6",
  issued_used: "#a855f7",
  used: "#a855f7",
  expired: "#6b7280",
  succeeded: "#22c55e",
};

const PIE_COLORS = [
  "#c61619",
  "#22c55e",
  "#3b82f6",
  "#eab308",
  "#f97316",
  "#8b5cf6",
  "#6b7280",
  "#ec4899",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] || "#6b7280";
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{
        backgroundColor: `${color}20`,
        color: color,
        border: `1px solid ${color}40`,
      }}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

function formatDate(iso: string) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatShortDate(iso: string) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

// Sanitize search input for PostgREST .or() filters (commas/parens break syntax)
function sanitizeSearch(input: string): string {
  return input.replace(/[,()]/g, "").trim();
}

function formatCurrency(amount: number) {
  return `$${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// ─── Reusable Pagination ─────────────────────────────────────────────────────

function Pagination({
  page,
  totalCount,
  pageSize,
  onPageChange,
}: {
  page: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (p: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  return (
    <div className="flex items-center justify-between pt-4">
      <p className="text-sm text-white/50">
        {totalCount} result{totalCount !== 1 ? "s" : ""}
      </p>
      <div className="flex items-center gap-2">
        <button
          className="flex items-center justify-center h-8 w-8 rounded-lg text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-colors"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm text-white/60">
          {page} / {totalPages}
        </span>
        <button
          className="flex items-center justify-center h-8 w-8 rounded-lg text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-colors"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Search Input ────────────────────────────────────────────────────────────

function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-white/10 bg-[#0f0f0f] pl-10 pr-4 py-2 text-sm text-white placeholder:text-white/30 focus:border-[#c61619]/50 focus:outline-none focus:ring-1 focus:ring-[#c61619]/30"
      />
    </div>
  );
}

// ─── Select Filter ───────────────────────────────────────────────────────────

function SelectFilter({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  label: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-white/10 bg-[#0f0f0f] px-3 py-2 text-sm text-white focus:border-[#c61619]/50 focus:outline-none focus:ring-1 focus:ring-[#c61619]/30 [&>option]:bg-[#1a1a1a] [&>option]:text-white"
      aria-label={label}
    >
      <option value="">All statuses</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt.replace(/_/g, " ")}
        </option>
      ))}
    </select>
  );
}

// ─── Tab: Overview ───────────────────────────────────────────────────────────

function OverviewTab() {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [dailyOrders, setDailyOrders] = useState<DailyOrders[]>([]);
  const [statusDist, setStatusDist] = useState<StatusDist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ordersCountRes, revenueRes, ticketsCountRes, fraudRes] =
        await Promise.all([
          supabase
            .from("orders")
            .select("*", { count: "exact", head: true }),
          supabase
            .from("orders")
            .select("total_amount")
            .in("payment_status", ["paid", "completed"])
            .limit(10000),
          supabase
            .from("tickets")
            .select("*", { count: "exact", head: true }),
          supabase
            .from("orders")
            .select("*", { count: "exact", head: true })
            .eq("payment_status", "fraud_detected"),
        ]);

      const totalRevenue =
        revenueRes.data?.reduce(
          (sum: number, o: { total_amount: number }) => sum + (Number(o.total_amount) || 0),
          0,
        ) || 0;

      setSummary({
        totalRevenue,
        totalOrders: ordersCountRes.count || 0,
        totalTickets: ticketsCountRes.count || 0,
        fraudAlerts: fraudRes.count || 0,
      });

      // Daily orders for last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: recentOrders } = await supabase
        .from("orders")
        .select("created_at")
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: true });

      if (recentOrders) {
        const byDay: Record<string, number> = {};
        recentOrders.forEach((o: { created_at: string }) => {
          const day = o.created_at.substring(0, 10);
          byDay[day] = (byDay[day] || 0) + 1;
        });
        const dailyData: DailyOrders[] = Object.entries(byDay).map(
          ([date, count]) => ({ date, count }),
        );
        setDailyOrders(dailyData);
      }

      // Status distribution
      const { data: allOrders } = await supabase
        .from("orders")
        .select("payment_status")
        .limit(10000);

      if (allOrders) {
        const byStatus: Record<string, number> = {};
        allOrders.forEach((o: { payment_status: string }) => {
          const s = o.payment_status || "unknown";
          byStatus[s] = (byStatus[s] || 0) + 1;
        });
        const distData: StatusDist[] = Object.entries(byStatus).map(
          ([name, value]) => ({ name, value }),
        );
        setStatusDist(distData);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load overview data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  const cards = [
    {
      label: "Total Revenue",
      value: formatCurrency(summary?.totalRevenue || 0),
      icon: DollarSign,
      color: "#22c55e",
    },
    {
      label: "Total Orders",
      value: (summary?.totalOrders || 0).toLocaleString(),
      icon: ShoppingCart,
      color: "#3b82f6",
    },
    {
      label: "Tickets Sold",
      value: (summary?.totalTickets || 0).toLocaleString(),
      icon: Ticket,
      color: "#8b5cf6",
    },
    {
      label: "Fraud Alerts",
      value: (summary?.fraudAlerts || 0).toLocaleString(),
      icon: AlertTriangle,
      color: "#f97316",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="group relative overflow-hidden rounded-2xl border border-white/[0.06] p-5 transition-all duration-200 hover:border-white/[0.12] hover:-translate-y-0.5"
            style={{
              background:
                "linear-gradient(145deg, #131316 0%, #0d0d10 100%)",
              boxShadow:
                "0 1px 0 rgba(255,255,255,0.03) inset, 0 8px 24px -12px rgba(0,0,0,0.6)",
            }}
          >
            {/* Top accent bar */}
            <span
              className="absolute inset-x-0 top-0 h-[2px]"
              style={{
                background: `linear-gradient(90deg, transparent 0%, ${card.color} 50%, transparent 100%)`,
                opacity: 0.7,
              }}
              aria-hidden="true"
            />
            {/* Subtle glow on hover */}
            <span
              className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full opacity-0 blur-3xl transition-opacity duration-300 group-hover:opacity-40"
              style={{ backgroundColor: card.color }}
              aria-hidden="true"
            />
            <div className="relative flex items-start justify-between">
              <p className="text-xs font-medium uppercase tracking-wider text-white/45">
                {card.label}
              </p>
              <div
                className="flex h-9 w-9 items-center justify-center rounded-lg ring-1"
                style={{
                  backgroundColor: `${card.color}15`,
                  boxShadow: `inset 0 0 0 1px ${card.color}25`,
                }}
              >
                <card.icon className="h-[18px] w-[18px]" style={{ color: card.color }} />
              </div>
            </div>
            <p className="relative mt-3 text-3xl font-bold tracking-tight text-white">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bar Chart - Orders per day */}
        <div className="lg:col-span-2 rounded-2xl border border-white/[0.06] bg-gradient-to-br from-[#131316] to-[#0d0d10] p-5 shadow-[0_1px_0_rgba(255,255,255,0.03)_inset,0_8px_24px_-12px_rgba(0,0,0,0.6)]">
          <h3 className="mb-4 text-sm font-medium text-white/70">
            Orders per Day (Last 30 Days)
          </h3>
          {dailyOrders.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyOrders}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatShortDate}
                  stroke="#ffffff40"
                  tick={{ fontSize: 11 }}
                />
                <YAxis stroke="#ffffff40" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1a1a",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
                <Bar dataKey="count" fill="#c61619" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-white/40 py-12">
              No order data available
            </p>
          )}
        </div>

        {/* Pie Chart - Status distribution */}
        <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-[#131316] to-[#0d0d10] p-5 shadow-[0_1px_0_rgba(255,255,255,0.03)_inset,0_8px_24px_-12px_rgba(0,0,0,0.6)]">
          <h3 className="mb-4 text-sm font-medium text-white/70">
            Order Status Distribution
          </h3>
          {statusDist.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusDist}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={90}
                  dataKey="value"
                  nameKey="name"
                  stroke="none"
                >
                  {statusDist.map((_entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1a1a",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: "12px", color: "#ffffff99" }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-white/40 py-12">No data</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Orders ─────────────────────────────────────────────────────────────

function OrdersTab() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from("orders")
        .select("id, order_id, buyer_email, total_amount, payment_status, payment_method, created_at", {
          count: "exact",
        })
        .order("created_at", { ascending: false })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

      if (search.trim()) {
        const q = sanitizeSearch(search);
        if (q) query = query.or(`buyer_email.ilike.%${q}%,order_id.ilike.%${q}%`);
      }
      if (statusFilter) {
        query = query.eq("payment_status", statusFilter);
      }

      const { data, count, error: err } = await query;
      if (err) throw err;
      setOrders(data || []);
      setTotalCount(count || 0);
    } catch (err: any) {
      setError(err.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => fetchOrders(), 300);
    return () => clearTimeout(timer);
  }, [fetchOrders]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by email or order ID..."
          />
        </div>
        <SelectFilter
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            "paid",
            "completed",
            "pending",
            "failed",
            "fraud_detected",
            "refunded",
            "cancelled",
          ]}
          label="Filter by order status"
        />
        <ExportCsvButton
          filenamePrefix="ordenes"
          columns={ORDER_CSV_COLUMNS}
          fetchRows={() => fetchAllOrders(search, statusFilter)}
        />
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchOrders} />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-sm" role="table">
              <thead>
                <tr className="border-b border-white/10 bg-[#111]">
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">
                    Buyer Email
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-white/50 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider hidden md:table-cell">
                    Payment
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider hidden lg:table-cell">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {orders.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-12 text-center text-white/40"
                    >
                      No orders found
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr
                      key={order.id}
                      className="bg-[#1a1a1a] hover:bg-[#222] transition-colors"
                    >
                      <td className="px-4 py-3 text-white/80 font-mono text-xs max-w-[180px] truncate" title={order.order_id}>
                        {order.order_id || order.id.substring(0, 8)}
                      </td>
                      <td className="px-4 py-3 text-white/80">
                        {order.buyer_email}
                      </td>
                      <td className="px-4 py-3 text-right text-white font-medium">
                        {formatCurrency(Number(order.total_amount) || 0)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={order.payment_status} />
                      </td>
                      <td className="px-4 py-3 text-white/60 hidden md:table-cell">
                        {order.payment_method || "-"}
                      </td>
                      <td className="px-4 py-3 text-white/50 text-xs hidden lg:table-cell">
                        {formatDate(order.created_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            totalCount={totalCount}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}

const ORDER_CSV_COLUMNS: CsvColumn<OrderRow>[] = [
  { key: "created_at", header: "Fecha", get: (r) => r.created_at },
  { key: "order_id", header: "Orden ID", get: (r) => r.order_id || r.id },
  { key: "buyer_email", header: "Email", get: (r) => r.buyer_email },
  { key: "total_amount", header: "Monto", get: (r) => Number(r.total_amount ?? 0).toFixed(2) },
  { key: "payment_status", header: "Estado pago", get: (r) => r.payment_status },
  { key: "payment_method", header: "Método", get: (r) => r.payment_method ?? "" },
];

async function fetchAllOrders(search: string, statusFilter: string): Promise<OrderRow[]> {
  let query = supabase
    .from("orders")
    .select("id, order_id, buyer_email, total_amount, payment_status, payment_method, created_at")
    .order("created_at", { ascending: false })
    .limit(10_000);
  if (search.trim()) {
    const q = sanitizeSearch(search);
    if (q) query = query.or(`buyer_email.ilike.%${q}%,order_id.ilike.%${q}%`);
  }
  if (statusFilter) query = query.eq("payment_status", statusFilter);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as OrderRow[];
}

// ─── Tab: Transaction Logs ───────────────────────────────────────────────────

function LogsTab() {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, count, error: err } = await supabase
        .from("transaction_logs")
        .select(
          "id, event_type, stripe_event_id, order_id, buyer_email, amount, payment_status, created_at",
          { count: "exact" },
        )
        .order("created_at", { ascending: false })
        .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

      if (err) throw err;
      setLogs(data || []);
      setTotalCount(count || 0);
    } catch (err: any) {
      setError(err.message || "Failed to load transaction logs");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="space-y-4">
      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchLogs} />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-sm" role="table">
              <thead>
                <tr className="border-b border-white/10 bg-[#111]">
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">
                    Event Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider hidden md:table-cell">
                    Stripe Event ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider hidden lg:table-cell">
                    Order ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-white/50 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider hidden lg:table-cell">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {logs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-12 text-center text-white/40"
                    >
                      No transaction logs found
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr
                      key={log.id}
                      className="bg-[#1a1a1a] hover:bg-[#222] transition-colors"
                    >
                      <td className="px-4 py-3 text-white/80 font-mono text-xs">
                        {log.event_type}
                      </td>
                      <td className="px-4 py-3 text-white/50 font-mono text-xs hidden md:table-cell">
                        {log.stripe_event_id
                          ? `${log.stripe_event_id.substring(0, 16)}...`
                          : "-"}
                      </td>
                      <td className="px-4 py-3 text-white/50 font-mono text-xs hidden lg:table-cell">
                        {log.order_id
                          ? `${log.order_id.substring(0, 8)}...`
                          : "-"}
                      </td>
                      <td className="px-4 py-3 text-white/80">
                        {log.buyer_email || "-"}
                      </td>
                      <td className="px-4 py-3 text-right text-white font-medium">
                        {log.amount ? formatCurrency(Number(log.amount) / 100) : "-"}{/* logs still in cents from Stripe events */}
                      </td>
                      <td className="px-4 py-3">
                        {log.payment_status ? (
                          <StatusBadge status={log.payment_status} />
                        ) : (
                          <span className="text-white/30">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-white/50 text-xs hidden lg:table-cell">
                        {formatDate(log.created_at)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            totalCount={totalCount}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}

// ─── Tab: Marketing Contacts ─────────────────────────────────────────────────

function MarketingTab() {
  const [contacts, setContacts] = useState<MarketingContact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<MarketingContact[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase.rpc(
        "get_marketing_contacts",
      ).then((res: any) => {
        // If RPC doesn't exist, fallback to manual query
        if (res.error && res.error.code === "42883") {
          return { data: null, error: res.error };
        }
        return res;
      });

      if (err || !data) {
        // Fallback: manual aggregation
        const { data: orders, error: ordersErr } = await supabase
          .from("orders")
          .select("buyer_email, total_amount, created_at")
          .in("payment_status", ["paid", "completed"])
          .order("created_at", { ascending: true })
          .limit(10000);

        if (ordersErr) throw ordersErr;

        const contactMap = new Map<
          string,
          {
            order_count: number;
            total_spend: number;
            first_purchase: string;
            last_purchase: string;
          }
        >();

        (orders || []).forEach(
          (o: {
            buyer_email: string;
            total_amount: number;
            created_at: string;
          }) => {
            const existing = contactMap.get(o.buyer_email);
            if (existing) {
              existing.order_count += 1;
              existing.total_spend += Number(o.total_amount) || 0;
              if (o.created_at > existing.last_purchase) {
                existing.last_purchase = o.created_at;
              }
            } else {
              contactMap.set(o.buyer_email, {
                order_count: 1,
                total_spend: Number(o.total_amount) || 0,
                first_purchase: o.created_at,
                last_purchase: o.created_at,
              });
            }
          },
        );

        const result: MarketingContact[] = Array.from(contactMap.entries())
          .map(([email, info]) => ({
            buyer_email: email,
            order_count: info.order_count,
            total_spend: info.total_spend,
            first_purchase: info.first_purchase,
            last_purchase: info.last_purchase,
          }))
          .sort((a, b) => b.total_spend - a.total_spend);

        setContacts(result);
        setFilteredContacts(result);
        return;
      }

      const mapped: MarketingContact[] = (data || []).map((d: any) => ({
        buyer_email: d.buyer_email,
        order_count: d.order_count,
        total_spend: d.total_spend,
        first_purchase: d.first_purchase || d.min,
        last_purchase: d.last_purchase || d.max,
      }));
      setContacts(mapped);
      setFilteredContacts(mapped);
    } catch (err: any) {
      setError(err.message || "Failed to load marketing contacts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  useEffect(() => {
    if (!search.trim()) {
      setFilteredContacts(contacts);
    } else {
      const q = search.trim().toLowerCase();
      setFilteredContacts(
        contacts.filter((c) => c.buyer_email.toLowerCase().includes(q)),
      );
    }
  }, [search, contacts]);

  const handleExportCSV = useCallback(() => {
    const header = "Email,Orders,Total Spend,First Purchase,Last Purchase\n";
    const rows = filteredContacts
      .map(
        (c) =>
          `${c.buyer_email},${c.order_count},${c.total_spend.toFixed(2)},${c.first_purchase.substring(0, 10)},${c.last_purchase.substring(0, 10)}`,
      )
      .join("\n");
    const csv = header + rows;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `marketing_contacts_${new Date().toISOString().substring(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [filteredContacts]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by email..."
          />
        </div>
        <button
          onClick={handleExportCSV}
          disabled={filteredContacts.length === 0}
          className="flex items-center gap-2 rounded-lg bg-[#c61619] hover:bg-[#a51215] text-white px-4 py-2 text-sm font-medium disabled:opacity-50 transition-colors"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchContacts} />
      ) : (
        <>
          <p className="text-sm text-white/50">
            {filteredContacts.length} unique contact
            {filteredContacts.length !== 1 ? "s" : ""}
          </p>
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-sm" role="table">
              <thead>
                <tr className="border-b border-white/10 bg-[#111]">
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-white/50 uppercase tracking-wider">
                    Orders
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-white/50 uppercase tracking-wider">
                    Total Spend
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider hidden md:table-cell">
                    First Purchase
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider hidden md:table-cell">
                    Last Purchase
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredContacts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-12 text-center text-white/40"
                    >
                      No contacts found
                    </td>
                  </tr>
                ) : (
                  filteredContacts.map((contact) => (
                    <tr
                      key={contact.buyer_email}
                      className="bg-[#1a1a1a] hover:bg-[#222] transition-colors"
                    >
                      <td className="px-4 py-3 text-white/80">
                        {contact.buyer_email}
                      </td>
                      <td className="px-4 py-3 text-right text-white/80">
                        {contact.order_count}
                      </td>
                      <td className="px-4 py-3 text-right text-white font-medium">
                        {formatCurrency(contact.total_spend)}
                      </td>
                      <td className="px-4 py-3 text-white/50 text-xs hidden md:table-cell">
                        {contact.first_purchase
                          ? formatDate(contact.first_purchase)
                          : "-"}
                      </td>
                      <td className="px-4 py-3 text-white/50 text-xs hidden md:table-cell">
                        {contact.last_purchase
                          ? formatDate(contact.last_purchase)
                          : "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Shared States ───────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-[#c61619]" />
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <AlertTriangle className="h-10 w-10 text-[#c61619]" />
      <p className="text-white/60 text-sm text-center max-w-md">{message}</p>
      <button
        onClick={onRetry}
        className="flex items-center gap-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 px-4 py-2 text-sm font-medium transition-colors"
      >
        <RefreshCw className="h-4 w-4" />
        Retry
      </button>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

const TABS: { key: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "events", label: "Events", icon: Calendar },
  { key: "orders", label: "Orders", icon: ShoppingCart },
  { key: "tickets", label: "Tickets", icon: Ticket },
  { key: "live", label: "Live", icon: Radio },
  { key: "roles", label: "Roles", icon: Shield },
  { key: "logs", label: "Logs", icon: FileText },
  { key: "marketing", label: "Marketing", icon: Users },
];

const TAB_LABELS: Record<Tab, string> = {
  overview: "Overview",
  events: "Events",
  orders: "Orders",
  tickets: "Tickets",
  live: "Live Validation",
  roles: "Roles",
  logs: "Logs",
  marketing: "Marketing",
};

const TAB_DESCRIPTIONS: Record<Tab, string> = {
  overview: "Revenue, orders and activity at a glance",
  events: "Create and manage events",
  orders: "Browse and filter all orders",
  tickets: "Issued tickets and their status",
  live: "Real-time ticket validations",
  roles: "Manage admin and hoster access",
  logs: "Stripe and payment webhook logs",
  marketing: "Customer emails and spending",
};

type NavSection = { title: string; items: Tab[] };
const NAV_SECTIONS: NavSection[] = [
  { title: "General", items: ["overview"] },
  { title: "Operations", items: ["events", "orders", "tickets", "live"] },
  { title: "System", items: ["roles", "logs", "marketing"] },
];

export function AdminDashboardPage() {
  const { user, loading, signOut } = useAuth();
  const { navigate } = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Auth guard — wait for auth to finish loading before redirecting.
  // Unauthenticated → login (otherwise in ADMIN_ONLY mode we loop home↔admin-dashboard).
  // Authenticated but wrong role → home.
  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("login");
      return;
    }
    if (user.role !== "admin" && user.role !== "hoster") {
      navigate("home");
    }
  }, [user, loading, navigate]);

  if (loading || !user || (user.role !== "admin" && user.role !== "hoster")) {
    return <LoadingState />;
  }

  const handleSelectTab = (key: Tab) => {
    setActiveTab(key);
    setSidebarOpen(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } finally {
      navigate("login");
    }
  };

  const displayName = user.name || user.email?.split("@")[0] || "Admin";
  const userInitial = displayName.trim().charAt(0).toUpperCase();

  return (
    <div className="flex min-h-screen bg-[#050506] text-white">
      {/* Ambient background glow */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(1200px circle at 0% 0%, rgba(198,22,25,0.08), transparent 40%), radial-gradient(900px circle at 100% 100%, rgba(59,130,246,0.05), transparent 45%)",
        }}
      />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col border-r border-white/[0.06] transition-transform duration-200 ease-out lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          background:
            "linear-gradient(180deg, #0b0b0d 0%, #08080a 60%, #050506 100%)",
        }}
      >
        {/* Brand */}
        <div className="flex h-[68px] items-center justify-between border-b border-white/[0.06] px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#c61619] to-[#8a0f11] shadow-lg shadow-[#c61619]/20 ring-1 ring-white/10">
              <img src={logo} alt="" className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-bold tracking-wide text-white">
                VELTLIX
              </p>
              <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/40">
                Admin Console
              </p>
            </div>
          </div>
          <button
            type="button"
            className="rounded-md p-1.5 text-white/60 hover:bg-white/10 hover:text-white lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-5">
          {NAV_SECTIONS.map((section, idx) => (
            <div key={section.title} className={idx > 0 ? "mt-5" : ""}>
              <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/35">
                {section.title}
              </p>
              <div className="space-y-0.5">
                {section.items.map((key) => {
                  const tab = TABS.find((t) => t.key === key)!;
                  const active = activeTab === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleSelectTab(key)}
                      className={`group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 cursor-pointer ${
                        active
                          ? "text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                          : "text-white/65 hover:text-white hover:bg-white/[0.04]"
                      }`}
                      style={
                        active
                          ? {
                              background:
                                "linear-gradient(90deg, rgba(198,22,25,0.18) 0%, rgba(198,22,25,0.06) 100%)",
                            }
                          : undefined
                      }
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-to-b from-[#e8393c] to-[#c61619] shadow-[0_0_12px_rgba(198,22,25,0.6)]" />
                      )}
                      <span
                        className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md transition-all duration-200 ${
                          active
                            ? "bg-[#c61619]/20 text-[#ff5a5d] ring-1 ring-[#c61619]/30"
                            : "bg-white/[0.04] text-white/55 ring-1 ring-white/[0.04] group-hover:bg-white/[0.08] group-hover:text-white/85"
                        }`}
                      >
                        <tab.icon className="h-[15px] w-[15px]" strokeWidth={2.25} />
                      </span>
                      <span className="truncate">{TAB_LABELS[key]}</span>
                      {key === "live" && (
                        <span className="ml-auto flex items-center gap-1">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-60" />
                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          </span>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User / Sign out */}
        <div className="border-t border-white/[0.06] p-3">
          <div className="mb-2 flex items-center gap-3 rounded-xl bg-white/[0.03] px-3 py-2.5 ring-1 ring-white/[0.05]">
            <div
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ring-2 ring-[#c61619]/30"
              style={{
                background:
                  "linear-gradient(135deg, #c61619 0%, #8a0f11 100%)",
              }}
            >
              {userInitial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">
                {displayName}
              </p>
              <p className="flex items-center gap-1.5 truncate text-[11px] capitalize text-white/50">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                {user.role}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-white/70 transition-colors duration-200 hover:bg-[#c61619]/10 hover:text-[#ff5a5d]"
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header
          className="sticky top-0 z-20 flex h-[68px] items-center gap-4 border-b border-white/[0.06] px-4 sm:px-6 lg:px-8"
          style={{
            background:
              "linear-gradient(180deg, rgba(8,8,10,0.85) 0%, rgba(5,5,6,0.85) 100%)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
          }}
        >
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-md p-2 text-white/70 hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="min-w-0 flex-1">
            <div className="mb-0.5 flex items-center gap-1.5 text-[11px] font-medium text-white/40">
              <span>Admin</span>
              <ChevronRight className="h-3 w-3" />
              <span className="text-white/60">{TAB_LABELS[activeTab]}</span>
            </div>
            <h1 className="truncate text-lg font-bold tracking-tight text-white sm:text-xl">
              {TAB_LABELS[activeTab]}
            </h1>
          </div>

          <div className="hidden items-center gap-2 sm:flex">
            <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-xs text-white/60">
              <span className="relative flex h-2 w-2">
                <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-50" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <span className="font-medium">All systems operational</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-7xl">
            {activeTab === "overview" && <OverviewTab />}
            {activeTab === "events" && <EventsTab />}
            {activeTab === "orders" && <OrdersTab />}
            {activeTab === "tickets" && <TicketsAdminTab />}
            {activeTab === "live" && <ValidationsLiveTab />}
            {activeTab === "roles" && <RolesTab />}
            {activeTab === "logs" && <LogsTab />}
            {activeTab === "marketing" && <MarketingTab />}
          </div>
        </main>
      </div>
    </div>
  );
}
