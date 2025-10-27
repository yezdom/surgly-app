import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  Download,
  Calendar,
  TrendingUp,
  DollarSign,
  Eye,
  MousePointer,
  FileText,
  Sparkles,
  Settings as SettingsIcon,
  ChevronDown,
} from 'lucide-react';
import { getAdAccounts, getCampaigns } from '../lib/facebookService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];

export default function Reports() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [adAccounts, setAdAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [aiInsights, setAiInsights] = useState<string>('');
  const [generatingInsights, setGeneratingInsights] = useState(false);
  const [showWhiteLabelSettings, setShowWhiteLabelSettings] = useState(false);
  const [whiteLabelSettings, setWhiteLabelSettings] = useState({
    companyName: '',
    logo: '',
    primaryColor: '#3b82f6',
    brandingEnabled: false,
  });
  const [compareMode, setCompareMode] = useState(false);
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'name',
    direction: 'asc',
  });

  useEffect(() => {
    loadData();
    loadWhiteLabelSettings();
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      loadCampaigns();
    }
  }, [selectedAccount, startDate, endDate]);

  async function loadData() {
    try {
      setLoading(true);
      const accounts = await getAdAccounts();
      setAdAccounts(accounts);
      if (accounts.length > 0) {
        setSelectedAccount(accounts[0].id);
      }
    } catch (error) {
      console.error('Failed to load ad accounts:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadCampaigns() {
    try {
      const data = await getCampaigns(selectedAccount, startDate, endDate);
      setCampaigns(data);
    } catch (error) {
      console.error('Failed to load campaigns:', error);
    }
  }

  async function loadWhiteLabelSettings() {
    try {
      const { data } = await supabase
        .from('white_label_settings')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (data) {
        setWhiteLabelSettings({
          companyName: data.company_name || '',
          logo: data.logo_url || '',
          primaryColor: data.primary_color || '#3b82f6',
          brandingEnabled: data.branding_enabled || false,
        });
      }
    } catch (error) {
      console.error('Failed to load white-label settings:', error);
    }
  }

  async function generateAIInsights() {
    setGeneratingInsights(true);
    try {
      const campaignData = campaigns.map((c) => ({
        name: c.name,
        spend: c.insights?.spend || '0',
        impressions: c.insights?.impressions || '0',
        clicks: c.insights?.clicks || '0',
        ctr: c.insights?.ctr || '0',
      }));

      const response = await fetch('/api/generate-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaigns: campaignData }),
      });

      const data = await response.json();
      setAiInsights(data.insights);
    } catch (error) {
      console.error('Failed to generate insights:', error);
      setAiInsights('Unable to generate insights at this time.');
    } finally {
      setGeneratingInsights(false);
    }
  }

  function exportToCSV() {
    const headers = ['Campaign', 'Status', 'Spend', 'Impressions', 'Clicks', 'CTR', 'CPC'];
    const rows = campaigns.map((c) => [
      c.name,
      c.status,
      c.insights?.spend || '0',
      c.insights?.impressions || '0',
      c.insights?.clicks || '0',
      c.insights?.ctr || '0',
      c.insights?.cpc || '0',
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `campaigns-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  }

  function exportToExcel() {
    const data = campaigns.map((c) => ({
      Campaign: c.name,
      Status: c.status,
      Spend: c.insights?.spend || '0',
      Impressions: c.insights?.impressions || '0',
      Clicks: c.insights?.clicks || '0',
      CTR: c.insights?.ctr || '0',
      CPC: c.insights?.cpc || '0',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Campaigns');
    XLSX.writeFile(wb, `campaigns-report-${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  function exportToPDF() {
    const doc = new jsPDF();

    if (whiteLabelSettings.brandingEnabled && whiteLabelSettings.companyName) {
      doc.setFontSize(20);
      doc.text(whiteLabelSettings.companyName, 14, 20);
    } else {
      doc.setFontSize(20);
      doc.text('Campaign Performance Report', 14, 20);
    }

    doc.setFontSize(10);
    doc.text(`Date Range: ${startDate} to ${endDate}`, 14, 30);

    const tableData = campaigns.map((c) => [
      c.name,
      c.status,
      `$${c.insights?.spend || '0'}`,
      c.insights?.impressions || '0',
      c.insights?.clicks || '0',
      `${c.insights?.ctr || '0'}%`,
      `$${c.insights?.cpc || '0'}`,
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['Campaign', 'Status', 'Spend', 'Impressions', 'Clicks', 'CTR', 'CPC']],
      body: tableData,
    });

    doc.save(`campaigns-report-${new Date().toISOString().split('T')[0]}.pdf`);
  }

  const totalSpend = campaigns.reduce(
    (sum, c) => sum + parseFloat(c.insights?.spend || '0'),
    0
  );
  const totalImpressions = campaigns.reduce(
    (sum, c) => sum + parseInt(c.insights?.impressions || '0'),
    0
  );
  const totalClicks = campaigns.reduce(
    (sum, c) => sum + parseInt(c.insights?.clicks || '0'),
    0
  );
  const avgCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0';

  const chartData = campaigns.slice(0, 10).map((c) => ({
    name: c.name.substring(0, 20),
    spend: parseFloat(c.insights?.spend || '0'),
    clicks: parseInt(c.insights?.clicks || '0'),
    impressions: parseInt(c.insights?.impressions || '0') / 1000,
    ctr: parseFloat(c.insights?.ctr || '0'),
  }));

  const pieData = campaigns.slice(0, 6).map((c) => ({
    name: c.name.substring(0, 20),
    value: parseFloat(c.insights?.spend || '0'),
  }));

  function handleSort(key: string) {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc',
    });
  }

  const sortedCampaigns = [...campaigns].sort((a, b) => {
    const aValue = a.insights?.[sortConfig.key] || a[sortConfig.key] || '0';
    const bValue = b.insights?.[sortConfig.key] || b[sortConfig.key] || '0';

    if (sortConfig.direction === 'asc') {
      return aValue > bValue ? 1 : -1;
    }
    return aValue < bValue ? 1 : -1;
  });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-text-light-primary dark:text-text-dark-primary mb-2">
              Reports & Analytics
            </h1>
            <p className="text-text-light-secondary dark:text-text-dark-secondary">
              Comprehensive campaign performance analysis
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowWhiteLabelSettings(!showWhiteLabelSettings)}
              className="px-4 py-2 bg-light-primary dark:bg-dark-secondary border border-border-light dark:border-border-dark rounded-lg hover:shadow transition flex items-center gap-2"
            >
              <SettingsIcon className="w-4 h-4" />
              White Label
            </button>
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-light-primary dark:bg-dark-secondary border border-border-light dark:border-border-dark rounded-lg hover:shadow transition flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              CSV
            </button>
            <button
              onClick={exportToExcel}
              className="px-4 py-2 bg-light-primary dark:bg-dark-secondary border border-border-light dark:border-border-dark rounded-lg hover:shadow transition flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Excel
            </button>
            <button
              onClick={exportToPDF}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              PDF
            </button>
          </div>
        </div>

        {showWhiteLabelSettings && (
          <div className="bg-light-primary dark:bg-dark-secondary border border-border-light dark:border-border-dark rounded-xl p-6 mb-6">
            <h3 className="text-lg font-bold text-text-light-primary dark:text-text-dark-primary mb-4">
              White Label Settings
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Company Name</label>
                <input
                  type="text"
                  value={whiteLabelSettings.companyName}
                  onChange={(e) =>
                    setWhiteLabelSettings({ ...whiteLabelSettings, companyName: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-light-secondary dark:bg-dark-tertiary border border-border-light dark:border-border-dark rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Primary Color</label>
                <input
                  type="color"
                  value={whiteLabelSettings.primaryColor}
                  onChange={(e) =>
                    setWhiteLabelSettings({ ...whiteLabelSettings, primaryColor: e.target.value })
                  }
                  className="w-full h-10 rounded-lg"
                />
              </div>
            </div>
            <label className="flex items-center gap-2 mt-4">
              <input
                type="checkbox"
                checked={whiteLabelSettings.brandingEnabled}
                onChange={(e) =>
                  setWhiteLabelSettings({
                    ...whiteLabelSettings,
                    brandingEnabled: e.target.checked,
                  })
                }
              />
              <span>Enable custom branding on exports</span>
            </label>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2">
              Ad Account
            </label>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full px-4 py-2 bg-light-primary dark:bg-dark-secondary border border-border-light dark:border-border-dark rounded-lg"
            >
              {adAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 bg-light-primary dark:bg-dark-secondary border border-border-light dark:border-border-dark rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary mb-2">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 bg-light-primary dark:bg-dark-secondary border border-border-light dark:border-border-dark rounded-lg"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-light-primary dark:bg-dark-secondary border border-border-light dark:border-border-dark rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-1">
              Total Spend
            </p>
            <p className="text-3xl font-bold text-text-light-primary dark:text-text-dark-primary">
              ${totalSpend.toFixed(2)}
            </p>
          </div>

          <div className="bg-light-primary dark:bg-dark-secondary border border-border-light dark:border-border-dark rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <Eye className="w-8 h-8 text-blue-500" />
            </div>
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-1">
              Total Impressions
            </p>
            <p className="text-3xl font-bold text-text-light-primary dark:text-text-dark-primary">
              {totalImpressions.toLocaleString()}
            </p>
          </div>

          <div className="bg-light-primary dark:bg-dark-secondary border border-border-light dark:border-border-dark rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <MousePointer className="w-8 h-8 text-purple-500" />
            </div>
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-1">
              Total Clicks
            </p>
            <p className="text-3xl font-bold text-text-light-primary dark:text-text-dark-primary">
              {totalClicks.toLocaleString()}
            </p>
          </div>

          <div className="bg-light-primary dark:bg-dark-secondary border border-border-light dark:border-border-dark rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-8 h-8 text-orange-500" />
            </div>
            <p className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-1">
              Average CTR
            </p>
            <p className="text-3xl font-bold text-text-light-primary dark:text-text-dark-primary">
              {avgCTR}%
            </p>
          </div>
        </div>

        <div className="bg-light-primary dark:bg-dark-secondary border border-border-light dark:border-border-dark rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-text-light-primary dark:text-text-dark-primary flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-500" />
              AI Insights & Recommendations
            </h2>
            <button
              onClick={generateAIInsights}
              disabled={generatingInsights}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition disabled:opacity-50"
            >
              {generatingInsights ? 'Generating...' : 'Generate Insights'}
            </button>
          </div>
          {aiInsights ? (
            <div className="text-text-light-secondary dark:text-text-dark-secondary whitespace-pre-wrap">
              {aiInsights}
            </div>
          ) : (
            <p className="text-text-light-secondary dark:text-text-dark-secondary">
              Click "Generate Insights" to get AI-powered recommendations for your campaigns
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-light-primary dark:bg-dark-secondary border border-border-light dark:border-border-dark rounded-xl p-6">
            <h3 className="text-lg font-bold text-text-light-primary dark:text-text-dark-primary mb-4">
              Campaign Spend
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="spend" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-light-primary dark:bg-dark-secondary border border-border-light dark:border-border-dark rounded-xl p-6">
            <h3 className="text-lg font-bold text-text-light-primary dark:text-text-dark-primary mb-4">
              Click-Through Rate
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="ctr" stroke="#8b5cf6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-light-primary dark:bg-dark-secondary border border-border-light dark:border-border-dark rounded-xl p-6">
            <h3 className="text-lg font-bold text-text-light-primary dark:text-text-dark-primary mb-4">
              Spend Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => entry.name}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-light-primary dark:bg-dark-secondary border border-border-light dark:border-border-dark rounded-xl p-6">
            <h3 className="text-lg font-bold text-text-light-primary dark:text-text-dark-primary mb-4">
              Impressions Trend
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="impressions"
                  stroke="#10b981"
                  fill="#10b98133"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-light-primary dark:bg-dark-secondary border border-border-light dark:border-border-dark rounded-xl p-6">
          <h3 className="text-lg font-bold text-text-light-primary dark:text-text-dark-primary mb-4">
            Campaign Details
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-light dark:border-border-dark">
                  <th
                    className="text-left py-3 px-4 cursor-pointer hover:bg-light-secondary dark:hover:bg-dark-tertiary"
                    onClick={() => handleSort('name')}
                  >
                    Campaign {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th
                    className="text-right py-3 px-4 cursor-pointer hover:bg-light-secondary dark:hover:bg-dark-tertiary"
                    onClick={() => handleSort('spend')}
                  >
                    Spend {sortConfig.key === 'spend' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="text-right py-3 px-4 cursor-pointer hover:bg-light-secondary dark:hover:bg-dark-tertiary"
                    onClick={() => handleSort('impressions')}
                  >
                    Impressions {sortConfig.key === 'impressions' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="text-right py-3 px-4 cursor-pointer hover:bg-light-secondary dark:hover:bg-dark-tertiary"
                    onClick={() => handleSort('clicks')}
                  >
                    Clicks {sortConfig.key === 'clicks' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="text-right py-3 px-4 cursor-pointer hover:bg-light-secondary dark:hover:bg-dark-tertiary"
                    onClick={() => handleSort('ctr')}
                  >
                    CTR {sortConfig.key === 'ctr' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                  <th
                    className="text-right py-3 px-4 cursor-pointer hover:bg-light-secondary dark:hover:bg-dark-tertiary"
                    onClick={() => handleSort('cpc')}
                  >
                    CPC {sortConfig.key === 'cpc' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedCampaigns.map((campaign) => (
                  <tr
                    key={campaign.id}
                    className="border-b border-border-light dark:border-border-dark hover:bg-light-secondary dark:hover:bg-dark-tertiary"
                  >
                    <td className="py-3 px-4">{campaign.name}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          campaign.status === 'ACTIVE'
                            ? 'bg-green-500/10 text-green-500'
                            : 'bg-gray-500/10 text-gray-500'
                        }`}
                      >
                        {campaign.status}
                      </span>
                    </td>
                    <td className="text-right py-3 px-4">
                      ${parseFloat(campaign.insights?.spend || '0').toFixed(2)}
                    </td>
                    <td className="text-right py-3 px-4">
                      {parseInt(campaign.insights?.impressions || '0').toLocaleString()}
                    </td>
                    <td className="text-right py-3 px-4">
                      {parseInt(campaign.insights?.clicks || '0').toLocaleString()}
                    </td>
                    <td className="text-right py-3 px-4">
                      {parseFloat(campaign.insights?.ctr || '0').toFixed(2)}%
                    </td>
                    <td className="text-right py-3 px-4">
                      ${parseFloat(campaign.insights?.cpc || '0').toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
