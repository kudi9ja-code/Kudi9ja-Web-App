import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarClock,
  // Calculator,
  CreditCard,
  Eye,
  EyeOff,
  // PiggyBank, // savings and Ajo circles are switched off for now
  ReceiptText,
  TrendingUp,
  // Users,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../../components/PageHeader';
import { TransactionRow } from '../../components/TransactionList';
import { EmptyState, IconBadge, Notice, StatTile } from '../../components/ui/Bits';
import { Button } from '../../components/ui/Button';
import { Card, SectionHeader } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Spinner';
import { useDashboard, useTransactions } from '../../hooks/queries';
import { asDay, firstName, greeting, naira /* , rateOf */ } from '../../lib/format';
import { useProfile, useSession } from '../../state/session';
import { useSettings } from '../../state/settings';

export default function Dashboard() {
  const profile = useProfile();
  const { setHideBalance } = useSession();
  const settings = useSettings();
  const dash = useDashboard();
  const recent = useTransactions('ALL', 6);
  const hidden = profile.hideBalance;
  const d = dash.data;
  const money = (n?: number) => (hidden ? '₦ ••••••' : naira(n ?? 0));

  return (
    <div className="space-y-6">
      <PageHeader eyebrow={greeting()} title={`Hello, ${firstName(profile.fullName)}`} subtitle="Here is where your money stands today." />

      {profile.accountStatus === 'FROZEN' && (
        <Notice tone="info" title="Your account is frozen">
          You can see your money, but nothing can move until support lifts the freeze. Write to {settings.company.supportEmail}.
        </Notice>
      )}

      <Card gradient glow className="p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow text-ink-3">Wallet balance</p>
            {dash.isLoading ? (
              <Skeleton className="mt-3 h-10 w-56" />
            ) : (
              <p className="num mt-2 text-[34px] font-extrabold tracking-[-0.03em] sm:text-[42px]">{money(d?.balance)}</p>
            )}
            <p className="mt-1 text-[13px] text-ink-3">
              Account {profile.customerRef}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setHideBalance(!hidden)}
            className="grid h-10 w-10 place-items-center rounded-full border border-stroke text-ink-2 transition hover:text-gold"
            aria-label={hidden ? 'Show balances' : 'Hide balances'}
          >
            {hidden ? <Eye className="h-[18px] w-[18px]" /> : <EyeOff className="h-[18px] w-[18px]" />}
          </button>
        </div>
        <div className="mt-6 flex flex-wrap gap-2.5">
          <Button to="/app/wallet/add" icon={<ArrowDownLeft className="h-4 w-4" />}>
            Add money
          </Button>
          <Button to="/app/wallet/withdraw" variant="ghost" icon={<ArrowUpRight className="h-4 w-4" />}>
            Withdraw
          </Button>
          {/* Savings is switched off for now.
          <Button to="/app/savings/new" variant="ghost" icon={<PiggyBank className="h-4 w-4" />}>
            Save
          </Button>
          */}
          {settings.switches.lendingEnabled && (
            <Button to="/app/loans" variant="ghost" icon={<CreditCard className="h-4 w-4" />}>
              Borrow
            </Button>
          )}
        </div>
      </Card>

      {d?.nextRepayment && (
        <Card accent={d.nextRepayment.daysUntilDue < 0 ? 'danger' : 'gold'} to={`/app/loans/${d.nextRepayment.loanId}`}>
          <div className="flex items-center gap-4">
            <IconBadge tone={d.nextRepayment.daysUntilDue < 0 ? 'danger' : 'gold'}>
              <CalendarClock />
            </IconBadge>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">
                {d.nextRepayment.daysUntilDue < 0
                  ? `Repayment overdue by ${Math.abs(d.nextRepayment.daysUntilDue)} days`
                  : d.nextRepayment.daysUntilDue === 0
                    ? 'Repayment due today'
                    : `Next repayment in ${d.nextRepayment.daysUntilDue} days`}
              </p>
              <p className="text-[13px] text-ink-3">
                Instalment {d.nextRepayment.installmentNumber} · {d.nextRepayment.purpose} · due {asDay(d.nextRepayment.dueDate)}
              </p>
            </div>
            <p className="num text-lg font-extrabold">{naira(d.nextRepayment.amount)}</p>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {/* Savings is switched off for now.
        <StatTile label="Saved" value={money(d?.totalSaved)} icon={<PiggyBank />} footnote={`${d?.activePlans ?? 0} active plans`} />
        <StatTile
          label="Interest earned"
          value={money(d?.totalInterestEarned)}
          icon={<TrendingUp />}
          tone="success"
          footnote="All time"
        />
        */}
        <StatTile label="You owe" value={money(d?.totalOwed)} icon={<CreditCard />} tone={d?.totalOwed ? 'danger' : 'neutral'} footnote={`${d?.activeLoans ?? 0} open loans`} />
        {/* Ajo circles are switched off for now.
        <StatTile label="In Ajo circles" value={money(d?.thriftCommitted)} icon={<Users />} tone="info" footnote={`${d?.activeCircles ?? 0} circles`} />
        */}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section>
          <SectionHeader title="Recent activity" action="See all" actionTo="/app/wallet" />
          <Card padded={false}>
            {recent.isLoading ? (
              <div className="space-y-3 p-4">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : recent.data?.items.length ? (
              <div className="divide-y divide-stroke">
                {recent.data.items.slice(0, 6).map((tx) => (
                  <TransactionRow key={tx.id} tx={tx} hidden={hidden} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<ReceiptText />}
                title="Nothing yet"
                message="Add money to your wallet to get started."
                action={<Button to="/app/wallet/add">Add money</Button>}
              />
            )}
          </Card>
        </section>

        <section>
          <SectionHeader title="Plan ahead" />
          <div className="space-y-3">
            {/* Savings is switched off for now.
            <ShortcutCard
              to="/app/savings/calculator"
              icon={<Calculator />}
              title="Savings calculator"
              body={`See what a fixed plan earns at ${rateOf(settings.savings.annualRate)} a year.`}
            />
            */}
            {settings.switches.lendingEnabled && (
              <ShortcutCard to="/app/loans/calculator" icon={<CreditCard />} title="Loan calculator" body="What you would repay, before you apply." />
            )}
            <ShortcutCard to="/app/insights" icon={<TrendingUp />} title="Insights" body="Where your money went this month." />
          </div>
        </section>
      </div>
    </div>
  );
}

function ShortcutCard({ to, icon, title, body }: { to: string; icon: ReactNode; title: string; body: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-4 rounded-2xl border border-stroke bg-surface p-4 transition hover:-translate-y-px hover:border-gold/35"
    >
      <IconBadge size={40}>{icon}</IconBadge>
      <div className="min-w-0">
        <p className="text-sm font-bold">{title}</p>
        <p className="text-[12.5px] text-ink-3">{body}</p>
      </div>
    </Link>
  );
}
