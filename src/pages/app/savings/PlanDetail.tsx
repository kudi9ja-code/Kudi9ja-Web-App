// Switched off: savings and Ajo circles are commented out for now. Remove the "// " prefixes to bring this page back.
export {};

// import { useState } from 'react';
// import { useParams } from 'react-router-dom';
// import { ArrowDownToLine, LockOpen, PiggyBank, Plus, Unlock } from 'lucide-react';
// import { PageHeader } from '../../../components/PageHeader';
// import { EmptyState, Notice, Pill, ProgressRing, Switch } from '../../../components/ui/Bits';
// import { Button } from '../../../components/ui/Button';
// import { Card, DetailRows, SectionHeader } from '../../../components/ui/Card';
// import { useDialogs } from '../../../components/ui/Dialogs';
// import { AmountInput } from '../../../components/ui/Inputs';
// import { Modal } from '../../../components/ui/Modal';
// import { PageSpinner } from '../../../components/ui/Spinner';
// import { useAction } from '../../../hooks/useAction';
// import { usePlan, useRefresh, useWallet } from '../../../hooks/queries';
// import { savingsApi } from '../../../lib/api/endpoints';
// import { savingsInterest } from '../../../lib/finance';
// import { asDay, naira, parseAmount, rateOf } from '../../../lib/format';
// import { frequencyAdverb, planTone } from '../../../lib/labels';
// import { useSettings } from '../../../state/settings';
//
// export default function PlanDetail() {
//   const { id = '' } = useParams();
//   const plan = usePlan(id);
//   const s = useSettings();
//   const wallet = useWallet();
//   const dialogs = useDialogs();
//   const refresh = useRefresh();
//   const { busy, run } = useAction();
//   const [topUp, setTopUp] = useState(false);
//   const [amount, setAmount] = useState('');
//
//   if (plan.isLoading) return <PageSpinner />;
//   if (!plan.data) return <EmptyState icon={<PiggyBank />} title="Plan not found" action={<Button to="/app/savings">Back to savings</Button>} />;
//   const p = plan.data;
//   const isTarget = p.type === 'TARGET';
//   const open = p.status === 'ACTIVE' || p.status === 'MATURED';
//   const value = parseAmount(amount);
//   const topUpInterest = !isTarget ? savingsInterest(s, value, p.daysRemaining) : 0;
//
//   const doTopUp = async () => {
//     const pin = await dialogs.pin({
//       title: 'Top up this plan',
//       amountLabel: 'Adding',
//       amount: value,
//       details: isTarget ? [] : [['Interest now', naira(topUpInterest)]],
//     });
//     if (!pin) return;
//     if (await run(() => savingsApi.topUp(id, value, pin), 'Topped up')) {
//       setTopUp(false);
//       setAmount('');
//       await refresh.savings();
//     }
//   };
//
//   const release = async (kind: 'withdraw' | 'break') => {
//     if (kind === 'break') {
//       const ok = await dialogs.confirm({
//         title: 'Break this plan early?',
//         message: `Every naira you saved, ${naira(p.principal)}, goes back to your wallet. The ${rateOf(p.bonusRate)} bonus is lost.`,
//         confirmLabel: 'Break plan',
//         danger: true,
//       });
//       if (!ok) return;
//     }
//     const pin = await dialogs.pin({
//       title: kind === 'withdraw' ? 'Withdraw to your wallet' : 'Confirm breaking the plan',
//       amountLabel: 'Back to your wallet',
//       amount: kind === 'withdraw' ? p.totalValue : p.principal,
//     });
//     if (!pin) return;
//     const done = await run(() => (kind === 'withdraw' ? savingsApi.withdraw(id, pin) : savingsApi.breakPlan(id, pin)), (r) => r.message);
//     if (done) await refresh.savings();
//   };
//
//   return (
//     <div className="mx-auto max-w-4xl space-y-6">
//       <PageHeader
//         back="/app/savings"
//         backLabel="Savings"
//         eyebrow={p.typeLabel}
//         title={
//           <span className="flex items-center gap-3">
//             <span className="text-3xl">{p.emoji}</span> {p.title}
//           </span>
//         }
//         actions={<Pill tone={planTone(p.status)}>{p.statusLabel}</Pill>}
//       />
//
//       <Card gradient glow className="p-6 sm:p-8">
//         <div className="flex flex-col items-center gap-6 sm:flex-row">
//           <ProgressRing value={isTarget ? p.goalProgress : p.progress} size={150} tone={p.mature ? 'success' : 'gold'}>
//             <div className="text-center">
//               <p className="num text-2xl font-extrabold">{Math.round((isTarget ? p.goalProgress : p.progress) * 100)}%</p>
//               <p className="text-[11px] text-ink-3">{isTarget ? 'of goal' : 'of the way'}</p>
//             </div>
//           </ProgressRing>
//           <div className="flex-1 text-center sm:text-left">
//             <p className="text-[13px] text-ink-3">{isTarget ? 'Saved so far' : 'Locked'}</p>
//             <p className="num text-4xl font-extrabold">{naira(p.principal)}</p>
//             <p className="mt-1 text-sm text-ink-2">
//               {isTarget
//                 ? p.goalReached
//                   ? 'Goal reached — the bonus is paid when it matures.'
//                   : `${naira(p.amountLeftToTarget)} to go to ${naira(p.targetAmount ?? 0)}`
//                 : p.mature
//                   ? 'Matured. Withdraw it to your wallet whenever you like.'
//                   : `${p.daysRemaining} days until it matures on ${asDay(p.maturityDate)}`}
//             </p>
//             <div className="mt-5 flex flex-wrap justify-center gap-2.5 sm:justify-start">
//               {open && !p.mature && (
//                 <Button icon={<Plus className="h-4 w-4" />} onClick={() => setTopUp(true)}>
//                   Top up
//                 </Button>
//               )}
//               {p.canWithdraw && (
//                 <Button variant="success" loading={busy} icon={<ArrowDownToLine className="h-4 w-4" />} onClick={() => void release('withdraw')}>
//                   Withdraw {naira(p.totalValue)}
//                 </Button>
//               )}
//               {p.canBreak && (
//                 <Button variant="danger" loading={busy} icon={<Unlock className="h-4 w-4" />} onClick={() => void release('break')}>
//                   Break early
//                 </Button>
//               )}
//             </div>
//           </div>
//         </div>
//       </Card>
//
//       <div className="grid gap-6 md:grid-cols-2">
//         <Card>
//           <SectionHeader title="Details" />
//           <DetailRows
//             rows={[
//               ['Started', asDay(p.startDate)],
//               ['Matures', asDay(p.maturityDate)],
//               isTarget ? ['Bonus rate', rateOf(p.bonusRate)] : ['Rate', `${rateOf(p.annualRate)} a year`],
//               isTarget ? null : { label: 'Interest paid to you', value: naira(p.interestPaid), tone: 'success' },
//               isTarget ? { label: p.bonusPaid ? 'Bonus paid' : 'Bonus if you finish', value: naira(p.bonusPaid ? p.bonusEarned : p.projectedBonus), tone: 'success' } : null,
//               { label: 'Value at maturity', value: naira(p.valueAtMaturity), bold: true },
//             ]}
//           />
//         </Card>
//
//         {isTarget && (
//           <Card>
//             <SectionHeader title="Auto-save" />
//             <div className="flex items-center justify-between gap-4">
//               <div>
//                 <p className="text-sm font-bold">
//                   {naira(p.autoAmount ?? 0)} {frequencyAdverb(p.autoFrequency)}
//                 </p>
//                 <p className="text-[12.5px] text-ink-3">
//                   {p.autoEnabled && p.nextAutoRun ? `Next on ${asDay(p.nextAutoRun)}` : 'Paused'}
//                 </p>
//               </div>
//               <Switch
//                 label="Auto-save"
//                 checked={p.autoEnabled}
//                 disabled={!open || busy}
//                 onChange={(on) => void run(async () => {
//                   await savingsApi.autoSave(id, on);
//                   await refresh.savings();
//                 }, on ? 'Auto-save is on' : 'Auto-save paused')}
//               />
//             </div>
//             <DetailRows
//               className="mt-4"
//               rows={[
//                 ['Saves made', String(p.contributions)],
//                 ['Missed (wallet short)', String(p.missedContributions)],
//               ]}
//             />
//           </Card>
//         )}
//       </div>
//
//       {p.mature && open && (
//         <Notice tone="success" icon={<LockOpen className="h-5 w-5" />} title="This plan has matured">
//           Withdraw it to your wallet, then save again or send it to your bank.
//         </Notice>
//       )}
//
//       <Modal
//         open={topUp}
//         onClose={() => setTopUp(false)}
//         title="Top up"
//         description={isTarget ? 'Moves money from your wallet into this plan.' : `Earns ${rateOf(p.annualRate)} a year for the ${p.daysRemaining} days left, paid now.`}
//         footer={
//           <Button block disabled={value <= 0 || value > (wallet.data?.balance ?? 0)} loading={busy} onClick={() => void doTopUp()}>
//             Add {value > 0 ? naira(value) : ''}
//           </Button>
//         }
//       >
//         <AmountInput value={amount} onChange={setAmount} autoFocus />
//         <p className="mt-3 text-center text-[12.5px] text-ink-3">Wallet: {naira(wallet.data?.balance ?? 0)}</p>
//         {!isTarget && value > 0 && <p className="mt-1 text-center text-[13px] font-bold text-success">+{naira(topUpInterest)} interest today</p>}
//       </Modal>
//     </div>
//   );
// }
