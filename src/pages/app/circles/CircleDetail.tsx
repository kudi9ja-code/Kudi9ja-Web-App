// Switched off: savings and Ajo circles are commented out for now. Remove the "// " prefixes to bring this page back.
export {};

// import { useParams } from 'react-router-dom';
// import { useNavigate } from 'react-router-dom';
// import { CheckCircle2, Crown, HandCoins, LogOut, Users } from 'lucide-react';
// import { PageHeader } from '../../../components/PageHeader';
// import { Avatar, CopyButton, EmptyState, Notice, Pill, ProgressRing } from '../../../components/ui/Bits';
// import { Button } from '../../../components/ui/Button';
// import { Card, DetailRows, SectionHeader } from '../../../components/ui/Card';
// import { useDialogs } from '../../../components/ui/Dialogs';
// import { PageSpinner } from '../../../components/ui/Spinner';
// import { useAction } from '../../../hooks/useAction';
// import { useCircle, useRefresh } from '../../../hooks/queries';
// import { circlesApi } from '../../../lib/api/endpoints';
// import { cn } from '../../../lib/cn';
// import { asDay, naira } from '../../../lib/format';
//
// export default function CircleDetail() {
//   const { id = '' } = useParams();
//   const circle = useCircle(id);
//   const dialogs = useDialogs();
//   const refresh = useRefresh();
//   const navigate = useNavigate();
//   const { busy, run } = useAction();
//
//   if (circle.isLoading) return <PageSpinner />;
//   if (!circle.data) return <EmptyState icon={<Users />} title="Circle not found" action={<Button to="/app/circles">Back</Button>} />;
//   const c = circle.data;
//   const myTurn = c.currentCollector?.isMe && !c.iHaveCollected;
//
//   const contribute = async () => {
//     const pin = await dialogs.pin({ title: `Pay into ${c.name}`, amountLabel: `Round ${c.currentRound}`, amount: c.contribution });
//     if (!pin) return;
//     if (await run(() => circlesApi.contribute(id, pin), 'Contribution paid')) await refresh.circles();
//   };
//   const collect = async () => {
//     const pin = await dialogs.pin({ title: 'Collect the pot', amountLabel: 'To your wallet', amount: c.potSize });
//     if (!pin) return;
//     if (await run(() => circlesApi.collect(id, pin), (r) => r.message)) await refresh.circles();
//   };
//   const leave = async () => {
//     const ok = await dialogs.confirm({ title: 'Leave this circle?', message: 'You can only leave before it starts.', confirmLabel: 'Leave', danger: true });
//     if (ok && (await run(() => circlesApi.leave(id), 'You left the circle'))) {
//       await refresh.circles();
//       navigate('/app/circles', { replace: true });
//     }
//   };
//
//   return (
//     <div className="mx-auto max-w-5xl space-y-6">
//       <PageHeader
//         back="/app/circles"
//         backLabel="Circles"
//         eyebrow="Ajo circle"
//         title={
//           <span className="flex items-center gap-3">
//             <span className="text-3xl">{c.emoji}</span>
//             {c.name}
//           </span>
//         }
//         actions={<Pill tone={c.complete ? 'success' : 'gold'}>{c.complete ? 'Completed' : c.started ? `Round ${c.currentRound} of ${c.size}` : 'Not started'}</Pill>}
//       />
//
//       <Card gradient glow className="p-6 sm:p-8">
//         <div className="flex flex-col items-center gap-6 sm:flex-row">
//           <ProgressRing value={c.progress} size={140} tone={c.complete ? 'success' : 'gold'}>
//             <div className="text-center">
//               <p className="num text-2xl font-extrabold">
//                 {c.paidThisRound}/{c.size}
//               </p>
//               <p className="text-[11px] text-ink-3">paid this round</p>
//             </div>
//           </ProgressRing>
//           <div className="flex-1 text-center sm:text-left">
//             <p className="text-[13px] text-ink-3">Pot this round</p>
//             <p className="num text-4xl font-extrabold">{naira(c.potSize)}</p>
//             <p className="mt-1 text-sm text-ink-2">
//               {c.currentCollector ? `${c.currentCollector.isMe ? 'You collect' : `${c.currentCollector.displayName} collects`} this round` : ''}
//               {c.nextCollectionDate ? ` · ${asDay(c.nextCollectionDate)}` : ''}
//             </p>
//             {!c.complete && (
//               <div className="mt-5 flex flex-wrap justify-center gap-2.5 sm:justify-start">
//                 {!c.iHavePaidThisRound && c.started && (
//                   <Button loading={busy} icon={<HandCoins className="h-4 w-4" />} onClick={() => void contribute()}>
//                     Pay {naira(c.contribution)}
//                   </Button>
//                 )}
//                 {myTurn && (
//                   <Button variant="success" loading={busy} icon={<Crown className="h-4 w-4" />} onClick={() => void collect()}>
//                     Collect the pot
//                   </Button>
//                 )}
//                 {!c.started && (
//                   <Button variant="danger" loading={busy} icon={<LogOut className="h-4 w-4" />} onClick={() => void leave()}>
//                     Leave
//                   </Button>
//                 )}
//               </div>
//             )}
//           </div>
//         </div>
//       </Card>
//
//       {!c.complete && (
//         <Notice tone="neutral" title="Invite others">
//           <div className="flex flex-wrap items-center gap-3">
//             <span>Share this code:</span>
//             <span className="rounded-lg bg-surface-alt px-3 py-1 font-mono text-lg font-extrabold tracking-widest text-gold">{c.inviteCode}</span>
//             <CopyButton value={c.inviteCode} />
//           </div>
//         </Notice>
//       )}
//
//       <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
//         <Card padded={false}>
//           <div className="p-5 pb-3">
//             <SectionHeader title="Members, in payout order" className="mb-0" />
//           </div>
//           <ul className="divide-y divide-stroke">
//             {c.members.map((m) => (
//               <li key={m.id} className={cn('flex items-center gap-3 px-5 py-3', m.isMe && 'bg-gold/[0.05]')}>
//                 <span className="w-5 text-center text-[12px] font-extrabold text-ink-3">{m.position}</span>
//                 <Avatar name={m.displayName} size={36} />
//                 <div className="min-w-0 flex-1">
//                   <p className="truncate text-sm font-bold">
//                     {m.displayName} {m.isMe && <span className="text-ink-3">(you)</span>}
//                   </p>
//                   <p className="text-[12px] text-ink-3">Collects {asDay(m.payoutDate)}</p>
//                 </div>
//                 {m.hasCollected ? (
//                   <Pill tone="success" icon={<Crown className="h-3 w-3" />}>Collected</Pill>
//                 ) : m.paidThisRound ? (
//                   <Pill tone="success" icon={<CheckCircle2 className="h-3 w-3" />}>Paid</Pill>
//                 ) : c.started ? (
//                   <Pill tone="gold">Due</Pill>
//                 ) : null}
//               </li>
//             ))}
//           </ul>
//         </Card>
//         <Card>
//           <SectionHeader title="Details" />
//           <DetailRows
//             rows={[
//               ['Contribution', `${naira(c.contribution)} ${c.frequencyLabel.toLowerCase()}`],
//               ['Members', String(c.size)],
//               ['Started', c.started ? asDay(c.startDate) : 'Not yet'],
//               ['Your position', String(c.myPosition)],
//               ['Your payout', c.myPayoutDate ? asDay(c.myPayoutDate) : '—'],
//               ['Rounds you have paid', c.myRoundsPaid.length ? c.myRoundsPaid.join(', ') : 'None yet'],
//               { label: 'You pay in total', value: naira(c.totalCommitment), bold: true },
//             ]}
//           />
//         </Card>
//       </div>
//     </div>
//   );
// }
