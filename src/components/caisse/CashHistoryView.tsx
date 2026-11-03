import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { CashRegisterSession } from '../../types';
import { formatDateTime, formatDualCurrency } from '../../utils/formatters';
import { exportToExcel } from '../../utils/excelUtils';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import {
  Calendar,
  DollarSign,
  TrendingUp,
  Download,
  Filter,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ChevronDown,
  ChevronUp,
  Award,
  Smartphone,
  ShieldCheck,
  Eye,
  BarChart2,
  Receipt,
  UserCheck,
  Trash2,
} from 'lucide-react';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';

interface CashHistoryViewProps {
  onSelectReportSession: (session: CashRegisterSession) => void;
}

interface MonthlyStat {
  monthKey: string; // '2026-10'
  monthLabel: string; // 'Octobre 2026'
  shortLabel: string; // 'Oct 26'
  totalSalesUSD: number;
  totalSalesCDF: number;
  cashSalesUSD: number;
  mobileMoneyUSD: number;
  bankSalesUSD: number;
  vatCollectedUSD: number;
  sessionsCount: number;
  totalDiscrepancyUSD: number;
  transactionsCount: number;
}

export const CashHistoryView: React.FC<CashHistoryViewProps> = ({ onSelectReportSession }) => {
  const { cashSessions, settings, currentUser, deleteCashSession } = useApp();
  const rate = settings.exchangeRateUSD_CDF || 2850;

  // Delete modal state
  const [sessionToDelete, setSessionToDelete] = useState<CashRegisterSession | null>(null);

  // Filters state
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL'); // 'ALL' or '2026-10'
  const [selectedCashier, setSelectedCashier] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [discrepancyFilter, setDiscrepancyFilter] = useState<'ALL' | 'ZERO_DISCREPANCY' | 'HAS_DISCREPANCY'>('ALL');
  const [chartType, setChartType] = useState<'BAR_GROUPED' | 'BAR_STACKED' | 'AREA'>('BAR_GROUPED');
  const [isChartCollapsed, setIsChartCollapsed] = useState<boolean>(false);

  // Month names in French
  const monthNamesFR = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  const shortMonthNamesFR = [
    'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
    'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'
  ];

  // Helper to get formatted month label
  const getMonthLabel = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return `${monthNamesFR[d.getMonth()]} ${d.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  // Extract all available months from sessions
  const availableMonths = useMemo(() => {
    const monthMap = new Map<string, { key: string; label: string; count: number }>();
    cashSessions.forEach((s) => {
      const d = new Date(s.openedAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `${monthNamesFR[d.getMonth()]} ${d.getFullYear()}`;
      const existing = monthMap.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        monthMap.set(key, { key, label, count: 1 });
      }
    });

    return Array.from(monthMap.values()).sort((a, b) => b.key.localeCompare(a.key));
  }, [cashSessions]);

  // Extract list of unique cashiers
  const cashiersList = useMemo(() => {
    const set = new Set<string>();
    cashSessions.forEach((s) => {
      if (s.cashierName) set.add(s.cashierName);
    });
    return Array.from(set);
  }, [cashSessions]);

  // 6-Month Monthly Comparison Data for Recharts
  const monthlyStatsData = useMemo(() => {
    // Collect the last 6 calendar months
    const today = new Date();
    const monthsData: MonthlyStat[] = [];

    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const y = targetDate.getFullYear();
      const m = targetDate.getMonth();
      const monthKey = `${y}-${String(m + 1).padStart(2, '0')}`;
      const monthLabel = `${monthNamesFR[m]} ${y}`;
      const shortLabel = `${shortMonthNamesFR[m]} ${String(y).slice(2)}`;

      // Filter sessions belonging to this month
      const monthSessions = cashSessions.filter((s) => {
        const sMonthKey = s.openedAt.slice(0, 7);
        return sMonthKey === monthKey;
      });

      const totalSalesUSD = monthSessions.reduce((acc, s) => acc + (s.totalSalesUSD || 0), 0);
      const totalSalesCDF = Math.round(totalSalesUSD * rate);
      const cashSalesUSD = monthSessions.reduce((acc, s) => acc + (s.cashSalesUSD || 0), 0);
      const mobileMoneyUSD = monthSessions.reduce((acc, s) => acc + (s.mobileMoneyUSD || 0), 0);
      const bankSalesUSD = monthSessions.reduce((acc, s) => acc + (s.bankSalesUSD || 0), 0);
      const vatCollectedUSD = monthSessions.reduce((acc, s) => acc + (s.vatCollectedUSD || 0), 0);
      const totalDiscrepancyUSD = monthSessions.reduce((acc, s) => acc + (s.differenceUSD || 0), 0);
      const transactionsCount = monthSessions.reduce((acc, s) => acc + (s.totalTransactionsCount || 0), 0);

      monthsData.push({
        monthKey,
        monthLabel,
        shortLabel,
        totalSalesUSD: Number(totalSalesUSD.toFixed(2)),
        totalSalesCDF,
        cashSalesUSD: Number(cashSalesUSD.toFixed(2)),
        mobileMoneyUSD: Number(mobileMoneyUSD.toFixed(2)),
        bankSalesUSD: Number(bankSalesUSD.toFixed(2)),
        vatCollectedUSD: Number(vatCollectedUSD.toFixed(2)),
        sessionsCount: monthSessions.length,
        totalDiscrepancyUSD: Number(totalDiscrepancyUSD.toFixed(2)),
        transactionsCount,
      });
    }

    return monthsData;
  }, [cashSessions, rate]);

  // Overall 6-Month KPIs
  const sixMonthKPIs = useMemo(() => {
    const totalUSD = monthlyStatsData.reduce((acc, m) => acc + m.totalSalesUSD, 0);
    const totalCDF = Math.round(totalUSD * rate);
    const avgPerMonth = totalUSD / (monthlyStatsData.length || 1);
    const totalSessions = monthlyStatsData.reduce((acc, m) => acc + m.sessionsCount, 0);
    const totalTx = monthlyStatsData.reduce((acc, m) => acc + m.transactionsCount, 0);

    let peakMonth = monthlyStatsData[0];
    for (const m of monthlyStatsData) {
      if (m.totalSalesUSD > (peakMonth?.totalSalesUSD || 0)) {
        peakMonth = m;
      }
    }

    return {
      totalUSD,
      totalCDF,
      avgPerMonth,
      totalSessions,
      totalTx,
      peakMonth,
    };
  }, [monthlyStatsData, rate]);

  // Filtered Sessions Table
  const filteredSessions = useMemo(() => {
    return cashSessions.filter((session) => {
      // Month filter
      if (selectedMonth !== 'ALL') {
        const sMonth = session.openedAt.slice(0, 7);
        if (sMonth !== selectedMonth) return false;
      }

      // Cashier filter
      if (selectedCashier !== 'ALL') {
        if (session.cashierName !== selectedCashier) return false;
      }

      // Discrepancy filter
      if (discrepancyFilter === 'ZERO_DISCREPANCY') {
        if (session.differenceUSD !== 0) return false;
      } else if (discrepancyFilter === 'HAS_DISCREPANCY') {
        if (!session.differenceUSD || session.differenceUSD === 0) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchNumber = session.sessionNumber.toLowerCase().includes(query);
        const matchCashier = session.cashierName?.toLowerCase().includes(query);
        const matchSupervisor = session.supervisorName?.toLowerCase().includes(query);
        const matchNotes = session.closingNotes?.toLowerCase().includes(query);
        if (!matchNumber && !matchCashier && !matchSupervisor && !matchNotes) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => b.openedAt.localeCompare(a.openedAt));
  }, [cashSessions, selectedMonth, selectedCashier, discrepancyFilter, searchQuery]);

  // Aggregated metrics for currently filtered sessions
  const currentFilteredKPIs = useMemo(() => {
    const count = filteredSessions.length;
    const closedCount = filteredSessions.filter((s) => s.status === 'CLOSED').length;
    const totalSalesUSD = filteredSessions.reduce((acc, s) => acc + (s.totalSalesUSD || 0), 0);
    const totalSalesCDF = Math.round(totalSalesUSD * rate);
    const cashSalesUSD = filteredSessions.reduce((acc, s) => acc + (s.cashSalesUSD || 0), 0);
    const mobileMoneyUSD = filteredSessions.reduce((acc, s) => acc + (s.mobileMoneyUSD || 0), 0);
    const vatCollectedUSD = filteredSessions.reduce((acc, s) => acc + (s.vatCollectedUSD || 0), 0);
    const netDifferenceUSD = filteredSessions.reduce((acc, s) => acc + (s.differenceUSD || 0), 0);
    const perfectCount = filteredSessions.filter((s) => s.status === 'CLOSED' && s.differenceUSD === 0).length;
    const complianceRate = closedCount > 0 ? (perfectCount / closedCount) * 100 : 100;

    return {
      count,
      closedCount,
      totalSalesUSD,
      totalSalesCDF,
      cashSalesUSD,
      mobileMoneyUSD,
      vatCollectedUSD,
      netDifferenceUSD,
      complianceRate,
    };
  }, [filteredSessions, rate]);

  // Export to Excel handler
  const handleExportHistoryExcel = () => {
    const data = filteredSessions.map((s) => ({
      NumeroSession: s.sessionNumber,
      Statut: s.status === 'OPEN' ? 'Ouverte' : 'Clôturée',
      DateOuverture: s.openedAt,
      DateCloture: s.closedAt || 'En cours',
      Caissier: s.cashierName,
      Superviseur: s.supervisorName || 'Direction',
      FondOuverture_USD: s.openingFloatUSD,
      FondOuverture_CDF: s.openingFloatCDF,
      TotalVentes_USD: s.totalSalesUSD || 0,
      TotalVentes_CDF: s.totalSalesCDF || 0,
      VentesEspeces_USD: s.cashSalesUSD || 0,
      MobileMoney_USD: s.mobileMoneyUSD || 0,
      Banque_USD: s.bankSalesUSD || 0,
      TVA_16_USD: s.vatCollectedUSD || 0,
      EspecesComptees_USD: s.closingCountedUSD ?? 'N/A',
      EspecesComptees_CDF: s.closingCountedCDF ?? 'N/A',
      Ecart_USD: s.differenceUSD ?? 0,
      Ecart_CDF: s.differenceCDF ?? 0,
      Transactions: s.totalTransactionsCount || 0,
      Observations: s.closingNotes || '',
    }));

    const filename = `CongoBiz_Historique_Clotures_Caisse_${selectedMonth !== 'ALL' ? selectedMonth : 'Global'}.xlsx`;
    exportToExcel(filename, [
      { sheetName: 'Clotures_Caisse', data },
    ]);
  };

  return (
    <div className="space-y-6">
      {/* Admin Title & Overview Banner */}
      <div className="bg-white rounded-xl border border-neutral-200 p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-neutral-900 text-amber-400 rounded-xl shadow-2xs">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-neutral-900">
                  Historique & Audit des Clôtures de Caisse
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  Espace Direction & Audit
                </span>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Consultation des rapports de clôture (Z) des mois précédents et analyse comparative des recettes
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleExportHistoryExcel}
            className="px-3.5 py-2 bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
            title="Exporter l'historique filtré sous Microsoft Excel (.xlsx)"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* ================= RECHARTS: 6-MONTH COMPARATIVE BAR CHART ================= */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs overflow-hidden transition-all">
        {/* Chart Header */}
        <div className="p-4 bg-neutral-50/70 border-b border-neutral-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 text-amber-600 rounded-lg">
              <BarChart2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-xs sm:text-sm text-neutral-900">
                  Comparatif Mensuel du Chiffre d'Affaires (6 Derniers Mois)
                </h3>
                <span className="text-[10px] font-mono-nums font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                  ${sixMonthKPIs.totalUSD.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} USD Cumulé
                </span>
              </div>
              <p className="text-[11px] text-neutral-500">
                Visualisation Recharts de l'évolution des recettes de caisse par mode de paiement
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isChartCollapsed && (
              <div className="flex items-center bg-white p-0.5 rounded-lg border border-neutral-200 text-xs shadow-2xs">
                <button
                  type="button"
                  onClick={() => setChartType('BAR_GROUPED')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                    chartType === 'BAR_GROUPED' ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  Barres Groupées
                </button>
                <button
                  type="button"
                  onClick={() => setChartType('BAR_STACKED')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                    chartType === 'BAR_STACKED' ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  Empilées
                </button>
                <button
                  type="button"
                  onClick={() => setChartType('AREA')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                    chartType === 'AREA' ? 'bg-neutral-900 text-white' : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  Courbe
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsChartCollapsed(!isChartCollapsed)}
              className="p-1.5 text-neutral-500 hover:text-neutral-800 hover:bg-neutral-200 rounded-lg transition-colors"
              title={isChartCollapsed ? 'Déplier le graphique' : 'Replier le graphique'}
            >
              {isChartCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Chart Content & KPIs */}
        {!isChartCollapsed && (
          <div className="p-4 sm:p-5 space-y-4">
            {/* Top 4 KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                <span className="text-[10px] text-neutral-500 uppercase tracking-wider block font-semibold">
                  CA Total 6 Mois
                </span>
                <div className="font-bold text-base text-neutral-900 mt-0.5 font-mono-nums">
                  ${sixMonthKPIs.totalUSD.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                </div>
                <span className="text-[10px] text-neutral-400 font-mono">
                  {new Intl.NumberFormat('fr-FR').format(sixMonthKPIs.totalCDF)} FC
                </span>
              </div>

              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                <span className="text-[10px] text-neutral-500 uppercase tracking-wider block font-semibold">
                  Moyenne Mensuelle
                </span>
                <div className="font-bold text-base text-neutral-900 mt-0.5 font-mono-nums">
                  ${sixMonthKPIs.avgPerMonth.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                </div>
                <span className="text-[10px] text-neutral-400 font-mono">
                  {new Intl.NumberFormat('fr-FR').format(Math.round(sixMonthKPIs.avgPerMonth * rate))} FC / mois
                </span>
              </div>

              <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/70">
                <span className="text-[10px] text-amber-800 uppercase tracking-wider block font-semibold flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-amber-600" />
                  Mois Record
                </span>
                <div className="font-bold text-base text-neutral-900 mt-0.5 font-mono-nums">
                  ${(sixMonthKPIs.peakMonth?.totalSalesUSD || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                </div>
                <span className="text-[10px] text-amber-700 font-semibold">
                  {sixMonthKPIs.peakMonth?.monthLabel || 'N/A'}
                </span>
              </div>

              <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200/70">
                <span className="text-[10px] text-emerald-800 uppercase tracking-wider block font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Audit des Clôtures
                </span>
                <div className="font-bold text-base text-neutral-900 mt-0.5 font-mono-nums">
                  {sixMonthKPIs.totalSessions} sessions
                </div>
                <span className="text-[10px] text-emerald-700 font-semibold">
                  {sixMonthKPIs.totalTx} transactions enregistrées
                </span>
              </div>
            </div>

            {/* Recharts Canvas */}
            <div className="h-64 sm:h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                {chartType === 'BAR_GROUPED' ? (
                  <BarChart data={monthlyStatsData} margin={{ top: 10, right: 15, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis
                      dataKey="shortLabel"
                      tick={{ fontSize: 11, fill: '#4b5563' }}
                      axisLine={{ stroke: '#e5e7eb' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#9ca3af' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(val) => `$${val}`}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null;
                        const data = payload[0].payload as MonthlyStat;
                        return (
                          <div className="bg-neutral-900 text-white text-xs p-3 rounded-xl shadow-2xl border border-neutral-700 space-y-1.5 min-w-[200px]">
                            <div className="flex items-center justify-between border-b border-neutral-800 pb-1">
                              <span className="font-bold text-amber-400">{data.monthLabel}</span>
                              <span className="text-[10px] bg-neutral-800 px-1.5 py-0.2 rounded text-neutral-300">
                                {data.sessionsCount} session{data.sessionsCount > 1 ? 's' : ''}
                              </span>
                            </div>
                            <div className="space-y-1 font-mono-nums text-[11px]">
                              <p className="flex justify-between">
                                <span className="text-neutral-400">Total Facturé :</span>
                                <strong className="text-emerald-400">${data.totalSalesUSD.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</strong>
                              </p>
                              <p className="flex justify-between">
                                <span className="text-neutral-400">Espèces Cash :</span>
                                <span className="text-white">${data.cashSalesUSD.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</span>
                              </p>
                              <p className="flex justify-between">
                                <span className="text-neutral-400">Mobile Money / Banque :</span>
                                <span className="text-amber-300">${(data.mobileMoneyUSD + data.bankSalesUSD).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</span>
                              </p>
                              <p className="flex justify-between border-t border-neutral-800 pt-1 text-neutral-400">
                                <span>Équiv. Francs :</span>
                                <span>{new Intl.NumberFormat('fr-FR').format(data.totalSalesCDF)} FC</span>
                              </p>
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                    <Bar dataKey="totalSalesUSD" name="CA Total ($)" fill="#111827" radius={[4, 4, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="cashSalesUSD" name="Espèces Cash ($)" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} />
                    <Bar dataKey="mobileMoneyUSD" name="Mobile Money ($)" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  </BarChart>
                ) : chartType === 'BAR_STACKED' ? (
                  <BarChart data={monthlyStatsData} margin={{ top: 10, right: 15, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis
                      dataKey="shortLabel"
                      tick={{ fontSize: 11, fill: '#4b5563' }}
                      axisLine={{ stroke: '#e5e7eb' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#9ca3af' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(val) => `$${val}`}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null;
                        const data = payload[0].payload as MonthlyStat;
                        return (
                          <div className="bg-neutral-900 text-white text-xs p-3 rounded-xl shadow-2xl border border-neutral-700 space-y-1.5 min-w-[200px]">
                            <div className="flex items-center justify-between border-b border-neutral-800 pb-1">
                              <span className="font-bold text-amber-400">{data.monthLabel}</span>
                              <span className="text-[10px] bg-neutral-800 px-1.5 py-0.2 rounded text-neutral-300">
                                {data.sessionsCount} session{data.sessionsCount > 1 ? 's' : ''}
                              </span>
                            </div>
                            <div className="space-y-1 font-mono-nums text-[11px]">
                              <p className="flex justify-between">
                                <span className="text-neutral-400">Total :</span>
                                <strong className="text-emerald-400">${data.totalSalesUSD.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</strong>
                              </p>
                              <p className="flex justify-between">
                                <span className="text-neutral-400">Cash :</span>
                                <span className="text-white">${data.cashSalesUSD.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</span>
                              </p>
                              <p className="flex justify-between">
                                <span className="text-neutral-400">Mobile / Banque :</span>
                                <span className="text-amber-300">${(data.mobileMoneyUSD + data.bankSalesUSD).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</span>
                              </p>
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                    <Bar dataKey="cashSalesUSD" stackId="a" name="Espèces Cash ($)" fill="#10b981" radius={[0, 0, 0, 0]} maxBarSize={38} />
                    <Bar dataKey="mobileMoneyUSD" stackId="a" name="Mobile Money ($)" fill="#f59e0b" radius={[0, 0, 0, 0]} maxBarSize={38} />
                    <Bar dataKey="bankSalesUSD" stackId="a" name="Banque ($)" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={38} />
                  </BarChart>
                ) : (
                  <AreaChart data={monthlyStatsData} margin={{ top: 10, right: 15, left: -10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="monthSalesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis
                      dataKey="shortLabel"
                      tick={{ fontSize: 11, fill: '#4b5563' }}
                      axisLine={{ stroke: '#e5e7eb' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#9ca3af' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(val) => `$${val}`}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload || !payload.length) return null;
                        const data = payload[0].payload as MonthlyStat;
                        return (
                          <div className="bg-neutral-900 text-white text-xs p-3 rounded-xl shadow-2xl border border-neutral-700 space-y-1 min-w-[190px]">
                            <p className="font-bold text-amber-400">{data.monthLabel}</p>
                            <p className="text-emerald-400 font-mono-nums font-bold text-sm">
                              ${data.totalSalesUSD.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} USD
                            </p>
                            <p className="text-neutral-400 text-[10px] font-mono">
                              {new Intl.NumberFormat('fr-FR').format(data.totalSalesCDF)} FC
                            </p>
                            <p className="text-neutral-300 text-[11px] pt-1 border-t border-neutral-800">
                              {data.sessionsCount} session{data.sessionsCount > 1 ? 's' : ''} clôturée{data.sessionsCount > 1 ? 's' : ''}
                            </p>
                          </div>
                        );
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                    <Area
                      type="monotone"
                      dataKey="totalSalesUSD"
                      name="CA Total ($ USD)"
                      stroke="#10b981"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#monthSalesGrad)"
                    />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* ================= FILTER TOOLBAR BY MONTH & CRITERIA ================= */}
      <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-2xs space-y-3">
        {/* Quick Month Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedMonth('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              selectedMonth === 'ALL'
                ? 'bg-neutral-900 text-white shadow-2xs'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            <span>Tous les mois</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${selectedMonth === 'ALL' ? 'bg-neutral-800 text-amber-400' : 'bg-neutral-200 text-neutral-700'}`}>
              {cashSessions.length}
            </span>
          </button>

          {availableMonths.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setSelectedMonth(m.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                selectedMonth === m.key
                  ? 'bg-neutral-900 text-white shadow-2xs'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              <span>{m.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${selectedMonth === m.key ? 'bg-neutral-800 text-amber-400' : 'bg-neutral-200 text-neutral-700'}`}>
                {m.count}
              </span>
            </button>
          ))}
        </div>

        {/* Detailed Secondary Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 pt-2 border-t border-neutral-100 text-xs">
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher session, caissier, note..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-neutral-50 border border-neutral-300 rounded-lg text-xs text-neutral-900 focus:outline-none focus:bg-white"
            />
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>

          {/* Cashier Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-neutral-500 text-[11px] shrink-0 font-medium">Caissier :</span>
            <select
              value={selectedCashier}
              onChange={(e) => setSelectedCashier(e.target.value)}
              className="w-full p-1.5 bg-neutral-50 border border-neutral-300 rounded-lg text-xs text-neutral-800 focus:bg-white"
            >
              <option value="ALL">Tous les caissiers</option>
              {cashiersList.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Discrepancy Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-neutral-500 text-[11px] shrink-0 font-medium">Écart :</span>
            <select
              value={discrepancyFilter}
              onChange={(e) => setDiscrepancyFilter(e.target.value as any)}
              className="w-full p-1.5 bg-neutral-50 border border-neutral-300 rounded-lg text-xs text-neutral-800 focus:bg-white"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="ZERO_DISCREPANCY">Écart nul (100% Conforme)</option>
              <option value="HAS_DISCREPANCY">Avec écart constaté</option>
            </select>
          </div>

          {/* Active Month Indicator badge */}
          <div className="flex items-center justify-between sm:justify-end px-2 py-1 text-neutral-500 text-[11px]">
            <span>Filtrées : <strong className="text-neutral-900">{filteredSessions.length}</strong> session{filteredSessions.length > 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      {/* ================= MONTHLY SUMMARY BAR (FOR SELECTED MONTH OR FILTERED) ================= */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-neutral-200 shadow-2xs">
          <span className="text-[10px] text-neutral-500 uppercase tracking-wider block font-semibold">
            {selectedMonth === 'ALL' ? 'Total Encaissé Filtré' : `CA ${availableMonths.find(m => m.key === selectedMonth)?.label || ''}`}
          </span>
          <div className="font-bold text-lg text-neutral-900 mt-0.5 font-mono-nums">
            ${currentFilteredKPIs.totalSalesUSD.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-neutral-400 font-mono">
            {new Intl.NumberFormat('fr-FR').format(currentFilteredKPIs.totalSalesCDF)} FC
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-neutral-200 shadow-2xs">
          <span className="text-[10px] text-neutral-500 uppercase tracking-wider block font-semibold">
            Espèces Cash Encaissées
          </span>
          <div className="font-bold text-lg text-emerald-700 mt-0.5 font-mono-nums">
            ${currentFilteredKPIs.cashSalesUSD.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-emerald-600 font-medium">
            Tiroir-caisse physique
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-neutral-200 shadow-2xs">
          <span className="text-[10px] text-neutral-500 uppercase tracking-wider block font-semibold">
            Mobile Money & Banque
          </span>
          <div className="font-bold text-lg text-amber-600 mt-0.5 font-mono-nums">
            ${currentFilteredKPIs.mobileMoneyUSD.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-neutral-400">
            M-Pesa, Orange, Airtel
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-neutral-200 shadow-2xs">
          <span className="text-[10px] text-neutral-500 uppercase tracking-wider block font-semibold">
            TVA 16% DGI Collectée
          </span>
          <div className="font-bold text-lg text-blue-700 mt-0.5 font-mono-nums">
            ${currentFilteredKPIs.vatCollectedUSD.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-neutral-400">
            Part fiscale déclarée
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-neutral-200 shadow-2xs col-span-2 lg:col-span-1">
          <span className="text-[10px] text-neutral-500 uppercase tracking-wider block font-semibold">
            Bilan des Écarts de Caisse
          </span>
          <div className={`font-bold text-lg mt-0.5 font-mono-nums ${
            currentFilteredKPIs.netDifferenceUSD === 0
              ? 'text-emerald-700'
              : currentFilteredKPIs.netDifferenceUSD > 0
              ? 'text-blue-700'
              : 'text-rose-600'
          }`}>
            {currentFilteredKPIs.netDifferenceUSD >= 0 ? `+$${currentFilteredKPIs.netDifferenceUSD.toFixed(2)}` : `-$${Math.abs(currentFilteredKPIs.netDifferenceUSD).toFixed(2)}`}
          </div>
          <span className="text-[10px] text-neutral-500">
            Conformité : <strong>{currentFilteredKPIs.complianceRate.toFixed(1)}%</strong>
          </span>
        </div>
      </div>

      {/* ================= TABLE OF CLOSED SESSIONS ================= */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs overflow-hidden">
        <div className="p-4 bg-neutral-50/70 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-sm text-neutral-900 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-neutral-600" />
              <span>Rapports de Clôture de Caisse ({filteredSessions.length} sessions)</span>
            </h3>
            <p className="text-xs text-neutral-500">
              {selectedMonth === 'ALL'
                ? 'Historique complet des sessions de tous les mois'
                : `Sessions clôturées pour le mois de ${availableMonths.find(m => m.key === selectedMonth)?.label || selectedMonth}`}
            </p>
          </div>

          <div className="text-xs text-neutral-500">
            Cliquez sur <strong className="text-neutral-800">Rapport Z</strong> pour afficher et télécharger le rapport certifié
          </div>
        </div>

        {filteredSessions.length === 0 ? (
          <div className="text-center py-16 text-neutral-400 text-xs space-y-2">
            <Calendar className="w-8 h-8 mx-auto text-neutral-300 stroke-1" />
            <p className="font-semibold text-neutral-600">Aucun rapport de clôture trouvé pour ces critères.</p>
            <p className="text-[11px] text-neutral-400">
              Modifiez la sélection du mois ou réinitialisez les filtres de recherche.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/90 text-neutral-700 uppercase text-[10px] font-bold">
                  <th className="py-3 px-3">N° Session</th>
                  <th className="py-3 px-3">Statut</th>
                  <th className="py-3 px-3">Date d'Ouverture</th>
                  <th className="py-3 px-3">Date de Clôture</th>
                  <th className="py-3 px-3">Caissier</th>
                  <th className="py-3 px-3">Superviseur</th>
                  <th className="py-3 px-3 text-right">CA Total ($)</th>
                  <th className="py-3 px-3 text-right">Espèces ($)</th>
                  <th className="py-3 px-3 text-right">Écart ($)</th>
                  <th className="py-3 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 font-mono-nums">
                {filteredSessions.map((session) => {
                  const hasDiscrepancy = session.differenceUSD !== undefined && session.differenceUSD !== 0;
                  const isPositive = (session.differenceUSD || 0) > 0;

                  return (
                    <tr key={session.id} className="hover:bg-neutral-50/70 transition-colors">
                      {/* Session Number */}
                      <td className="py-3 px-3 font-bold text-neutral-900 font-sans">
                        <span className="font-mono text-xs text-neutral-900 bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-200">
                          {session.sessionNumber}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 font-sans">
                        {session.status === 'OPEN' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                            OUVERTE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-700 border border-neutral-200">
                            CLÔTURÉE
                          </span>
                        )}
                      </td>

                      {/* Dates */}
                      <td className="py-3 px-3 text-neutral-600 font-sans">
                        {formatDateTime(session.openedAt)}
                      </td>
                      <td className="py-3 px-3 text-neutral-600 font-sans">
                        {session.closedAt ? formatDateTime(session.closedAt) : (
                          <span className="text-amber-600 font-medium italic">En cours</span>
                        )}
                      </td>

                      {/* Cashier & Supervisor */}
                      <td className="py-3 px-3 font-sans font-medium text-neutral-800">
                        {session.cashierName}
                      </td>
                      <td className="py-3 px-3 font-sans text-neutral-500">
                        {session.supervisorName || 'Direction'}
                      </td>

                      {/* Total Sales */}
                      <td className="py-3 px-3 text-right font-bold text-neutral-900">
                        ${(session.totalSalesUSD || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Cash Sales */}
                      <td className="py-3 px-3 text-right text-emerald-700 font-medium">
                        ${(session.cashSalesUSD || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                      </td>

                      {/* Discrepancy */}
                      <td className="py-3 px-3 text-right">
                        {session.status === 'OPEN' ? (
                          <span className="text-neutral-400">—</span>
                        ) : !hasDiscrepancy ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            0.00$
                          </span>
                        ) : isPositive ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                            +${session.differenceUSD?.toFixed(2)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            -${Math.abs(session.differenceUSD || 0).toFixed(2)}
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onSelectReportSession(session)}
                            className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-bold text-[11px] font-sans inline-flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                            title="Consulter le rapport officiel Z de cette session (PDF & impression)"
                          >
                            <FileText className="w-3.5 h-3.5 text-amber-400" />
                            <span>Rapport Z</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setSessionToDelete(session)}
                            className="p-1 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title={`Supprimer définitivement la session ${session.sessionNumber}`}
                            aria-label="Supprimer session"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Session Deletion */}
      <ConfirmDeleteModal
        isOpen={!!sessionToDelete}
        title="Supprimer la session de caisse"
        message={`Êtes-vous sûr de vouloir supprimer définitivement la session de caisse ${sessionToDelete?.sessionNumber} ?`}
        details={sessionToDelete ? `Session : ${sessionToDelete.sessionNumber} · Caissier : ${sessionToDelete.cashierName} · Date : ${formatDateTime(sessionToDelete.openedAt)}` : undefined}
        confirmText="Supprimer la session"
        onConfirm={() => {
          if (sessionToDelete) {
            deleteCashSession(sessionToDelete.id);
            setSessionToDelete(null);
          }
        }}
        onCancel={() => setSessionToDelete(null)}
      />
    </div>
  );
};
