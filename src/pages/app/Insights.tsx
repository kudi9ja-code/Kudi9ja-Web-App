import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { LineChart as LineIcon } from 'lucide-react';
import { PageHeader } from '../../components/PageHeader';
import { EmptyState, StatTile } from '../../components/ui/Bits';
import { Card, SectionHeader } from '../../components/ui/Card';
import { PageSpinner } from '../../components/ui/Spinner';
import { useDashboard, useTransactions } from '../../hooks/queries';
import { naira, nairaFlat } from '../../lib/format';
import type { Transaction, TxKind } from '../../types/api';

const KIND_LABEL: Record<TxKind, string> = {
  DEPOSIT: 'Paid in',
  WITHDRAWAL: 'Withdrawn',
  SAVINGS_LOCK: 'Saved',
  INTEREST_PAYOUT: 'Interest',
  SAVINGS_RELEASE: 'Savings returned',
  LOAN_DISBURSEMENT: 'Loans received',
  LOAN_REPAYMENT: 'Loan repayments',
  FEE: 'Fees',
};

// Categorical slots, in order; resolved from the theme's tokens so they read in light and dark.
const SLICE = ['rgb(var(--gold))', 'rgb(var(--info))', 'rgb(var(--success))', 'rgb(var(--danger))', 'rgb(var(--ink-3))'];

/** Where the money went, from the customer's own ledger. Read-only. */
export default function Insights() {
  const dash = useDashboard();
  const tx = useTransactions('ALL', 500);

  const data = useMemo(() => summarise(tx.data?.items ?? []), [tx.data]);
  if (tx.isLoading || dash.isLoading) return <PageSpinner />;
  const d = dash.data;

  if (!tx.data?.items.length) {
    return (
      <div className="mx-auto max-w-4xl">
        <PageHeader title="Insights" />
        <Card>
          <EmptyState icon={<LineIcon />} title="Nothing to analyse yet" message="Once money moves through your wallet, your patterns show up here." />
        </Card>
      </div>
    );
  }

  const holdings = [
    { name: 'In your wallet', value: d?.balance ?? 0 },
    // Savings and Ajo circles are switched off for now.
    // { name: 'Locked in savings', value: d?.totalSaved ?? 0 },
    // { name: 'In Ajo circles', value: d?.thriftCommitted ?? 0 },
  ].filter((h) => h.value > 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Insights" subtitle="The last six months, from your own history." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Net worth" value={naira(d?.netWorth ?? 0)} footnote="Wallet − loans" />
        {/* Interest received came from savings, which is switched off for now.
        <StatTile label="Interest received" value={naira(data.interest)} tone="success" footnote="All time" />
        */}
        <StatTile label="Fees paid" value={naira(data.fees)} tone="danger" footnote="All time" />
        <StatTile label="Owed on loans" value={naira(d?.totalOwed ?? 0)} tone={d?.totalOwed ? 'danger' : 'neutral'} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <SectionHeader title="Money in and out" />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.months} barGap={4}>
                <CartesianGrid vertical={false} stroke="rgb(var(--stroke))" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: 'rgb(var(--ink-3))', fontSize: 12 }} />
                <YAxis tickFormatter={(v: number) => nairaFlat(v)} tickLine={false} axisLine={false} width={96} tick={{ fill: 'rgb(var(--ink-3))', fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: 'rgb(var(--surface-alt))' }}
                  contentStyle={{ background: 'rgb(var(--surface))', border: '1px solid rgb(var(--stroke))', borderRadius: 12 }}
                  formatter={(v: number, name: string) => [naira(v), name === 'in' ? 'Money in' : 'Money out']}
                />
                <Bar dataKey="in" fill="rgb(var(--success))" radius={[6, 6, 0, 0]} maxBarSize={28} />
                <Bar dataKey="out" fill="rgb(var(--gold))" radius={[6, 6, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex gap-5 text-[12.5px] text-ink-2">
            <Legend color="rgb(var(--success))" label="Money in" />
            <Legend color="rgb(var(--gold))" label="Money out" />
          </div>
        </Card>

        <Card>
          <SectionHeader title="Everything you hold" />
          <Donut rows={holdings} />
        </Card>
      </div>

      <Card>
        <SectionHeader title="Where your money went" />
        <ul className="space-y-3">
          {data.outByKind.map((k) => (
            <li key={k.name}>
              <div className="mb-1 flex justify-between text-[13px]">
                <span className="font-semibold">{k.name}</span>
                <span className="num font-bold">{naira(k.value)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-surface-high">
                <div className="h-full rounded-full gold-gradient" style={{ width: `${(k.value / (data.outByKind[0]?.value || 1)) * 100}%` }} />
              </div>
            </li>
          ))}
          {!data.outByKind.length && <p className="text-sm text-ink-3">Nothing has gone out yet.</p>}
        </ul>
      </Card>
    </div>
  );
}

function Donut({ rows }: { rows: { name: string; value: number }[] }) {
  const total = rows.reduce((s, r) => s + r.value, 0);
  if (!total) return <p className="text-sm text-ink-3">Nothing held yet.</p>;
  return (
    <div>
      <div className="relative mx-auto h-52 w-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={rows} dataKey="value" nameKey="name" innerRadius={62} outerRadius={92} paddingAngle={2} stroke="rgb(var(--surface))" strokeWidth={2}>
              {rows.map((r, i) => (
                <Cell key={r.name} fill={SLICE[i % SLICE.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-[11px] text-ink-3">Total</p>
            <p className="num text-base font-extrabold">{naira(total)}</p>
          </div>
        </div>
      </div>
      <ul className="mt-4 space-y-2">
        {rows.map((r, i) => (
          <li key={r.name} className="flex items-center justify-between text-[13px]">
            <Legend color={SLICE[i % SLICE.length]!} label={r.name} />
            <span className="num font-bold">
              {naira(r.value)} <span className="text-ink-3">· {Math.round((r.value / total) * 100)}%</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-2.5 w-2.5 rounded-sm" style={{ background: color }} />
      {label}
    </span>
  );
}

function summarise(items: Transaction[]) {
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleString('en-NG', { month: 'short' }), in: 0, out: 0 };
  });
  const byKey = new Map(months.map((m) => [m.key, m]));
  const out = new Map<string, number>();
  let interest = 0;
  let fees = 0;
  for (const t of items) {
    if (t.status === 'REVERSED') continue;
    if (t.kind === 'INTEREST_PAYOUT') interest += t.amount;
    if (t.kind === 'FEE') fees += t.amount;
    const d = new Date(t.occurredAt);
    const m = byKey.get(`${d.getFullYear()}-${d.getMonth()}`);
    if (m) {
      if (t.credit) m.in += t.amount;
      else m.out += t.amount;
    }
    if (!t.credit) out.set(KIND_LABEL[t.kind], (out.get(KIND_LABEL[t.kind]) ?? 0) + t.amount);
  }
  const outByKind = [...out.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  return { months, interest, fees, outByKind };
}
