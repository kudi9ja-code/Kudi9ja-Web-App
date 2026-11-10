import { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Banknote, CreditCard, Landmark, ReceiptText } from 'lucide-react';
import { PageHeader } from '../../../components/PageHeader';
import { TransactionGroups } from '../../../components/TransactionList';
import { EmptyState, IconBadge, Pill, Segmented, StatTile } from '../../../components/ui/Bits';
import { Button } from '../../../components/ui/Button';
import { Card, SectionHeader } from '../../../components/ui/Card';
import { Skeleton } from '../../../components/ui/Spinner';
import { useClaims, useMyWithdrawals, usePaystackPayments, useTransactions, useWallet } from '../../../hooks/queries';
import { asDayTime, naira } from '../../../lib/format';
import { TX_FILTERS, depositTone, paystackTone, payoutLabel } from '../../../lib/labels';
import { useProfile } from '../../../state/session';
import type { TxFilter } from '../../../types/api';

type Tab = 'activity' | 'payins' | 'withdrawals';

export default function Wallet() {
  const profile = useProfile();
  const wallet = useWallet();
  const [tab, setTab] = useState<Tab>('activity');
  const [filter, setFilter] = useState<TxFilter>('ALL');
  const hidden = profile.hideBalance;
  const w = wallet.data;
  const money = (n?: number) => (hidden ? '₦ ••••' : naira(n ?? 0));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Wallet"
        subtitle="Every naira in and out, in order."
        actions={
          <>
            <Button to="/app/wallet/add" icon={<ArrowDownLeft className="h-4 w-4" />}>
              Add money
            </Button>
            <Button to="/app/wallet/withdraw" variant="ghost" icon={<ArrowUpRight className="h-4 w-4" />}>
              Withdraw
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card gradient glow className="sm:col-span-2">
          <p className="eyebrow text-ink-3">Available</p>
          {wallet.isLoading ? (
            <Skeleton className="mt-3 h-9 w-48" />
          ) : (
            <p className="num mt-2 text-[34px] font-extrabold tracking-[-0.03em]">{money(w?.balance)}</p>
          )}
          {!!w?.pendingWithdrawals && (
            <p className="mt-1 text-[13px] text-ink-3">{money(w.pendingWithdrawals)} waiting to be paid out</p>
          )}
        </Card>
        <StatTile label="Paid in, all time" value={money(w?.totalDeposited)} icon={<Banknote />} tone="success" />
        <StatTile label="Net worth" value={money(w?.netWorth)} icon={<Landmark />} footnote="Wallet − loans" />
      </div>
      {w?.disclosure && <p className="text-[12.5px] text-ink-3">{w.disclosure}</p>}

      <Segmented<Tab>
        value={tab}
        onChange={setTab}
        options={[
          { value: 'activity', label: 'Activity' },
          { value: 'payins', label: 'Payments in' },
          { value: 'withdrawals', label: 'Withdrawals' },
        ]}
      />

      {tab === 'activity' && <Activity filter={filter} setFilter={setFilter} hidden={hidden} />}
      {tab === 'payins' && <PayIns />}
      {tab === 'withdrawals' && <Withdrawals />}
    </div>
  );
}

function Activity({ filter, setFilter, hidden }: { filter: TxFilter; setFilter: (f: TxFilter) => void; hidden: boolean }) {
  const tx = useTransactions(filter, 200);
  return (
    <section>
      <div className="no-scrollbar -mx-1 mb-4 flex gap-2 overflow-x-auto px-1">
        {TX_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={
              filter === f.value
                ? 'shrink-0 rounded-full gold-gradient px-4 py-1.5 text-[13px] font-bold text-on-gold'
                : 'shrink-0 rounded-full border border-stroke bg-surface px-4 py-1.5 text-[13px] font-semibold text-ink-2 hover:text-ink'
            }
          >
            {f.label}
          </button>
        ))}
      </div>
      <Card padded={false}>
        {tx.isLoading ? (
          <div className="space-y-3 p-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : tx.data?.items.length ? (
          <TransactionGroups items={tx.data.items} hidden={hidden} />
        ) : (
          <EmptyState icon={<ReceiptText />} title="No transactions here" message="Anything that moves money appears in this list." />
        )}
      </Card>
    </section>
  );
}

function PayIns() {
  const paystack = usePaystackPayments();
  const claims = useClaims();
  const items = paystack.data?.items ?? [];
  const older = claims.data?.items ?? [];
  return (
    <section className="space-y-6">
      <Card padded={false}>
        {paystack.isLoading ? (
          <div className="p-4">
            <Skeleton className="h-12 w-full" />
          </div>
        ) : items.length ? (
          <ul className="divide-y divide-stroke">
            {items.map((p) => (
              <li key={p.id} className="flex items-center gap-3.5 px-4 py-3">
                <IconBadge size={40} tone={paystackTone(p.status)}>
                  <CreditCard />
                </IconBadge>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {p.purposeLabel}
                    {p.cardLast4 ? ` · ${p.cardType ?? 'Card'} ${p.cardLast4}` : p.channel ? ` · ${p.channel}` : ''}
                  </p>
                  <p className="text-[12px] text-ink-3">
                    {asDayTime(p.paidAt ?? p.createdAt)} · {p.reference}
                  </p>
                </div>
                <div className="text-right">
                  <p className="num text-sm font-extrabold">{naira(p.amount)}</p>
                  <Pill tone={paystackTone(p.status)}>{p.status === 'INITIALIZED' ? 'Not completed' : p.statusLabel}</Pill>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={<CreditCard />}
            title="No payments yet"
            message="Pay in by card, bank transfer or USSD through Paystack."
            action={<Button to="/app/wallet/add">Add money</Button>}
          />
        )}
      </Card>

      {older.length > 0 && (
        <section>
          <SectionHeader title="Earlier bank-transfer claims" />
          <Card padded={false}>
            <ul className="divide-y divide-stroke">
              {older.map((c) => (
                <li key={c.id} className="flex items-center gap-3.5 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{c.purposeLabel}</p>
                    <p className="text-[12px] text-ink-3">
                      {asDayTime(c.claimedAt)} · {c.reference}
                    </p>
                    {c.note && <p className="mt-0.5 text-[12px] text-ink-2">{c.note}</p>}
                  </div>
                  <div className="text-right">
                    <p className="num text-sm font-extrabold">{naira(c.amount)}</p>
                    <Pill tone={depositTone(c.status)}>{c.statusLabel}</Pill>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      )}
    </section>
  );
}

function Withdrawals() {
  const list = useMyWithdrawals();
  const items = list.data?.items ?? [];
  return (
    <Card padded={false}>
      {list.isLoading ? (
        <div className="p-4">
          <Skeleton className="h-12 w-full" />
        </div>
      ) : items.length ? (
        <ul className="divide-y divide-stroke">
          {items.map((w) => {
            const state = payoutLabel(w);
            return (
              <li key={w.id} className="flex items-center gap-3.5 px-4 py-3">
                <IconBadge size={40} tone={state.tone}>
                  <ArrowUpRight />
                </IconBadge>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    To {w.bank} ••{w.destinationAccount.slice(-4)}
                  </p>
                  <p className="text-[12px] text-ink-3">
                    {asDayTime(w.requestedAt)} · {w.reference}
                  </p>
                  {(w.payoutFailure || w.note) && (
                    <p className="mt-0.5 text-[12px] text-ink-2">{w.payoutFailure ?? w.note}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="num text-sm font-extrabold">{naira(w.amount)}</p>
                  <Pill tone={state.tone}>{state.label}</Pill>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState icon={<ArrowUpRight />} title="No withdrawals" message="Money you send to your bank appears here." />
      )}
    </Card>
  );
}
