import { Ban, CalendarClock, HandCoins, Hourglass, Landmark, PhoneOff, Receipt, Scale, /* ShieldAlert, */ UserCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import { feeRateLabel, loanPreview, loanRateFor, processingFee } from '../../lib/finance';
import { months, naira, nairaFlat, ratePct } from '../../lib/format';
import { useSettings } from '../../state/settings';

/**
 * Kudi9ja lending in plain words, priced from the live settings.
 *
 * The full Lending Agreement says all of this at length; this is the part a
 * borrower must not miss, stated before they agree to anything — the way the
 * consumer-lending rules expect a loan's terms to be disclosed: what it
 * costs, what lands in the wallet, what is repaid, and what happens if they
 * cannot pay.
 */
export function LendingKeyFacts() {
  const s = useSettings();
  const l = s.lending;
  const tenures = [1, 3, 6, 12, l.maxTenureMonths].filter((m, i, a) => m <= l.maxTenureMonths && a.indexOf(m) === i);
  const example = loanPreview(s, 200_000, 3, 'MONTHLY');

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <Fact icon={<HandCoins />} title="What you can borrow">
          {nairaFlat(l.minAmount)} to {nairaFlat(l.maxAmount)}, repaid over any month from 1 to {l.maxTenureMonths}.
        </Fact>
        <Fact icon={<Scale />} title="How interest works">
          One flat charge on the amount borrowed, worked out once. It never compounds and never grows — only the tenure you choose changes it.
        </Fact>
        <Fact icon={<Receipt />} title="Management and transaction fees">
          Management fee: {nairaFlat(l.flatProcessingFee)} on any loan up to and including {nairaFlat(l.processingFeeThreshold)}; above that,{' '}
          {ratePct(l.processingFeeRate * 100)} of the whole amount, taken from what you receive. Transaction fee:{' '}
          {feeRateLabel(l.repaymentFeeRate)} of each repayment, added to every instalment, weekly or monthly.
        </Fact>
        <Fact icon={<Ban />} title="No late fees, no penalty interest">
          Even in default, the amount you owe does not increase.
        </Fact>
        <Fact icon={<CalendarClock />} title="Pay off early any time">
          Clear a loan ahead of schedule whenever you like. You pay what is still owed, interest and transaction fees included — no discount,
          and no charge.
        </Fact>
        <Fact icon={<Hourglass />} title="Once it is paid out, it is yours to repay">
          A loan cannot be cancelled after it reaches your wallet. You repay it in full, with the interest and fees shown before you confirm.
        </Fact>
        <Fact icon={<UserCheck />} title="A person decides">
          Every application is read by our team — your statement, your business and your guarantor. Nothing is refused by a score.
        </Fact>
        <Fact icon={<PhoneOff />} title="How we collect">
          We never contact your phone contacts, family or employer, and we only reach you between 8am and 8pm.
        </Fact>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gold/25">
        <div className="flex items-center justify-between border-b border-gold/20 bg-gold/[0.07] px-4 py-2.5">
          <p className="text-[13px] font-extrabold text-gold">The rate for each tenure</p>
          <p className="text-[11.5px] text-ink-3">Flat, on the amount borrowed</p>
        </div>
        <div className="divide-y divide-stroke text-[13.5px]">
          <div className="grid grid-cols-3 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-ink-3">
            <span>Repaid over</span>
            <span className="text-right">Total rate</span>
            <span className="text-right">₦100,000: loan + interest</span>
          </div>
          {tenures.map((m) => {
            const r = loanRateFor(s, m);
            return (
              <div key={m} className="grid grid-cols-3 px-4 py-2.5">
                <span className="text-ink-2">{months(m)}</span>
                <span className="num text-right font-bold">{ratePct(r * 100)}</span>
                <span className="num text-right font-bold">{nairaFlat(100_000 * (1 + r))}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-stroke bg-canvas/40 p-4">
        <p className="mb-2 text-[13px] font-extrabold">An example: borrow ₦200,000 over 3 months</p>
        <ul className="space-y-1.5 text-[13.5px] text-ink-2">
          <li className="flex justify-between gap-4">
            <span>Management fee</span>
            <span className="num font-bold text-ink">-{naira(processingFee(s, 200_000))}</span>
          </li>
          <li className="flex justify-between gap-4">
            <span>Lands in your wallet</span>
            <span className="num font-bold text-success">{naira(example.net)}</span>
          </li>
          <li className="flex justify-between gap-4">
            <span>Interest ({ratePct(example.rate * 100)} flat)</span>
            <span className="num font-bold text-ink">{naira(example.interest)}</span>
          </li>
          <li className="flex justify-between gap-4">
            <span>Transaction fee ({feeRateLabel(example.feeRate)} of each repayment)</span>
            <span className="num font-bold text-ink">{naira(example.fees)}</span>
          </li>
          <li className="flex justify-between gap-4 border-t border-stroke pt-1.5">
            <span>You repay, monthly</span>
            <span className="num font-extrabold text-ink">
              {naira(example.total)} · 3 × {naira(example.each)}
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}

export function AccountKeyFacts() {
  // const s = useSettings(); // only the savings facts used it; savings is switched off for now
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Fact icon={<Landmark />} title="Kudi9ja is not a bank">
        Your wallet is not a bank account and is not insured by the NDIC. Money reaches it only after our team confirms your transfer.
      </Fact>
      {/* Savings is switched off for now.
      <Fact icon={<ShieldAlert />} title="Fixed Savings cannot be broken">
        The {ratePct(s.savings.annualRate * 100)} return is paid the day you start, which is why the principal stays locked until maturity — for any
        reason.
      </Fact>
      <Fact icon={<CalendarClock />} title="Target Savings can be broken">
        Every naira you saved comes back in full, but the whole completion bonus is forfeited.
      </Fact>
      */}
      <Fact icon={<UserCheck />} title="Payouts only to you">
        Withdrawals go only to a bank account in your own name, and each one is reviewed by our team first.
      </Fact>
    </div>
  );
}

function Fact({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-stroke bg-surface p-4">
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gold/10 text-gold [&>svg]:h-4 [&>svg]:w-4">{icon}</span>
      <div>
        <p className="text-[13.5px] font-extrabold">{title}</p>
        <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink-2">{children}</p>
      </div>
    </div>
  );
}
