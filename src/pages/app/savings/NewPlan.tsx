// Switched off: savings and Ajo circles are commented out for now. Remove the "// " prefixes to bring this page back.
export {};

// import { ChevronRight, Lock, Target } from 'lucide-react';
// import { Link } from 'react-router-dom';
// import { PageHeader } from '../../../components/PageHeader';
// import { IconBadge } from '../../../components/ui/Bits';
// import { rateOf } from '../../../lib/format';
// import { useSettings } from '../../../state/settings';
//
// export default function NewPlan() {
//   const s = useSettings();
//   const options = [
//     {
//       to: '/app/savings/fixed',
//       icon: <Lock />,
//       title: 'Fixed savings',
//       body: `Lock an amount for ${s.savings.minLockDays} days or more and earn ${rateOf(s.savings.annualRate)} a year — paid into your wallet the day you start.`,
//       foot: 'Interest upfront',
//     },
//     {
//       to: '/app/savings/target',
//       icon: <Target />,
//       title: 'Target savings',
//       body: `Pick a goal and we save towards it daily, weekly or monthly. Reach it and collect a bonus of up to ${rateOf(s.savings.targetRateLong)}.`,
//       foot: `${s.savings.minTargetMonths}+ months`,
//     },
//   ];
//   return (
//     <div className="mx-auto max-w-3xl">
//       <PageHeader back="/app/savings" backLabel="Savings" title="Start a plan" subtitle="Two ways to save. Both are locked until they mature." />
//       <div className="grid gap-4 md:grid-cols-2">
//         {options.map((o) => (
//           <Link
//             key={o.to}
//             to={o.to}
//             className="group flex flex-col rounded-2xl border border-stroke bg-surface p-6 transition hover:-translate-y-0.5 hover:border-gold/40"
//           >
//             <IconBadge size={52}>{o.icon}</IconBadge>
//             <p className="mt-5 text-lg font-extrabold">{o.title}</p>
//             <p className="mt-1.5 flex-1 text-[13.5px] leading-relaxed text-ink-2">{o.body}</p>
//             <div className="mt-5 flex items-center justify-between text-[13px] font-bold text-gold">
//               {o.foot}
//               <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
//             </div>
//           </Link>
//         ))}
//       </div>
//     </div>
//   );
// }
