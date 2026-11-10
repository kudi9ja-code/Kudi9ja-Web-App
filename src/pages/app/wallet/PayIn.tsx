import { useMemo, useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CreditCard, Lock, ShieldCheck, Wallet as WalletIcon } from 'lucide-react';
import { PageHeader } from '../../../components/PageHeader';
import { ChoiceTiles, Notice } from '../../../components/ui/Bits';
import { Button } from '../../../components/ui/Button';
import { Card, DetailRows } from '../../../components/ui/Card';
import { Select } from '../../../components/ui/Field';
import { AmountInput, QuickAmounts } from '../../../components/ui/Inputs';
import { PageSpinner } from '../../../components/ui/Spinner';
import { useAction } from '../../../hooks/useAction';
import { useLoans, usePaystackEnabled } from '../../../hooks/queries';
import { walletApi } from '../../../lib/api/endpoints';
import { formatAmountInput, naira, parseAmount } from '../../../lib/format';
import { isLoanOpen } from '../../../lib/labels';
import { markPaystackHandoff } from '../../../state/session';
import { useSettings } from '../../../state/settings';
import type { DepositPurpose } from '../../../types/api';

/**
 * Money in, through Paystack checkout. Nothing is credited here: the customer
 * pays on Paystack's page, comes back to /app/wallet/paystack, and the server
 * asks Paystack what happened before a naira moves.
 */
export default function PayIn() {
  const settings = useSettings();
  const [params] = useSearchParams();
  const enabled = usePaystackEnabled();
  const loans = useLoans();
  const openLoans = useMemo(() => (loans.data ?? []).filter((l) => isLoanOpen(l.status)), [loans.data]);

  const presetLoan = params.get('loan') ?? '';
  const [purpose, setPurpose] = useState<DepositPurpose>(presetLoan ? 'LOAN_REPAYMENT' : 'WALLET');
  const [loanId, setLoanId] = useState(presetLoan);
  const [amount, setAmount] = useState(params.get('amount') ? formatAmountInput(params.get('amount')!) : '');
  const { busy, run } = useAction();

  const value = parseAmount(amount);
  const loan = openLoans.find((l) => l.id === loanId);
  const min = settings.wallet.minDepositAmount;
  const problem =
    value <= 0
      ? null
      : value < min
        ? `The smallest payment is ${naira(min)}.`
        : purpose === 'LOAN_REPAYMENT' && !loan
          ? 'Choose the loan you are repaying.'
          : purpose === 'LOAN_REPAYMENT' && loan && value > loan.outstanding
            ? `That is more than the ${naira(loan.outstanding)} still owed.`
            : null;

  if (enabled.isLoading) return <PageSpinner />;

  const pay = () =>
    run(async () => {
      const checkout = await walletApi.startPaystack({
        amount: value,
        purpose,
        loanId: purpose === 'LOAN_REPAYMENT' ? loanId : undefined,
        callbackUrl: `${window.location.origin}/app/wallet/paystack`,
      });
      try {
        sessionStorage.setItem('k9.paystack', checkout.reference);
      } catch {
        // only a convenience for the return page
      }
      markPaystackHandoff(checkout.reference);
      window.location.assign(checkout.authorizationUrl);
      return checkout;
    });

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader back="/app/wallet" backLabel="Wallet" title="Add money" subtitle="Pay by card, bank transfer or USSD." />

      {enabled.data && !enabled.data.enabled ? (
        <Notice tone="info" title="Paying in is not open yet">
          We are switching on card and transfer payments. Please check back shortly, or write to {settings.company.supportEmail}.
        </Notice>
      ) : (
        <Card className="space-y-6 p-6">
          {openLoans.length > 0 && (
            <ChoiceTiles<DepositPurpose>
              value={purpose}
              onChange={setPurpose}
              columns={2}
              options={[
                { value: 'WALLET', label: 'Fund my wallet', sub: 'Repay from it, or keep it' },
                { value: 'LOAN_REPAYMENT', label: 'Repay a loan', sub: 'Applied to the loan at once' },
              ]}
            />
          )}

          {purpose === 'LOAN_REPAYMENT' && (
            <Select
              label="Loan"
              placeholder="Choose a loan"
              value={loanId}
              onChange={(e) => setLoanId(e.target.value)}
              options={openLoans.map((l) => ({ value: l.id, label: `${l.purpose} — ${naira(l.outstanding)} owed` }))}
            />
          )}

          <AmountInput value={amount} onChange={setAmount} autoFocus label="How much?" error={!!problem} />
          {purpose === 'LOAN_REPAYMENT' && loan ? (
            <div className="flex flex-wrap justify-center gap-2">
              {loan.nextInstallment && (
                <Button size="sm" variant="ghost" onClick={() => setAmount(formatAmountInput(String(Math.ceil(loan.nextInstallment!.outstanding))))}>
                  Next instalment · {naira(loan.nextInstallment.outstanding)}
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => setAmount(formatAmountInput(String(Math.ceil(loan.outstanding))))}>
                All of it · {naira(loan.outstanding)}
              </Button>
            </div>
          ) : (
            <QuickAmounts amounts={[5000, 10000, 20000, 50000, 100000]} onPick={(n) => setAmount(formatAmountInput(String(n)))} />
          )}
          {problem && <p className="text-center text-[13px] font-semibold text-danger">{problem}</p>}

          {value > 0 && !problem && (
            <DetailRows
              rows={[
                ['You pay', naira(value)],
                [purpose === 'LOAN_REPAYMENT' ? 'Applied to your loan' : 'Added to your wallet', naira(value)],
                ['Fee', 'Free'],
              ]}
            />
          )}

          <Button block size="lg" icon={<Lock className="h-4 w-4" />} disabled={value <= 0 || !!problem} loading={busy} onClick={pay}>
            Continue to Paystack
          </Button>

          <div className="grid gap-3 border-t border-stroke pt-5 text-[12.5px] text-ink-3 sm:grid-cols-3">
            <Point icon={<ShieldCheck className="h-4 w-4" />} text="Card details go to Paystack, never to Kudi9ja." />
            <Point icon={<CreditCard className="h-4 w-4" />} text="Card, bank transfer, USSD or bank app." />
            <Point icon={<WalletIcon className="h-4 w-4" />} text="Credited the moment Paystack confirms it." />
          </div>
        </Card>
      )}
    </div>
  );
}

function Point({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-gold">{icon}</span>
      <span>{text}</span>
    </div>
  );
}
