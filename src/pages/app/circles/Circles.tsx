// Switched off: savings and Ajo circles are commented out for now. Remove the "// " prefixes to bring this page back.
export {};

// import { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { Plus, UserPlus, Users } from 'lucide-react';
// import { PageHeader } from '../../../components/PageHeader';
// import { EmptyState, Notice, Pill, ProgressBar } from '../../../components/ui/Bits';
// import { Button } from '../../../components/ui/Button';
// import { Card, SectionHeader } from '../../../components/ui/Card';
// import { Input } from '../../../components/ui/Field';
// import { Modal } from '../../../components/ui/Modal';
// import { Skeleton } from '../../../components/ui/Spinner';
// import { useAction } from '../../../hooks/useAction';
// import { useCircles, useRefresh } from '../../../hooks/queries';
// import { circlesApi } from '../../../lib/api/endpoints';
// import { asDay, naira } from '../../../lib/format';
// import { useSettings } from '../../../state/settings';
// import type { Circle } from '../../../types/api';
//
// export default function Circles() {
//   const s = useSettings();
//   const circles = useCircles();
//   const [joining, setJoining] = useState(false);
//   const all = circles.data ?? [];
//   const running = all.filter((c) => !c.complete);
//   const done = all.filter((c) => c.complete);
//
//   return (
//     <div className="space-y-6">
//       <PageHeader
//         title="Ajo circles"
//         subtitle="Save together. Everyone pays in each round, and one member collects the pot."
//         actions={
//           <>
//             <Button variant="ghost" icon={<UserPlus className="h-4 w-4" />} onClick={() => setJoining(true)} disabled={!s.switches.thriftEnabled}>
//               Join with a code
//             </Button>
//             <Button to="/app/circles/new" icon={<Plus className="h-4 w-4" />} disabled={!s.switches.thriftEnabled}>
//               New circle
//             </Button>
//           </>
//         }
//       />
//       {!s.switches.thriftEnabled && <Notice tone="info">New circles are paused for now. Running circles carry on as normal.</Notice>}
//
//       <section>
//         <SectionHeader title="Your circles" />
//         {circles.isLoading ? (
//           <Skeleton className="h-40 w-full" />
//         ) : running.length ? (
//           <div className="grid gap-3 md:grid-cols-2">
//             {running.map((c) => (
//               <CircleCard key={c.id} c={c} />
//             ))}
//           </div>
//         ) : (
//           <Card>
//             <EmptyState
//               icon={<Users />}
//               title="No circles yet"
//               message={`Start one with ${s.thrift.minMembers} to ${s.thrift.maxMembers} people you trust, or join with an invite code.`}
//               action={<Button to="/app/circles/new">Start a circle</Button>}
//             />
//           </Card>
//         )}
//       </section>
//
//       {done.length > 0 && (
//         <section>
//           <SectionHeader title="Completed" />
//           <div className="grid gap-3 md:grid-cols-2">
//             {done.map((c) => (
//               <CircleCard key={c.id} c={c} />
//             ))}
//           </div>
//         </section>
//       )}
//
//       <JoinCircle open={joining} onClose={() => setJoining(false)} />
//     </div>
//   );
// }
//
// function CircleCard({ c }: { c: Circle }) {
//   return (
//     <Card to={`/app/circles/${c.id}`}>
//       <div className="flex items-start gap-3">
//         <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gold/10 text-2xl">{c.emoji}</span>
//         <div className="min-w-0 flex-1">
//           <div className="flex items-center justify-between gap-2">
//             <p className="truncate font-bold">{c.name}</p>
//             <Pill tone={c.complete ? 'success' : c.started ? 'gold' : 'info'}>
//               {c.complete ? 'Completed' : c.started ? `Round ${c.currentRound} of ${c.size}` : 'Not started'}
//             </Pill>
//           </div>
//           <p className="text-[12.5px] text-ink-3">
//             {naira(c.contribution)} {c.frequencyLabel.toLowerCase()} · {c.size} members · pot {naira(c.potSize)}
//           </p>
//         </div>
//       </div>
//       <ProgressBar className="mt-4" value={c.progress} tone={c.complete ? 'success' : 'gold'} />
//       <p className="mt-2 text-[12px] text-ink-3">
//         {c.iHaveCollected
//           ? 'You have collected your pot.'
//           : c.myPayoutDate
//             ? `Your turn: position ${c.myPosition}, ${asDay(c.myPayoutDate)}`
//             : `You are number ${c.myPosition}`}
//         {!c.complete && !c.iHavePaidThisRound && c.started && <span className="font-bold text-gold"> · your contribution is due</span>}
//       </p>
//     </Card>
//   );
// }
//
// function JoinCircle({ open, onClose }: { open: boolean; onClose: () => void }) {
//   const [code, setCode] = useState('');
//   const refresh = useRefresh();
//   const navigate = useNavigate();
//   const { busy, run } = useAction();
//   const join = async () => {
//     const circle = await run(() => circlesApi.join(code.trim().toUpperCase()), 'You are in');
//     if (circle) {
//       await refresh.circles();
//       onClose();
//       navigate(`/app/circles/${circle.id}`);
//     }
//   };
//   return (
//     <Modal
//       open={open}
//       onClose={onClose}
//       title="Join a circle"
//       description="Ask the person who started it for the invite code."
//       footer={
//         <Button block disabled={code.trim().length < 4} loading={busy} onClick={() => void join()}>
//           Join
//         </Button>
//       }
//     >
//       <Input label="Invite code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} autoFocus className="font-mono tracking-widest" />
//     </Modal>
//   );
// }
