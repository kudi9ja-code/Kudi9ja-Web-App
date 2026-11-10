// Switched off: savings and Ajo circles are commented out for now. Remove the "// " prefixes to bring this page back.
export {};

// import { Calculator, PiggyBank, Plus, Target, TrendingUp } from 'lucide-react';
// import { PageHeader } from '../../../components/PageHeader';
// import { EmptyState, Notice, Pill, ProgressBar, StatTile } from '../../../components/ui/Bits';
// import { Button } from '../../../components/ui/Button';
// import { Card, SectionHeader } from '../../../components/ui/Card';
// import { Skeleton } from '../../../components/ui/Spinner';
// import { usePlans } from '../../../hooks/queries';
// import { asDay, naira, rateOf } from '../../../lib/format';
// import { planTone } from '../../../lib/labels';
// import { useProfile } from '../../../state/session';
// import { useSettings } from '../../../state/settings';
// import type { Plan } from '../../../types/api';
//
// export default function Savings() {
//   const plans = usePlans();
//   const settings = useSettings();
//   const profile = useProfile();
//   const hidden = profile.hideBalance;
//   const money = (n: number) => (hidden ? '₦ ••••' : naira(n));
//   const all = plans.data ?? [];
//   const active = all.filter((p) => p.status === 'ACTIVE' || p.status === 'MATURED');
//   const past = all.filter((p) => !(p.status === 'ACTIVE' || p.status === 'MATURED'));
//   const saved = active.reduce((sum, p) => sum + p.principal, 0);
//   const earned = all.reduce((sum, p) => sum + p.interestPaid + p.bonusEarned, 0);
//
//   return (
//     <div className="space-y-6">
//       <PageHeader
//         title="Savings"
//         subtitle={`Lock money away and earn up to ${rateOf(settings.savings.annualRate)} a year.`}
//         actions={
//           <>
//             <Button variant="ghost" to="/app/savings/calculator" icon={<Calculator className="h-4 w-4" />}>
//               Calculator
//             </Button>
//             <Button to="/app/savings/new" icon={<Plus className="h-4 w-4" />} disabled={!settings.switches.savingsEnabled}>
//               New plan
//             </Button>
//           </>
//         }
//       />
//       {!settings.switches.savingsEnabled && (
//         <Notice tone="info">New savings plans are paused for now. Your existing plans keep earning as normal.</Notice>
//       )}
//
//       <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
//         <StatTile label="Saved in plans" value={money(saved)} icon={<PiggyBank />} footnote={`${active.length} running`} />
//         <StatTile label="Earned so far" value={money(earned)} icon={<TrendingUp />} tone="success" footnote="Interest and bonuses" />
//         <StatTile
//           className="col-span-2 lg:col-span-1"
//           label="Fixed savings rate"
//           value={rateOf(settings.savings.annualRate)}
//           icon={<Target />}
//           tone="info"
//           footnote="A year, paid upfront"
//         />
//       </div>
//
//       <section>
//         <SectionHeader title="Your plans" />
//         {plans.isLoading ? (
//           <div className="grid gap-3 md:grid-cols-2">
//             {[0, 1].map((i) => (
//               <Skeleton key={i} className="h-40 w-full" />
//             ))}
//           </div>
//         ) : active.length ? (
//           <div className="grid gap-3 md:grid-cols-2">
//             {active.map((p) => (
//               <PlanCard key={p.id} plan={p} hidden={hidden} />
//             ))}
//           </div>
//         ) : (
//           <Card>
//             <EmptyState
//               icon={<PiggyBank />}
//               title="No savings plans yet"
//               message="A fixed plan pays its interest the day you start. A target plan builds up a little at a time."
//               action={<Button to="/app/savings/new">Start saving</Button>}
//             />
//           </Card>
//         )}
//       </section>
//
//       {past.length > 0 && (
//         <section>
//           <SectionHeader title="Finished plans" />
//           <div className="grid gap-3 md:grid-cols-2">
//             {past.map((p) => (
//               <PlanCard key={p.id} plan={p} hidden={hidden} />
//             ))}
//           </div>
//         </section>
//       )}
//     </div>
//   );
// }
//
// function PlanCard({ plan: p, hidden }: { plan: Plan; hidden: boolean }) {
//   const isTarget = p.type === 'TARGET';
//   return (
//     <Card to={`/app/savings/${p.id}`}>
//       <div className="flex items-start gap-3">
//         <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gold/10 text-2xl">{p.emoji}</span>
//         <div className="min-w-0 flex-1">
//           <div className="flex items-center justify-between gap-2">
//             <p className="truncate font-bold">{p.title}</p>
//             <Pill tone={planTone(p.status)}>{p.statusLabel}</Pill>
//           </div>
//           <p className="text-[12.5px] text-ink-3">
//             {p.typeLabel} · {rateOf(p.annualRate)} · {p.mature ? 'matured' : `matures ${asDay(p.maturityDate)}`}
//           </p>
//         </div>
//       </div>
//       <div className="mt-4 flex items-end justify-between">
//         <div>
//           <p className="text-[12px] text-ink-3">{isTarget ? 'Saved so far' : 'Locked'}</p>
//           <p className="num text-xl font-extrabold">{hidden ? '₦ ••••' : naira(p.principal)}</p>
//         </div>
//         <div className="text-right">
//           <p className="text-[12px] text-ink-3">{isTarget ? 'Goal' : 'At maturity'}</p>
//           <p className="num text-sm font-bold text-success">
//             {hidden ? '₦ ••••' : naira(isTarget ? (p.targetAmount ?? 0) : p.valueAtMaturity)}
//           </p>
//         </div>
//       </div>
//       <ProgressBar className="mt-3" value={isTarget ? p.goalProgress : p.progress} tone={p.mature ? 'success' : 'gold'} />
//       <p className="mt-1.5 text-[11.5px] text-ink-3">
//         {isTarget
//           ? `${Math.round(p.goalProgress * 100)}% of goal${p.autoEnabled && p.nextAutoRun ? ` · next auto-save ${asDay(p.nextAutoRun)}` : ''}`
//           : p.mature
//             ? 'Ready to withdraw'
//             : `${p.daysRemaining} days to go`}
//       </p>
//     </Card>
//   );
// }
