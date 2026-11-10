// Switched off: savings and Ajo circles are commented out for now. Remove the "// " prefixes to bring this page back.
export {};

// import { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { Lock } from 'lucide-react';
// import { PageHeader } from '../../../components/PageHeader';
// import { Notice } from '../../../components/ui/Bits';
// import { Button } from '../../../components/ui/Button';
// import { Card, DetailRows } from '../../../components/ui/Card';
// import { useDialogs } from '../../../components/ui/Dialogs';
// import { Input } from '../../../components/ui/Field';
// import { AmountInput, FieldLabel, QuickAmounts, NumberField } from '../../../components/ui/Inputs';
// import { useAction } from '../../../hooks/useAction';
// import { useRefresh, useWallet } from '../../../hooks/queries';
// import { savingsApi } from '../../../lib/api/endpoints';
// import { effectiveYieldPct, savingsInterest } from '../../../lib/finance';
// import { asDay, formatAmountInput, humanPeriod, naira, parseAmount, ratePct, rateOf } from '../../../lib/format';
// import { PLAN_EMOJIS } from '../../../lib/validators';
// import { useSettings } from '../../../state/settings';
// import { EmojiPicker } from './TargetPlan';
//
// const PRESETS = [30, 90, 180, 365];
//
// export default function FixedPlan() {
//   const s = useSettings();
//   const wallet = useWallet();
//   const dialogs = useDialogs();
//   const refresh = useRefresh();
//   const navigate = useNavigate();
//   const { busy, run } = useAction();
//   const [title, setTitle] = useState('');
//   const [emoji, setEmoji] = useState(PLAN_EMOJIS[0]!);
//   const [amount, setAmount] = useState('');
//   const [days, setDays] = useState(Math.max(90, s.savings.minLockDays));
//
//   const principal = parseAmount(amount);
//   const balance = wallet.data?.balance ?? 0;
//   const interest = savingsInterest(s, principal, days);
//   const maturity = new Date(Date.now() + days * 86_400_000);
//   const problem =
//     principal <= 0
//       ? null
//       : principal < s.savings.minAmount
//         ? `The smallest plan is ${naira(s.savings.minAmount)}.`
//         : principal > s.savings.maxAmount
//           ? `The largest plan is ${naira(s.savings.maxAmount)}.`
//           : principal > balance
//             ? `That is more than your ${naira(balance)} balance. Add money first.`
//             : null;
//   const valid = title.trim().length > 0 && principal > 0 && !problem;
//
//   const create = async () => {
//     const pin = await dialogs.pin({
//       title: 'Lock this money?',
//       amountLabel: 'You are locking',
//       amount: principal,
//       details: [
//         ['For', humanPeriod(days)],
//         ['Interest now', naira(interest)],
//         ['Matures', asDay(maturity)],
//       ],
//     });
//     if (!pin) return;
//     const plan = await run(
//       () => savingsApi.createFixed({ title: title.trim(), principal, days, emoji, pin }),
//       'Your plan is running — the interest is in your wallet',
//     );
//     if (plan) {
//       await refresh.savings();
//       navigate(`/app/savings/${plan.id}`, { replace: true });
//     }
//   };
//
//   return (
//     <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_380px]">
//       <div>
//         <PageHeader back="/app/savings/new" backLabel="Plan types" title="Fixed savings" subtitle={`${rateOf(s.savings.annualRate)} a year, paid upfront.`} />
//         <Card className="space-y-6 p-6">
//           <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
//             <Input label="Name your plan" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="e.g. Rent 2027" />
//             <div>
//               <FieldLabel>Icon</FieldLabel>
//               <EmojiPicker value={emoji} onChange={setEmoji} />
//             </div>
//           </div>
//           <AmountInput value={amount} onChange={setAmount} label="How much to lock?" error={!!problem} />
//           <QuickAmounts amounts={[50000, 100000, 250000, 500000]} onPick={(n) => setAmount(formatAmountInput(String(n)))} />
//           {problem && <p className="text-center text-[13px] font-semibold text-danger">{problem}</p>}
//           <div>
//             <div className="mb-2 flex items-center justify-between">
//               <FieldLabel>For how long?</FieldLabel>
//               <span className="text-sm font-extrabold text-gold">{humanPeriod(days)}</span>
//             </div>
//             <NumberField label="Lock period in days" value={days} min={s.savings.minLockDays} max={s.savings.maxLockDays} onChange={setDays} />
//             <div className="mt-3 flex flex-wrap gap-2">
//               {PRESETS.filter((d) => d >= s.savings.minLockDays && d <= s.savings.maxLockDays).map((d) => (
//                 <Button key={d} size="sm" variant={d === days ? 'outline' : 'ghost'} onClick={() => setDays(d)}>
//                   {humanPeriod(d)}
//                 </Button>
//               ))}
//             </div>
//           </div>
//         </Card>
//       </div>
//
//       <div className="lg:pt-[92px]">
//         <Card gradient glow className="sticky top-24 space-y-5 p-6">
//           <p className="eyebrow text-ink-3">Your plan</p>
//           <div>
//             <p className="text-[13px] text-ink-3">Interest paid to your wallet today</p>
//             <p className="num text-3xl font-extrabold text-success">{naira(interest)}</p>
//           </div>
//           <DetailRows
//             rows={[
//               ['Locked', naira(principal)],
//               ['Rate', `${rateOf(s.savings.annualRate)} a year`],
//               ['Earned over the period', ratePct(effectiveYieldPct(s, days))],
//               ['Matures', asDay(maturity)],
//               { label: 'Back to you at maturity', value: naira(principal), bold: true },
//             ]}
//           />
//           <Notice tone="neutral">
//             The money stays locked until the plan matures and cannot be taken out early — that is what lets us pay the interest today.
//           </Notice>
//           <Button block size="lg" icon={<Lock className="h-4 w-4" />} disabled={!valid} loading={busy} onClick={create}>
//             Lock and earn {naira(interest)}
//           </Button>
//         </Card>
//       </div>
//     </div>
//   );
// }
