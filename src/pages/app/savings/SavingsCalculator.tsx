// Switched off: savings and Ajo circles are commented out for now. Remove the "// " prefixes to bring this page back.
export {};

// import { useState } from 'react';
// import { PageHeader } from '../../../components/PageHeader';
// import { Segmented } from '../../../components/ui/Bits';
// import { Button } from '../../../components/ui/Button';
// import { Card, DetailRows } from '../../../components/ui/Card';
// import { AmountInput, FieldLabel, NumberField } from '../../../components/ui/Inputs';
// import { effectiveYieldPct, savingsInterest, targetPerDeposit, targetRateFor } from '../../../lib/finance';
// import { humanPeriod, months as monthsLabel, naira, parseAmount, ratePct, rateOf } from '../../../lib/format';
// import { frequencyAdverb } from '../../../lib/labels';
// import { useSettings } from '../../../state/settings';
// import type { AutoFrequency } from '../../../types/api';
//
// type Mode = 'fixed' | 'target';
//
// /** What a plan would earn, before starting one. Nothing here moves money. */
// export default function SavingsCalculator() {
//   const s = useSettings();
//   const [mode, setMode] = useState<Mode>('fixed');
//   const [amount, setAmount] = useState('500,000');
//   const [days, setDays] = useState(Math.max(180, s.savings.minLockDays));
//   const [term, setTerm] = useState(Math.max(6, s.savings.minTargetMonths));
//   const [frequency, setFrequency] = useState<AutoFrequency>('MONTHLY');
//   const value = parseAmount(amount);
//
//   const interest = savingsInterest(s, value, days);
//   const bonusRate = targetRateFor(s, term);
//
//   return (
//     <div className="mx-auto max-w-3xl space-y-6">
//       <PageHeader back="/app/savings" backLabel="Savings" title="Savings calculator" subtitle="Rates are the ones in force today." />
//       <Segmented<Mode>
//         value={mode}
//         onChange={setMode}
//         options={[
//           { value: 'fixed', label: 'Fixed savings' },
//           { value: 'target', label: 'Target savings' },
//         ]}
//       />
//       <div className="grid gap-6 md:grid-cols-2">
//         <Card className="space-y-6 p-6">
//           <AmountInput value={amount} onChange={setAmount} label={mode === 'fixed' ? 'Amount to lock' : 'Your goal'} />
//           {mode === 'fixed' ? (
//             <div>
//               <div className="mb-2 flex justify-between">
//                 <FieldLabel>Lock period</FieldLabel>
//                 <span className="text-sm font-extrabold text-gold">{humanPeriod(days)}</span>
//               </div>
//               <NumberField label="Days" value={days} min={s.savings.minLockDays} max={s.savings.maxLockDays} onChange={setDays} />
//             </div>
//           ) : (
//             <>
//               <div>
//                 <div className="mb-2 flex justify-between">
//                   <FieldLabel>Term</FieldLabel>
//                   <span className="text-sm font-extrabold text-gold">{monthsLabel(term)}</span>
//                 </div>
//                 <NumberField label="Months" value={term} min={s.savings.minTargetMonths} max={60} onChange={setTerm} />
//               </div>
//               <Segmented<AutoFrequency>
//                 size="sm"
//                 value={frequency}
//                 onChange={setFrequency}
//                 options={[
//                   { value: 'DAILY', label: 'Daily' },
//                   { value: 'WEEKLY', label: 'Weekly' },
//                   { value: 'MONTHLY', label: 'Monthly' },
//                 ]}
//               />
//             </>
//           )}
//         </Card>
//
//         <Card gradient glow className="space-y-5 p-6">
//           {mode === 'fixed' ? (
//             <>
//               <div>
//                 <p className="text-[13px] text-ink-3">Interest, paid the day you start</p>
//                 <p className="num text-4xl font-extrabold text-success">{naira(interest)}</p>
//               </div>
//               <DetailRows
//                 rows={[
//                   ['Rate', `${rateOf(s.savings.annualRate)} a year`],
//                   ['Over this period', ratePct(effectiveYieldPct(s, days))],
//                   { label: 'Principal back at maturity', value: naira(value), bold: true },
//                 ]}
//               />
//               <Button block to="/app/savings/fixed">
//                 Start a fixed plan
//               </Button>
//             </>
//           ) : (
//             <>
//               <div>
//                 <p className="text-[13px] text-ink-3">You would save, {frequencyAdverb(frequency)}</p>
//                 <p className="num text-4xl font-extrabold">{naira(targetPerDeposit(s, value, frequency, term))}</p>
//               </div>
//               <DetailRows
//                 rows={[
//                   ['Bonus rate', rateOf(bonusRate)],
//                   { label: 'Bonus at the end', value: naira(value * bonusRate), tone: 'success' },
//                   { label: 'You collect', value: naira(value * (1 + bonusRate)), bold: true },
//                 ]}
//               />
//               <Button block to="/app/savings/target">
//                 Start a target plan
//               </Button>
//             </>
//           )}
//         </Card>
//       </div>
//     </div>
//   );
// }
