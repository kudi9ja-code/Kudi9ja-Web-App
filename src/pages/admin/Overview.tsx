import type { ReactNode } from 'react';
import { AlarmClock, ArrowDownLeft, ArrowUpRight, ClipboardList, CreditCard, HandCoins, Landmark, /* PiggyBank, */ TrendingUp, Users, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { IconBadge, StatTile } from '../../components/ui/Bits';
import { Card, SectionHeader } from '../../components/ui/Card';
import { PageSpinner } from '../../components/ui/Spinner';
import { useAdminApplications, useOverview } from '../../hooks/queries';
import { formatNumber, naira, relative } from '../../lib/format';
import { auditStyle } from '../../lib/labels';
import { useProfile } from '../../state/session';
import { firstName } from '../../lib/format';

export default function Overview() {
  const overview = useOverview();
  const applications = useAdminApplications('PENDING');
  const profile = useProfile();
  if (overview.isLoading) return <PageSpinner />;
  const o = overview.data;
  if (!o) return null;

  const queues = [
    { to: '/admin/payments', icon: <ArrowUpRight />, label: 'Withdrawals to approve', count: o.queues.pendingWithdrawals, value: o.queues.pendingWithdrawalValue, late: o.queues.withdrawalsBreachingSla },
    { to: '/admin/lending', icon: <ClipboardList />, label: 'Loan applications', count: applications.data?.totalItems ?? 0 },
    {
      to: '/admin/book/outstanding',
      icon: <Landmark />,
      label: 'Still owed on running loans',
      count: o.book.activeLoans + o.book.overdueLoans,
      figure: naira(o.book.totalOutstanding),
      note: `${formatNumber(o.book.activeLoans + o.book.overdueLoans)} running · falls with every repayment`,
    },
    { to: '/admin/payments', icon: <ArrowDownLeft />, label: 'Older receipt claims', count: o.queues.pendingPayIns, value: o.queues.pendingPayInValue, late: o.queues.payInsBreachingSla },
  ].filter((q) => q.count > 0 || q.label !== 'Older receipt claims');
  const customersNote = `${formatNumber(o.people.newThisWeek)} new this week · ${formatNumber(o.people.frozenCustomers)} frozen`;
  // Customers fills the top row when there's room; otherwise it sits with the figures below.
  const customersOnTop = queues.length < 4;
  const topCards: { to: string; icon: JSX.Element; label: string; count: number; figure?: string; value?: number; late?: number; note?: string }[] = customersOnTop
    ? [...queues, { to: '/admin/customers', icon: <Users />, label: 'Customers', count: o.people.customers, note: customersNote }]
    : queues;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Overview" title={`Good to see you, ${firstName(profile.fullName)}`} subtitle={`Updated ${relative(o.generatedAt)}`} />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {topCards.map((q) => (
          <Link key={q.label} to={q.to} className="rounded-2xl border border-stroke bg-surface p-4 transition hover:-translate-y-px hover:border-gold/40">
            <div className="flex items-center justify-between">
              <IconBadge size={38} tone={q.count ? 'gold' : 'neutral'}>{q.icon}</IconBadge>
              {!!q.late && (
                <span className="flex items-center gap-1 text-[12px] font-bold text-danger">
                  <AlarmClock className="h-3.5 w-3.5" /> {formatNumber(q.late)} late
                </span>
              )}
            </div>
            <p className="num mt-3 text-3xl font-extrabold [overflow-wrap:anywhere]">{q.figure ?? formatNumber(q.count)}</p>
            <p className="text-[13px] text-ink-2">{q.label}</p>
            {q.value !== undefined && <p className="num text-[12px] text-ink-3">{naira(q.value)}</p>}
            {q.note && <p className="text-[12px] text-ink-3">{q.note}</p>}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <TileLink to="/admin/book/held">
          <StatTile className={tileClass} label="Customer money held" value={naira(o.customerFundsHeld)} icon={<Wallet />} footnote="Wallet balances" />
        </TileLink>
        {/* Savings is switched off for now.
        <StatTile label="Saved" value={naira(o.book.totalSaved)} icon={<PiggyBank />} tone="info" footnote={`${formatNumber(o.book.activePlans)} active plans`} />
        */}
        <TileLink to="/admin/book/lent">
          <StatTile className={tileClass} label="Lent" value={naira(o.book.totalLent)} icon={<CreditCard />} footnote={`${formatNumber(o.book.activeLoans)} active · ${formatNumber(o.book.repaidLoans)} repaid`} />
        </TileLink>
        <TileLink to="/admin/repayments">
          <StatTile
            className={tileClass}
            label="Repaid by customers"
            value={naira(o.book.totalRepaid)}
            icon={<HandCoins />}
            tone="success"
            footnote={`${formatNumber(o.book.repayments)} repayments · ${naira(o.book.repaidThisMonth)} this month`}
          />
        </TileLink>
        <TileLink to="/admin/book/overdue">
          <StatTile className={tileClass} label="Overdue" value={naira(o.book.totalOverdue)} icon={<AlarmClock />} tone={o.book.totalOverdue > 0 ? 'danger' : 'neutral'} footnote={`${formatNumber(o.book.loansBehind ?? o.book.overdueLoans)} loans with missed payments`} />
        </TileLink>
        <TileLink to="/admin/book/interest">
          <StatTile className={tileClass} label="Interest charged" value={naira(o.book.totalInterestCharged)} icon={<TrendingUp />} tone="success" />
        </TileLink>
        <TileLink to="/admin/book/fees">
          <StatTile className={tileClass} label="Fees charged" value={naira(o.book.totalFeesCharged)} icon={<TrendingUp />} tone="success" />
        </TileLink>
        {/* Interest paid out is what savings plans earned; savings is switched off for now.
        <StatTile label="Interest paid out" value={naira(o.book.totalInterestPaid)} icon={<PiggyBank />} />
        */}
        {!customersOnTop && (
          <TileLink to="/admin/customers">
            <StatTile className={tileClass} label="Customers" value={formatNumber(o.people.customers)} icon={<Users />} footnote={customersNote} />
          </TileLink>
        )}
      </div>

      <Card padded={false}>
        <div className="p-5 pb-3">
          <SectionHeader title="Recent activity" action="Audit log" actionTo="/admin/audit" className="mb-0" />
        </div>
        <ul className="divide-y divide-stroke">
          {o.recentActivity.slice(0, 12).map((a) => {
            const st = auditStyle[a.category];
            const Icon = st.icon;
            return (
              <li key={a.id} className="flex gap-3 px-5 py-3">
                <IconBadge size={34} tone={st.tone}>
                  <Icon />
                </IconBadge>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{a.action}</p>
                  <p className="break-words text-[12.5px] text-ink-3">{a.detail}</p>
                  <p className="mt-0.5 truncate text-[11.5px] text-ink-3">{a.actor}</p>
                </div>
                <p className="shrink-0 text-right text-[11.5px] text-ink-3">{relative(a.date)}</p>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}

const tileClass = 'h-full transition hover:border-gold/35';

/** Every figure opens the list it was added up from. */
function TileLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="block rounded-2xl transition hover:-translate-y-px">
      {children}
    </Link>
  );
}
