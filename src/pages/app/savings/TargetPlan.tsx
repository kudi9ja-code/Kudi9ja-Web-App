// Switched off: savings and Ajo circles are commented out for now. Remove the "// " prefixes to bring this page back.
export {};

// import { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { Target } from 'lucide-react';
// import { PageHeader } from '../../../components/PageHeader';
// import { ChoiceTiles, Notice } from '../../../components/ui/Bits';
// import { Button } from '../../../components/ui/Button';
// import { Card, DetailRows } from '../../../components/ui/Card';
// import { useDialogs } from '../../../components/ui/Dialogs';
// import { Input } from '../../../components/ui/Field';
// import { AmountInput, FieldLabel, QuickAmounts, NumberField } from '../../../components/ui/Inputs';
// import { useAction } from '../../../hooks/useAction';
// import { useRefresh } from '../../../hooks/queries';
// import { savingsApi } from '../../../lib/api/endpoints';
// import { cn } from '../../../lib/cn';
// import { addMonths, targetPerDeposit, targetRateFor, targetRuns } from '../../../lib/finance';
// import { asDay, formatAmountInput, months as monthsLabel, naira, parseAmount, rateOf } from '../../../lib/format';
// import { frequencyAdverb } from '../../../lib/labels';
// import { PLAN_EMOJIS } from '../../../lib/validators';
// import { useSettings } from '../../../state/settings';
// import type { AutoFrequency } from '../../../types/api';
//
// export function EmojiPicker({ value, onChange }: { value: string; onChange: (e: string) => void }) {
//   const [open, setOpen] = useState(false);
//   return (
//     <div className="relative">
//       <button
//         type="button"
//         onClick={() => setOpen((o) => !o)}
//         className="grid h-12 w-12 place-items-center rounded-xl border border-stroke bg-surface text-2xl transition hover:border-gold/40"
//         aria-label="Choose an icon"
//       >
//         {value}
//       </button>
//       {open && (
//         <div className="absolute right-0 z-20 mt-2 grid w-64 grid-cols-6 gap-1 rounded-2xl border border-stroke bg-surface p-2 shadow-pop">
//           {PLAN_EMOJIS.map((e) => (
//             <button
//               key={e}
//               type="button"
//               onClick={() => {
//                 onChange(e);
//                 setOpen(false);
//               }}
//               className={cn('grid h-9 w-9 place-items-center rounded-lg text-xl hover:bg-surface-alt', e === value && 'bg-gold/15')}
//             >
//               {e}
//             </button>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }
//
// export default function TargetPlan() {
//   const s = useSettings();
//   const dialogs = useDialogs();
//   const refresh = useRefresh();
//   const navigate = useNavigate();
//   const { busy, run } = useAction();
//   const [title, setTitle] = useState('');
//   const [emoji, setEmoji] = useState('🎯');
//   const [goal, setGoal] = useState('');
//   const [frequency, setFrequency] = useState<AutoFrequency>('WEEKLY');
//   const [term, setTerm] = useState(Math.max(6, s.savings.minTargetMonths));
//
//   const value = parseAmount(goal);
//   const perDeposit = targetPerDeposit(s, value, frequency, term);
//   const runs = targetRuns(s, frequency, term);
//   const bonusRate = targetRateFor(s, term);
//   const bonus = value * bonusRate;
//   const maturity = addMonths(new Date(), term);
//   const problem =
//     value <= 0
//       ? null
//       : value < s.savings.minAmount
//         ? `The smallest goal is ${naira(s.savings.minAmount)}.`
//         : value > s.savings.maxAmount
//           ? `The largest goal is ${naira(s.savings.maxAmount)}.`
//           : null;
//   const valid = title.trim().length > 0 && value > 0 && !problem;
//
//   const create = async () => {
//     const pin = await dialogs.pin({
//       title: 'Start this target plan?',
//       amountLabel: 'Your goal',
//       amount: value,
//       details: [
//         ['We save', `${naira(perDeposit)} ${frequencyAdverb(frequency)}`],
//         ['For', monthsLabel(term)],
//         ['Bonus if you finish', rateOf(bonusRate)],
//       ],
//     });
//     if (!pin) return;
//     const plan = await run(
//       () => savingsApi.createTarget({ title: title.trim(), goal: value, frequency, months: term, emoji, pin }),
//       'Target plan started',
//     );
//     if (plan) {
//       await refresh.savings();
//       navigate(`/app/savings/${plan.id}`, { replace: true });
//     }
//   };
//
//   const maxMonths = Math.min(120, Math.floor(s.savings.maxLockDays / s.savings.daysPerSavingsMonth) || 60);
//
//   return (
//     <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_380px]">
//       <div>
//         <PageHeader back="/app/savings/new" backLabel="Plan types" title="Target savings" subtitle="Save towards a goal, automatically." />
//         <Card className="space-y-6 p-6">
//           <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
//             <Input label="What are you saving for?" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="e.g. New laptop" />
//             <div>
//               <FieldLabel>Icon</FieldLabel>
//               <EmojiPicker value={emoji} onChange={setEmoji} />
//             </div>
//           </div>
//           <AmountInput value={goal} onChange={setGoal} label="Your goal" error={!!problem} />
//           <QuickAmounts amounts={[100000, 250000, 500000, 1000000]} onPick={(n) => setGoal(formatAmountInput(String(n)))} />
//           {problem && <p className="text-center text-[13px] font-semibold text-danger">{problem}</p>}
//           <div>
//             <FieldLabel>How often?</FieldLabel>
//             <ChoiceTiles<AutoFrequency>
//               columns={3}
//               value={frequency}
//               onChange={setFrequency}
//               options={[
//                 { value: 'DAILY', label: 'Daily' },
//                 { value: 'WEEKLY', label: 'Weekly' },
//                 { value: 'MONTHLY', label: 'Monthly' },
//               ]}
//             />
//           </div>
//           <div>
//             <div className="mb-2 flex items-center justify-between">
//               <FieldLabel>For how long?</FieldLabel>
//               <span className="text-sm font-extrabold text-gold">{monthsLabel(term)}</span>
//             </div>
//             <NumberField label="Months" value={term} min={s.savings.minTargetMonths} max={maxMonths} onChange={setTerm} />
//             <p className="mt-2 text-[12px] text-ink-3">
//               Bonus: {rateOf(s.savings.targetRateShort)} under {s.savings.targetTierMedium} months · {rateOf(s.savings.targetRateMedium)} from{' '}
//               {s.savings.targetTierMedium} · {rateOf(s.savings.targetRateLong)} from {s.savings.targetTierLong}
//             </p>
//           </div>
//         </Card>
//       </div>
//
//       <div className="lg:pt-[92px]">
//         <Card gradient glow className="sticky top-24 space-y-5 p-6">
//           <p className="eyebrow text-ink-3">Your plan</p>
//           <div>
//             <p className="text-[13px] text-ink-3">We save, {frequencyAdverb(frequency)}</p>
//             <p className="num text-3xl font-extrabold">{naira(perDeposit)}</p>
//           </div>
//           <DetailRows
//             rows={[
//               ['Saves', `${runs} times`],
//               ['Ends', asDay(maturity)],
//               ['Bonus rate', rateOf(bonusRate)],
//               { label: 'Bonus if you reach it', value: naira(bonus), tone: 'success' },
//               { label: 'Total at the end', value: naira(value + bonus), bold: true },
//             ]}
//           />
//           <Notice tone="neutral">
//             Saved from your wallet automatically. If your wallet is short on a day, that save is missed and you can top up yourself.
//             Breaking early returns every naira; only the bonus is lost.
//           </Notice>
//           <Button block size="lg" icon={<Target className="h-4 w-4" />} disabled={!valid} loading={busy} onClick={create}>
//             Start saving
//           </Button>
//         </Card>
//       </div>
//     </div>
//   );
// }
