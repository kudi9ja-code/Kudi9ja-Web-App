import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Megaphone, Save, Undo2 } from 'lucide-react';
import { PageHeader } from '../../components/PageHeader';
import { Notice, Switch } from '../../components/ui/Bits';
import { Button } from '../../components/ui/Button';
import { Card, SectionHeader } from '../../components/ui/Card';
import { useDialogs } from '../../components/ui/Dialogs';
import { Input, NumberInput, Textarea } from '../../components/ui/Field';
import { Modal } from '../../components/ui/Modal';
import { PageSpinner } from '../../components/ui/Spinner';
import { useAction } from '../../hooks/useAction';
import { keys, useAdminSettings } from '../../hooks/queries';
import { adminApi } from '../../lib/api/endpoints';
import { asDayTime, formatNumber } from '../../lib/format';
import { can } from '../../lib/labels';
import { useSession } from '../../state/session';
import { settingsKey } from '../../state/settings';
import type { PlatformSettings } from '../../types/api';

type NumKey = { [K in keyof PlatformSettings]-?: PlatformSettings[K] extends number ? K : never }[keyof PlatformSettings];
type BoolKey = { [K in keyof PlatformSettings]-?: PlatformSettings[K] extends boolean ? K : never }[keyof PlatformSettings];

/** Rates are stored as fractions; they are edited as percentages. */
const PERCENT: NumKey[] = [
  'savingsAnnualRate',
  'targetRateShort',
  'targetRateMedium',
  'targetRateLong',
  'loanProcessingFeeRate',
  'loanRepaymentFeeRate',
  'groupLoanProcessingFeeRate',
  'groupLoanRepaymentFeeRate',
];

/** The standard loan settings and the loan-group copy, field by field. */
const LENDING = {
  standard: {
    rates: 'loanRates',
    min: 'minLoanAmount',
    max: 'maxLoanAmount',
    tenure: 'maxLoanTenureMonths',
    flat: 'flatProcessingFee',
    threshold: 'processingFeeThreshold',
    feeRate: 'loanProcessingFeeRate',
    repayFee: 'loanRepaymentFeeRate',
    weekly: 'loanWeeklyAllowed',
    monthly: 'loanMonthlyAllowed',
  },
  group: {
    rates: 'groupLoanRates',
    min: 'groupMinLoanAmount',
    max: 'groupMaxLoanAmount',
    tenure: 'groupMaxLoanTenureMonths',
    flat: 'groupFlatProcessingFee',
    threshold: 'groupProcessingFeeThreshold',
    feeRate: 'groupLoanProcessingFeeRate',
    repayFee: 'groupLoanRepaymentFeeRate',
    weekly: 'groupLoanWeeklyAllowed',
    monthly: 'groupLoanMonthlyAllowed',
  },
} as const satisfies Record<
  string,
  {
    rates: 'loanRates' | 'groupLoanRates';
    min: NumKey;
    max: NumKey;
    tenure: NumKey;
    flat: NumKey;
    threshold: NumKey;
    feeRate: NumKey;
    repayFee: NumKey;
    weekly: BoolKey;
    monthly: BoolKey;
  }
>;

export default function Controls() {
  const settings = useAdminSettings();
  const { adminRole } = useSession();
  const editable = can.editSettings(adminRole);
  const qc = useQueryClient();
  const dialogs = useDialogs();
  const { busy, run } = useAction();
  const [draft, setDraft] = useState<PlatformSettings | null>(null);
  const [announcing, setAnnouncing] = useState(false);

  useEffect(() => {
    if (settings.data) setDraft(settings.data);
  }, [settings.data]);

  const changed = useMemo(() => {
    if (!draft || !settings.data) return [] as string[];
    return (Object.keys(draft) as (keyof PlatformSettings)[]).filter((k) => JSON.stringify(draft[k]) !== JSON.stringify(settings.data![k]));
  }, [draft, settings.data]);

  if (settings.isLoading || !draft) return <PageSpinner />;

  const num = (k: NumKey, label: string, hint?: string) => {
    const pct = PERCENT.includes(k);
    const value = draft[k] as number;
    return (
      <NumberInput
        label={label}
        hint={hint}
        disabled={!editable}
        value={pct ? Math.round(value * 10000) / 100 : value}
        suffix={pct ? '%' : undefined}
        onChange={(n) => setDraft({ ...draft, [k]: pct ? (n ?? 0) / 100 : (n ?? 0) })}
      />
    );
  };
  const flag = (k: BoolKey, label: string, hint: string) => (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-stroke p-3">
      <div>
        <p className="text-sm font-bold">{label}</p>
        <p className="text-[12px] text-ink-3">{hint}</p>
      </div>
      <Switch label={label} checked={draft[k] as boolean} disabled={!editable} onChange={(v) => setDraft({ ...draft, [k]: v })} />
    </div>
  );

  const save = async () => {
    const ok = await dialogs.confirm({
      title: `Save ${changed.length} change${changed.length > 1 ? 's' : ''}?`,
      message: 'New figures apply to new loans from now. Running loans keep the terms they started with.',
      confirmLabel: 'Save',
    });
    if (!ok) return;
    const saved = await run(() => adminApi.saveSettings(settings.data!.version, draft), 'Settings saved');
    if (saved) {
      qc.setQueryData(keys.admin.settings, saved);
      await qc.invalidateQueries({ queryKey: settingsKey });
    }
  };

  /** One set of loan settings: limits, fees, weekly/monthly, and a rate for every month up to the longest term. */
  const lending = (set: keyof typeof LENDING) => {
    const k = LENDING[set];
    const card = draft[k.rates];
    const months = Array.from({ length: Math.max(Number(draft[k.tenure]) || 0, 0) }, (_, i) => i + 1);
    return (
      <>
        <Grid>
          {num(k.min, 'Smallest loan (₦)')}
          {num(k.max, 'Largest loan (₦)')}
          {num(k.tenure, 'Longest term (months)')}
          {num(k.flat, 'Flat management fee (₦)')}
          {num(k.threshold, 'Flat fee up to (₦)')}
          {num(k.feeRate, 'Management fee above that, of the loan')}
          {num(k.repayFee, 'Transaction fee on each repayment', 'Added to every instalment, weekly or monthly. Nothing but the management fee comes off a payout.')}
        </Grid>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {flag(k.weekly, 'Weekly repayment', 'Borrowers may choose to repay every week')}
          {flag(k.monthly, 'Monthly repayment', 'Borrowers may choose to repay every month')}
        </div>
        <p className="mb-2 mt-5 text-sm font-bold">Flat rate by term</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {months.map((m) => {
            const r = card[String(m)];
            return (
              <NumberInput
                key={m}
                label={`${m} month${m === 1 ? '' : 's'}`}
                suffix="%"
                disabled={!editable}
                value={r == null ? null : Math.round(r * 10000) / 100}
                error={r == null ? 'Needs a rate' : undefined}
                onChange={(n) => setDraft({ ...draft, [k.rates]: { ...card, [String(m)]: (n ?? 0) / 100 } })}
              />
            );
          })}
        </div>
      </>
    );
  };

  /** Starts the group terms again from the standard ones. */
  const copyStandardToGroup = () => {
    const a = LENDING.standard;
    const b = LENDING.group;
    setDraft({
      ...draft,
      [b.rates]: { ...draft[a.rates] },
      [b.min]: draft[a.min],
      [b.max]: draft[a.max],
      [b.tenure]: draft[a.tenure],
      [b.flat]: draft[a.flat],
      [b.threshold]: draft[a.threshold],
      [b.feeRate]: draft[a.feeRate],
      [b.repayFee]: draft[a.repayFee],
      [b.weekly]: draft[a.weekly],
      [b.monthly]: draft[a.monthly],
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Controls"
        subtitle={`Version ${draft.version}${draft.createdBy ? ` · last changed by ${draft.createdBy}` : ''}${draft.createdAt ? ` · ${asDayTime(draft.createdAt)}` : ''}`}
        actions={
          <>
            <Button variant="ghost" icon={<Megaphone className="h-4 w-4" />} onClick={() => setAnnouncing(true)} disabled={!can.manageCustomers(adminRole)}>
              Announce
            </Button>
            {editable && (
              <>
                <Button variant="subtle" disabled={!changed.length} icon={<Undo2 className="h-4 w-4" />} onClick={() => setDraft(settings.data!)}>
                  Undo
                </Button>
                <Button disabled={!changed.length} loading={busy} icon={<Save className="h-4 w-4" />} onClick={() => void save()}>
                  Save {changed.length ? `(${changed.length})` : ''}
                </Button>
              </>
            )}
          </>
        }
      />
      {!editable && <Notice tone="info">Your role can read these settings but not change them.</Notice>}

      <Group title="Switches">
        <div className="grid gap-3 md:grid-cols-2">
          {/* Savings and Ajo circles are switched off for now.
          {flag('savingsEnabled', 'Savings', 'New savings plans can be opened')}
          */}
          {flag('lendingEnabled', 'Lending', 'New loan applications are taken')}
          {/* {flag('thriftEnabled', 'Ajo circles', 'New circles can be started')} */}
          {flag('maintenanceMode', 'Maintenance mode', 'Pauses money movement; customers see a notice')}
        </div>
      </Group>

      {/* Savings is switched off for now.
      <Group title="Savings">
        <Grid>
          {num('savingsAnnualRate', 'Fixed savings rate, a year')}
          {num('minLockDays', 'Shortest lock (days)')}
          {num('maxLockDays', 'Longest lock (days)')}
          {num('daysPerYear', 'Days in a year, for interest')}
          {num('minSavingsAmount', 'Smallest plan (₦)')}
          {num('maxSavingsAmount', 'Largest plan (₦)')}
          {num('targetRateShort', 'Target bonus, short')}
          {num('targetRateMedium', 'Target bonus, medium')}
          {num('targetRateLong', 'Target bonus, long')}
          {num('targetTierMedium', 'Medium from (months)')}
          {num('targetTierLong', 'Long from (months)')}
          {num('minTargetMonths', 'Shortest target plan (months)')}
        </Grid>
      </Group>
      */}

      <Group title="Lending">
        <p className="mb-4 text-[13px] text-ink-3">For everyone who is not in a loan group.</p>
        {lending('standard')}
      </Group>

      <Group title="Group loans">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[13px] text-ink-3">
            For members of a loan group. Their loans are priced on these instead of the standard lending settings above.
          </p>
          {editable && (
            <Button size="sm" variant="ghost" onClick={copyStandardToGroup}>
              Copy from standard lending
            </Button>
          )}
        </div>
        {lending('group')}
      </Group>

      <Group title="Wallet">
        <Grid>
          {num('minDepositAmount', 'Smallest pay-in (₦)')}
          {num('minWithdrawalAmount', 'Smallest withdrawal (₦)')}
          {/* Ajo circles are switched off for now.
          {num('minCircleContribution', 'Smallest circle contribution (₦)')}
          {num('minCircleMembers', 'Fewest circle members')}
          {num('maxCircleMembers', 'Most circle members')}
          */}
        </Grid>
      </Group>

      <Group title="Security">
        <Grid>
          {num('maxPasscodeAttempts', 'Passcode attempts before sign-out')}
          {num('lockTimeoutMinutes', 'Lock after idle (minutes)', 'At least 10 minutes.')}
          {num('otpResendSeconds', 'Wait before resending a code (seconds)')}
        </Grid>
      </Group>

      <Announce open={announcing} onClose={() => setAnnouncing(false)} />
    </div>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <SectionHeader title={title} />
      {children}
    </Card>
  );
}

function Grid({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}

function Announce({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { busy, run } = useAction();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const send = async () => {
    const r = await run(() => adminApi.announce(title.trim(), body.trim()), (x) => `Sent to ${formatNumber(x.devices)} device${x.devices === 1 ? '' : 's'}`);
    if (r) {
      setTitle('');
      setBody('');
      onClose();
    }
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Announce to every customer"
      description="Goes to every customer as a notification, and to their phones."
      footer={
        <Button block loading={busy} disabled={title.trim().length < 3 || body.trim().length < 3} onClick={() => void send()}>
          Send to everyone
        </Button>
      }
    >
      <div className="space-y-4">
        <Input label="Title" value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} />
        <Textarea label="Message" value={body} maxLength={500} rows={4} onChange={(e) => setBody(e.target.value)} />
      </div>
    </Modal>
  );
}
