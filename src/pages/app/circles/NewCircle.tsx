// Switched off: savings and Ajo circles are commented out for now. Remove the "// " prefixes to bring this page back.
export {};

// import { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { Plus, Users, X } from 'lucide-react';
// import { PageHeader } from '../../../components/PageHeader';
// import { ChoiceTiles, Notice } from '../../../components/ui/Bits';
// import { Button } from '../../../components/ui/Button';
// import { Card, DetailRows } from '../../../components/ui/Card';
// import { useDialogs } from '../../../components/ui/Dialogs';
// import { Input } from '../../../components/ui/Field';
// import { AmountInput, FieldLabel } from '../../../components/ui/Inputs';
// import { useAction } from '../../../hooks/useAction';
// import { useRefresh } from '../../../hooks/queries';
// import { circlesApi } from '../../../lib/api/endpoints';
// import { naira, parseAmount } from '../../../lib/format';
// import { useProfile } from '../../../state/session';
// import { useSettings } from '../../../state/settings';
// import type { AutoFrequency } from '../../../types/api';
// import { EmojiPicker } from '../savings/TargetPlan';
//
// /** Starts a circle. Members are added by their Kudi9ja account number. */
// export default function NewCircle() {
//   const s = useSettings();
//   const profile = useProfile();
//   const dialogs = useDialogs();
//   const refresh = useRefresh();
//   const navigate = useNavigate();
//   const { busy, run } = useAction();
//   const [name, setName] = useState('');
//   const [emoji, setEmoji] = useState('🤝');
//   const [amount, setAmount] = useState('');
//   const [frequency, setFrequency] = useState<AutoFrequency>('MONTHLY');
//   const [refs, setRefs] = useState<string[]>([]);
//   const [ref, setRef] = useState('');
//
//   const contribution = parseAmount(amount);
//   const size = refs.length + 1;
//   const pot = contribution * size;
//   const tooSmall = contribution > 0 && contribution < s.thrift.minContribution;
//   const valid =
//     name.trim().length > 1 && contribution >= s.thrift.minContribution && size >= s.thrift.minMembers && size <= s.thrift.maxMembers;
//
//   const add = () => {
//     const r = ref.trim().toUpperCase();
//     if (!r || refs.includes(r) || r === profile.customerRef) return;
//     setRefs((old) => [...old, r]);
//     setRef('');
//   };
//
//   const create = async () => {
//     const pin = await dialogs.pin({
//       title: 'Start this circle?',
//       amountLabel: 'Each member pays per round',
//       amount: contribution,
//       details: [
//         ['Members', String(size)],
//         ['Pot each round', naira(pot)],
//       ],
//     });
//     if (!pin) return;
//     const circle = await run(
//       () => circlesApi.create({ name: name.trim(), contribution, frequency, memberRefs: refs, emoji, pin }),
//       'Circle started',
//     );
//     if (circle) {
//       await refresh.circles();
//       navigate(`/app/circles/${circle.id}`, { replace: true });
//     }
//   };
//
//   return (
//     <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_360px]">
//       <div>
//         <PageHeader back="/app/circles" backLabel="Circles" title="Start a circle" subtitle="Payouts go in the order members are added — you first." />
//         <Card className="space-y-6 p-6">
//           <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
//             <Input label="Circle name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="e.g. Market women's ajo" />
//             <div>
//               <FieldLabel>Icon</FieldLabel>
//               <EmojiPicker value={emoji} onChange={setEmoji} />
//             </div>
//           </div>
//           <AmountInput value={amount} onChange={setAmount} label="Each person pays, per round" error={tooSmall} />
//           {tooSmall && <p className="text-center text-[13px] font-semibold text-danger">The smallest contribution is {naira(s.thrift.minContribution)}.</p>}
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
//             <FieldLabel>Members ({size} of {s.thrift.maxMembers})</FieldLabel>
//             <div className="flex gap-2">
//               <Input
//                 value={ref}
//                 onChange={(e) => setRef(e.target.value.toUpperCase())}
//                 onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
//                 placeholder="Their Kudi9ja account number"
//                 wrapperClassName="flex-1"
//               />
//               <Button variant="ghost" icon={<Plus className="h-4 w-4" />} onClick={add} disabled={size >= s.thrift.maxMembers}>
//                 Add
//               </Button>
//             </div>
//             <ol className="mt-3 space-y-2">
//               <li className="flex items-center gap-3 rounded-xl border border-gold/30 bg-gold/[0.06] px-3 py-2 text-sm">
//                 <span className="grid h-6 w-6 place-items-center rounded-full bg-gold text-[11px] font-extrabold text-on-gold">1</span>
//                 You ({profile.customerRef})
//               </li>
//               {refs.map((r, i) => (
//                 <li key={r} className="flex items-center gap-3 rounded-xl border border-stroke px-3 py-2 text-sm">
//                   <span className="grid h-6 w-6 place-items-center rounded-full bg-surface-alt text-[11px] font-extrabold">{i + 2}</span>
//                   <span className="flex-1 font-mono">{r}</span>
//                   <button type="button" onClick={() => setRefs((old) => old.filter((x) => x !== r))} className="text-ink-3 hover:text-danger" aria-label={`Remove ${r}`}>
//                     <X className="h-4 w-4" />
//                   </button>
//                 </li>
//               ))}
//             </ol>
//             <p className="mt-2 text-[12px] text-ink-3">
//               Each member finds their account number on their profile. Anyone else can join later with the invite code.
//             </p>
//           </div>
//         </Card>
//       </div>
//       <div className="lg:pt-[92px]">
//         <Card gradient glow className="sticky top-24 space-y-5 p-6">
//           <p className="eyebrow text-ink-3">The circle</p>
//           <div>
//             <p className="text-[13px] text-ink-3">Pot each round</p>
//             <p className="num text-3xl font-extrabold">{naira(pot)}</p>
//           </div>
//           <DetailRows
//             rows={[
//               ['Members', String(size)],
//               ['Rounds', String(size)],
//               ['Each pays in total', naira(contribution * size)],
//             ]}
//           />
//           {size < s.thrift.minMembers && <Notice tone="gold">Add at least {s.thrift.minMembers - size} more to start.</Notice>}
//           <Button block size="lg" icon={<Users className="h-4 w-4" />} disabled={!valid} loading={busy} onClick={() => void create()}>
//             Start circle
//           </Button>
//         </Card>
//       </div>
//     </div>
//   );
// }
