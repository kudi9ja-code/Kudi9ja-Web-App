import { useMemo, useState, type ReactNode } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { AlarmClock, CreditCard, Landmark, Search, TrendingUp, Wallet } from 'lucide-react';
import { PageHeader } from '../../components/PageHeader';
import { EmptyState, Pill, Segmented, StatTile } from '../../components/ui/Bits';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Field';
import { Skeleton } from '../../components/ui/Spinner';
import { useAdminBook } from '../../hooks/queries';
import { asDay, formatNumber, naira, rateOf, relative } from '../../lib/format';
import { loanTone } from '../../lib/labels';
import { termPhrase } from '../../lib/finance';
import type { BookLoanRow, WalletHolderRow } from '../../types/api';

/** The Overview figures, each opened into the list it was added up from. */
export type BookView = 'overdue' | 'outstanding' | 'lent' | 'interest' | 'fees' | 'held';

const VIEWS: { value: BookView; label: string }[] = [
  { value: 'overdue', label: 'Overdue' },
  { value: 'outstanding', label: 'Still owed' },
  { value: 'lent', label: 'Lent' },
  { value: 'interest', label: 'Interest charged' },
  { value: 'fees', label: 'Fees charged' },
  { value: 'held', label: 'Customer money held' },
];

const SUBTITLES: Record<BookView, string> = {
  overdue: 'Every running loan with an instalment past its day and unpaid, longest behind first.',
  outstanding: 'What customers still owe on the loans running now: loan, interest and fees, less repayments.',
  lent: 'Every loan paid out, running or closed, newest first.',
  interest: 'The interest charged on every loan paid out, running or closed, largest first.',
  fees: 'Management fees and transaction fees on every loan paid out, largest first.',
  held: 'Every wallet holding money, largest balance first.',
};

const sum = (rows: BookLoanRow[], f: (r: BookLoanRow) => number) => rows.reduce((t, r) => t + f(r), 0);
const time = (d?: string) => (d ? new Date(d).getTime() : 0);

export default function BookDetail() {
  const { view } = useParams<{ view: BookView }>();
  const navigate = useNavigate();
  const book = useAdminBook();
  const [query, setQuery] = useState('');

  const loans = useMemo(() => {
    const all = book.data?.loans ?? [];
    switch (view) {
      case 'overdue':
        return all.filter((r) => r.open && r.pastDue > 0).sort((a, b) => b.daysBehind - a.daysBehind || b.pastDue - a.pastDue);
      case 'outstanding':
        return all.filter((r) => r.open).sort((a, b) => b.outstanding - a.outstanding);
      case 'interest':
        return [...all].sort((a, b) => b.interest - a.interest);
      case 'fees':
        return [...all].sort((a, b) => b.fees - a.fees);
      default:
        return [...all].sort((a, b) => time(b.disbursedAt) - time(a.disbursedAt));
    }
  }, [book.data, view]);

  if (!view || !VIEWS.some((v) => v.value === view)) return <Navigate to="/admin/book/overdue" replace />;

  const q = query.trim().toLowerCase();
  const matches = (name: string, ref: string, phone?: string, officers: string[] = []) =>
    !q || [name, ref, phone ?? '', ...officers].some((v) => v.toLowerCase().includes(q));
  const shownLoans = loans.filter((r) => matches(r.customerName, r.customerRef, r.phone, r.officers));
  const shownWallets = (book.data?.wallets ?? []).filter((w) => matches(w.customerName, w.customerRef, w.phone));
  const title = VIEWS.find((v) => v.value === view)!.label;

  return (
    <div className="space-y-6">
      <PageHeader
        back="/admin"
        backLabel="Overview"
        title={title}
        subtitle={
          <>
            {SUBTITLES[view]}
            {book.data && <span className="block text-[12px] text-ink-3">Updated {relative(book.data.generatedAt)}</span>}
          </>
        }
      />
      <Segmented<BookView> size="sm" value={view} onChange={(v) => navigate(`/admin/book/${v}`)} options={VIEWS} />

      {book.isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : book.isError ? (
        <Card>
          <EmptyState icon={<Landmark />} title="Couldn’t load this list" message="Refresh the page to try again." />
        </Card>
      ) : (
        <>
          {view === 'held' ? <HeldTotals rows={shownWallets} /> : <Totals view={view} rows={shownLoans} />}
          <Input
            wrapperClassName="max-w-md"
            placeholder="Search customer, customer number, phone or loan officer"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            icon={<Search className="h-4 w-4" />}
          />
          {view === 'held' ? <HeldTable rows={shownWallets} /> : <LoanTable view={view} rows={shownLoans} />}
        </>
      )}
    </div>
  );
}

function Totals({ view, rows }: { view: Exclude<BookView, 'held'>; rows: BookLoanRow[] }) {
  const n = `${formatNumber(rows.length)} loan${rows.length === 1 ? '' : 's'}`;
  const tiles: ReactNode[] = [];
  if (view === 'overdue') {
    tiles.push(
      <StatTile key="a" label="Overdue" value={naira(sum(rows, (r) => r.pastDue))} icon={<AlarmClock />} tone="danger" footnote={`${n} with missed payments`} />,
      <StatTile key="b" label="Missed instalments" value={formatNumber(sum(rows, (r) => r.missedInstalments))} icon={<AlarmClock />} tone="danger" />,
      <StatTile key="c" label="Still owed on these loans" value={naira(sum(rows, (r) => r.outstanding))} icon={<Landmark />} />,
      <StatTile key="d" label="Repaid on these loans" value={naira(sum(rows, (r) => r.amountRepaid))} icon={<TrendingUp />} tone="success" />,
    );
  } else if (view === 'outstanding') {
    tiles.push(
      <StatTile key="a" label="Still owed" value={naira(sum(rows, (r) => r.outstanding))} icon={<Landmark />} footnote={`${n} running`} />,
      <StatTile key="b" label="Of which overdue" value={naira(sum(rows, (r) => r.pastDue))} icon={<AlarmClock />} tone="danger" />,
      <StatTile key="c" label="Repaid so far" value={naira(sum(rows, (r) => r.amountRepaid))} icon={<TrendingUp />} tone="success" />,
      <StatTile key="d" label="Lent on these loans" value={naira(sum(rows, (r) => r.principal))} icon={<CreditCard />} />,
    );
  } else if (view === 'lent') {
    tiles.push(
      <StatTile key="a" label="Lent" value={naira(sum(rows, (r) => r.principal))} icon={<CreditCard />} footnote={n} />,
      <StatTile key="b" label="Paid out, after the management fee" value={naira(sum(rows, (r) => r.principal - r.managementFee - r.transactionFee))} icon={<Wallet />} />,
      <StatTile key="c" label="Repaid" value={naira(sum(rows, (r) => r.amountRepaid))} icon={<TrendingUp />} tone="success" />,
      <StatTile key="d" label="Still owed" value={naira(sum(rows, (r) => r.outstanding))} icon={<Landmark />} />,
    );
  } else if (view === 'interest') {
    tiles.push(
      <StatTile key="a" label="Interest charged" value={naira(sum(rows, (r) => r.interest))} icon={<TrendingUp />} tone="success" footnote={n} />,
      <StatTile key="b" label="On running loans" value={naira(sum(rows.filter((r) => r.open), (r) => r.interest))} icon={<TrendingUp />} />,
      <StatTile key="c" label="On closed loans" value={naira(sum(rows.filter((r) => !r.open), (r) => r.interest))} icon={<TrendingUp />} />,
      <StatTile key="d" label="Lent on these loans" value={naira(sum(rows, (r) => r.principal))} icon={<CreditCard />} />,
    );
  } else {
    tiles.push(
      <StatTile key="a" label="Fees charged" value={naira(sum(rows, (r) => r.fees))} icon={<TrendingUp />} tone="success" footnote={n} />,
      <StatTile key="b" label="Management fees" value={naira(sum(rows, (r) => r.managementFee))} icon={<TrendingUp />} footnote="Taken off the payout" />,
      <StatTile key="c" label="Transaction fees on repayments" value={naira(sum(rows, (r) => r.repaymentFees))} icon={<TrendingUp />} footnote="Added to each instalment" />,
      <StatTile key="d" label="Older flat transaction fees" value={naira(sum(rows, (r) => r.transactionFee))} icon={<TrendingUp />} />,
    );
  }
  return <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{tiles}</div>;
}

function HeldTotals({ rows }: { rows: WalletHolderRow[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <StatTile label="Customer money held" value={naira(rows.reduce((t, w) => t + w.balance, 0))} icon={<Wallet />} footnote="Wallet balances" />
      <StatTile label="Wallets holding money" value={formatNumber(rows.length)} icon={<Wallet />} />
    </div>
  );
}

const th = 'px-4 py-3 font-semibold whitespace-nowrap';
const thR = `${th} text-right`;
const td = 'px-4 py-3 align-top';
const tdNum = 'num px-4 py-3 text-right align-top whitespace-nowrap';

function Borrower({ r }: { r: BookLoanRow }) {
  const to = r.source === 'ACCOUNT' && r.customerId ? `/admin/customers/${r.customerId}` : `/admin/lending/offline/${r.id}`;
  return (
    <td className={td}>
      <Link to={to} className="font-bold hover:text-gold">
        {r.customerName}
      </Link>
      <span className="block font-mono text-[12px] text-ink-3">
        {r.customerRef || 'Not signed up yet'}
        {r.phone ? ` · ${r.phone}` : ''}
      </span>
      {r.officers.length > 0 && <span className="block text-[12px] text-ink-3">Officer: {r.officers.join(', ')}</span>}
    </td>
  );
}

function LoanCell({ r }: { r: BookLoanRow }) {
  return (
    <td className={`${td} text-[12.5px]`}>
      {naira(r.principal)} · {termPhrase(r.tenureMonths, r.repaymentFrequency)}
      <span className="block text-ink-3">
        {r.purpose ? `${r.purpose} · ` : ''}paid out {asDay(r.disbursedAt)} · last due {asDay(r.dueDate)}
      </span>
    </td>
  );
}

function Status({ r }: { r: BookLoanRow }) {
  return (
    <td className={td}>
      <Pill tone={loanTone(r.status)}>{r.statusLabel}</Pill>
    </td>
  );
}

function LoanTable({ view, rows }: { view: Exclude<BookView, 'held'>; rows: BookLoanRow[] }) {
  if (!rows.length) {
    return (
      <Card>
        <EmptyState icon={<Landmark />} title={view === 'overdue' ? 'Nobody is behind' : 'No loans here'} />
      </Card>
    );
  }
  return (
    <Card padded={false} className="overflow-x-auto">
      <table className="w-full min-w-[980px] text-left text-sm">
        <thead className="border-b border-stroke text-[12px] uppercase tracking-wide text-ink-3">
          <tr>
            <th className={th}>Borrower</th>
            <th className={th}>Loan</th>
            {view === 'overdue' && (
              <>
                <th className={thR}>Overdue</th>
                <th className={th}>Missed</th>
                <th className={th}>Behind since</th>
                <th className={thR}>Still owed</th>
                <th className={th}>Next due</th>
              </>
            )}
            {view === 'outstanding' && (
              <>
                <th className={thR}>Total to repay</th>
                <th className={thR}>Repaid</th>
                <th className={thR}>Still owed</th>
                <th className={thR}>Overdue</th>
                <th className={th}>Next due</th>
              </>
            )}
            {view === 'lent' && (
              <>
                <th className={thR}>Lent</th>
                <th className={thR}>Paid out</th>
                <th className={thR}>Total to repay</th>
                <th className={thR}>Repaid</th>
                <th className={thR}>Still owed</th>
              </>
            )}
            {view === 'interest' && (
              <>
                <th className={thR}>Rate</th>
                <th className={thR}>Interest</th>
                <th className={thR}>Total to repay</th>
                <th className={thR}>Repaid</th>
              </>
            )}
            {view === 'fees' && (
              <>
                <th className={thR}>Management fee</th>
                <th className={thR}>Transaction fees</th>
                <th className={thR}>Older flat fee</th>
                <th className={thR}>All fees</th>
              </>
            )}
            <th className={th}>Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stroke">
          {rows.map((r) => (
            <tr key={`${r.source}-${r.id}`} className="hover:bg-surface-alt/50">
              <Borrower r={r} />
              <LoanCell r={r} />
              {view === 'overdue' && (
                <>
                  <td className={`${tdNum} font-bold text-danger`}>{naira(r.pastDue)}</td>
                  <td className={`${td} whitespace-nowrap`}>
                    {formatNumber(r.missedInstalments)} of {formatNumber(r.installmentCount)}
                    <span className="block text-[12px] text-ink-3">{formatNumber(r.installmentsPaid)} paid</span>
                  </td>
                  <td className={`${td} whitespace-nowrap`}>
                    {asDay(r.oldestMissedDue)}
                    <span className="block text-[12px] font-semibold text-danger">
                      {formatNumber(r.daysBehind)} day{r.daysBehind === 1 ? '' : 's'}
                    </span>
                  </td>
                  <td className={`${tdNum} font-bold`}>{naira(r.outstanding)}</td>
                  <NextDue r={r} />
                </>
              )}
              {view === 'outstanding' && (
                <>
                  <td className={tdNum}>{naira(r.totalRepayable)}</td>
                  <td className={`${tdNum} text-success`}>{naira(r.amountRepaid)}</td>
                  <td className={`${tdNum} font-bold`}>{naira(r.outstanding)}</td>
                  <td className={`${tdNum} ${r.pastDue > 0 ? 'text-danger' : 'text-ink-3'}`}>{naira(r.pastDue)}</td>
                  <NextDue r={r} />
                </>
              )}
              {view === 'lent' && (
                <>
                  <td className={`${tdNum} font-bold`}>{naira(r.principal)}</td>
                  <td className={tdNum}>{naira(r.principal - r.managementFee - r.transactionFee)}</td>
                  <td className={tdNum}>{naira(r.totalRepayable)}</td>
                  <td className={`${tdNum} text-success`}>{naira(r.amountRepaid)}</td>
                  <td className={tdNum}>{naira(r.outstanding)}</td>
                </>
              )}
              {view === 'interest' && (
                <>
                  <td className={tdNum}>{rateOf(r.flatRate)}</td>
                  <td className={`${tdNum} font-bold text-success`}>{naira(r.interest)}</td>
                  <td className={tdNum}>{naira(r.totalRepayable)}</td>
                  <td className={tdNum}>{naira(r.amountRepaid)}</td>
                </>
              )}
              {view === 'fees' && (
                <>
                  <td className={tdNum}>{naira(r.managementFee)}</td>
                  <td className={tdNum}>{naira(r.repaymentFees)}</td>
                  <td className={tdNum}>{naira(r.transactionFee)}</td>
                  <td className={`${tdNum} font-bold text-success`}>{naira(r.fees)}</td>
                </>
              )}
              <Status r={r} />
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function NextDue({ r }: { r: BookLoanRow }) {
  return (
    <td className={`${td} whitespace-nowrap`}>
      {r.nextDue ? (
        <>
          {asDay(r.nextDue)}
          <span className="num block text-[12px] text-ink-3">{naira(r.nextDueAmount)}</span>
        </>
      ) : (
        '—'
      )}
    </td>
  );
}

function HeldTable({ rows }: { rows: WalletHolderRow[] }) {
  if (!rows.length) {
    return (
      <Card>
        <EmptyState icon={<Wallet />} title="No wallet is holding money" />
      </Card>
    );
  }
  return (
    <Card padded={false} className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-stroke text-[12px] uppercase tracking-wide text-ink-3">
          <tr>
            <th className={th}>Customer</th>
            <th className={th}>Phone</th>
            <th className={th}>Account</th>
            <th className={th}>Last movement</th>
            <th className={thR}>Balance</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stroke">
          {rows.map((w) => (
            <tr key={w.customerId} className="hover:bg-surface-alt/50">
              <td className={td}>
                <Link to={`/admin/customers/${w.customerId}`} className="font-bold hover:text-gold">
                  {w.customerName}
                </Link>
                <span className="block font-mono text-[12px] text-ink-3">{w.customerRef}</span>
              </td>
              <td className={`${td} font-mono text-[12.5px]`}>{w.phone || '—'}</td>
              <td className={td}>
                <Pill tone={w.accountStatus === 'ACTIVE' ? 'success' : w.accountStatus === 'FROZEN' ? 'danger' : 'neutral'}>
                  {w.accountStatus ? w.accountStatus.charAt(0) + w.accountStatus.slice(1).toLowerCase().replace(/_/g, ' ') : '—'}
                </Pill>
              </td>
              <td className={`${td} whitespace-nowrap text-[12.5px]`}>{asDay(w.updatedAt)}</td>
              <td className={`${tdNum} font-bold`}>{naira(w.balance)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
