import { useMemo, useRef, useState } from 'react';
import { BookOpenCheck, CheckCircle2, FileSignature, Gavel, Handshake, ScrollText, ShieldCheck } from 'lucide-react';
import { LegalBody } from '../../../components/legal/LegalRenderer';
import { AccountKeyFacts, LendingKeyFacts } from '../../../components/legal/KeyFacts';
import { SignaturePad, type SignaturePadHandle } from '../../../components/SignaturePad';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Checkbox, Input } from '../../../components/ui/Field';
import { Notice, Pill, ProgressBar } from '../../../components/ui/Bits';
import { Modal } from '../../../components/ui/Modal';
import { PageSpinner } from '../../../components/ui/Spinner';
import { DEVICE_LABEL } from '../../../config';
import { useLegalDocuments } from '../../../hooks/queries';
import { signupApi } from '../../../lib/api/endpoints';
import { describeError } from '../../../lib/api/errors';
import { cn } from '../../../lib/cn';
import { asDay, asDayTime } from '../../../lib/format';
import { sameName } from '../../../lib/validators';
import { useSettings } from '../../../state/settings';
import type { LegalDocument, LegalKind, SessionResponse } from '../../../types/api';
import type { StepProps } from './Signup';
import { StepFrame } from './Steps';

export interface SignedRecord {
  fullName: string;
  email: string;
  typedName: string;
  signature: string;
  signedAt: string;
  documents: { kind: LegalKind; title: string; version: string }[];
  device: string;
}

const DOCS: { kind: LegalKind; icon: typeof Gavel; why: string }[] = [
  { kind: 'terms', icon: Gavel, why: 'Your account, your wallet, and paying in and out.' },
  { kind: 'privacy', icon: ShieldCheck, why: 'What we collect, why, who sees it, and the rights the NDPA 2023 gives you.' },
  { kind: 'lending', icon: Handshake, why: 'What a loan costs, how you repay it, and the limits we accept when collecting.' },
];

/**
 * Read, agree, sign.
 *
 * Each document has to be opened and scrolled to its end before it can be
 * accepted, the name typed has to be the name on the account, and the
 * signature has to be drawn. What is sent: the version of each document,
 * the explicit acceptance, the device — and the signature itself.
 */
export function AgreementsStep({ draft, onComplete }: StepProps & { onComplete: (session: SessionResponse, record: SignedRecord) => void }) {
  const settings = useSettings();
  const legal = useLegalDocuments();
  const pad = useRef<SignaturePadHandle>(null);
  const [read, setRead] = useState<Record<LegalKind, boolean>>({ terms: false, privacy: false, lending: false });
  const [accepted, setAccepted] = useState<Record<LegalKind, boolean>>({ terms: false, privacy: false, lending: false });
  const [opened, setOpened] = useState<LegalKind | null>(null);
  const [typedName, setTypedName] = useState('');
  const [padEmpty, setPadEmpty] = useState(true);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const now = useMemo(() => new Date(), []);

  if (!legal.data) return <PageSpinner label="Fetching the agreements…" />;
  const docs = legal.data;

  const allAccepted = DOCS.every((d) => accepted[d.kind]);
  const nameOk = sameName(typedName, draft.fullName);
  const ready = allAccepted && nameOk && !padEmpty && consent;

  const submit = async () => {
    const image = pad.current?.toDataUrl();
    if (!ready || !image || !draft.draftId) return;
    setBusy(true);
    setError(null);
    const signedAt = new Date().toISOString();
    const versions = Object.fromEntries(DOCS.map((d) => [d.kind, docs[d.kind]?.version ?? ''])) as Record<string, string>;
    try {
      const session = await signupApi.complete(draft.draftId, versions, { image, typedName: typedName.trim(), signedAt });
      onComplete(session, {
        fullName: draft.fullName.trim(),
        email: draft.email,
        typedName: typedName.trim(),
        signature: image,
        signedAt,
        documents: DOCS.map((d) => ({ kind: d.kind, title: docs[d.kind]?.title ?? d.kind, version: versions[d.kind] ?? '' })),
        device: `${DEVICE_LABEL} · ${navigator.userAgent}`,
      });
    } catch (e) {
      setError(describeError(e));
      setBusy(false);
    }
  };

  return (
    <StepFrame
      headline="Read, agree and sign"
      subhead={`Three agreements govern a Kudi9ja account. They are between you and ${settings.company.legalName} (${settings.company.rcNumber}). Read them, accept each one, then sign.`}
    >
      <Card>
        <div className="mb-4 flex items-center gap-3">
          <ScrollText className="h-5 w-5 text-gold" />
          <h2 className="text-[17px] font-extrabold">Kudi9ja lending, in plain words</h2>
        </div>
        <p className="mb-5 text-[13.5px] leading-relaxed text-ink-2">
          You do not have to borrow to have an account. If you ever do, these are the terms — the same ones the Lending Agreement sets out in full.
        </p>
        <LendingKeyFacts />
      </Card>

      <Card>
        <h2 className="mb-4 text-[17px] font-extrabold">Your account, in plain words</h2>
        <AccountKeyFacts />
      </Card>

      <div>
        <p className="eyebrow mb-3">The agreements</p>
        <div className="space-y-3">
          {DOCS.map(({ kind, icon: Icon, why }) => {
            const doc = docs[kind];
            if (!doc) return null;
            return (
              <div key={kind} className={cn('rounded-2xl border bg-surface p-4 transition', accepted[kind] ? 'border-success/40' : 'border-stroke')}>
                <div className="flex flex-wrap items-start gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gold/10 text-gold">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-extrabold">{doc.title}</p>
                      <span className="font-mono text-[11.5px] font-bold text-ink-3">v{doc.version}</span>
                      {read[kind] ? <Pill tone="success" icon={<BookOpenCheck />}>Read</Pill> : <Pill tone="neutral">{doc.readMinutes} min read</Pill>}
                    </div>
                    <p className="mt-1 text-[13px] leading-relaxed text-ink-2">{why}</p>
                  </div>
                  <Button variant={read[kind] ? 'ghost' : 'outline'} size="sm" onClick={() => setOpened(kind)}>
                    {read[kind] ? 'Read again' : 'Read in full'}
                  </Button>
                </div>
                <div className="mt-4 border-t border-stroke pt-3.5">
                  <Checkbox checked={accepted[kind]} disabled={!read[kind]} onChange={(v) => setAccepted((a) => ({ ...a, [kind]: v }))}>
                    I have read and I accept the <strong className="text-ink">{doc.title}</strong> (version {doc.version}).
                    {!read[kind] && <span className="block text-[12px] text-ink-3">Open it and read to the end to accept.</span>}
                  </Checkbox>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Card accent={ready ? 'success' : 'gold'}>
        <div className="mb-4 flex items-center gap-3">
          <FileSignature className="h-5 w-5 text-gold" />
          <h2 className="text-[17px] font-extrabold">Your signature</h2>
        </div>
        <div className="space-y-5">
          <Input
            label="Type your full legal name"
            placeholder={draft.fullName || 'As on your BVN'}
            value={typedName}
            onChange={(e) => setTypedName(e.target.value)}
            error={typedName && !nameOk ? `This has to match the name on your account: ${draft.fullName}` : null}
            hint={nameOk ? 'Matches your account.' : undefined}
          />
          {typedName && nameOk && <p className="-mt-2 font-[Dancing_Script,cursive] text-[34px] leading-none text-gold">{typedName}</p>}
          <div>
            <p className="mb-2 text-[13px] font-semibold text-ink-2">Draw your signature</p>
            <SignaturePad ref={pad} onChange={setPadEmpty} />
          </div>
          <div className="grid gap-3 rounded-xl border border-stroke bg-canvas/40 p-4 text-[12.5px] sm:grid-cols-3">
            <div>
              <p className="text-ink-3">Signing as</p>
              <p className="font-bold">{draft.fullName}</p>
            </div>
            <div>
              <p className="text-ink-3">Email</p>
              <p className="truncate font-bold">{draft.email}</p>
            </div>
            <div>
              <p className="text-ink-3">Date</p>
              <p className="font-bold">{asDay(now)}</p>
            </div>
          </div>
          <Checkbox checked={consent} onChange={setConsent}>
            I agree that my electronic signature above is the legal equivalent of my handwritten signature, and that {settings.company.legalName} may
            keep a record of this agreement — the version of each document, the date, the time and this device — as evidence of it under section 93
            of the Evidence Act 2011.
          </Checkbox>
        </div>
      </Card>

      {!ready && (
        <ul className="space-y-1.5 text-[12.5px]">
          {[
            [allAccepted, 'Read and accept all three agreements'],
            [nameOk, 'Type your full name exactly as on your account'],
            [!padEmpty, 'Draw your signature'],
            [consent, 'Agree to sign electronically'],
          ].map(([ok, label]) => (
            <li key={label as string} className={cn('flex items-center gap-2', ok ? 'text-success' : 'text-ink-3')}>
              <CheckCircle2 className="h-4 w-4" /> {label as string}
            </li>
          ))}
        </ul>
      )}
      {error && <Notice tone="danger">{error}</Notice>}
      <Button size="lg" block disabled={!ready} loading={busy} onClick={submit} icon={<FileSignature className="h-5 w-5" />}>
        Sign and open my account
      </Button>

      {opened && docs[opened] && (
        <DocumentReader
          doc={docs[opened]!}
          onClose={() => setOpened(null)}
          onRead={() => setRead((r) => ({ ...r, [opened]: true }))}
          onAccept={() => {
            setRead((r) => ({ ...r, [opened]: true }));
            setAccepted((a) => ({ ...a, [opened]: true }));
            setOpened(null);
          }}
          alreadyRead={read[opened]}
        />
      )}
    </StepFrame>
  );
}

/** The full document, with a reading bar. Reaching the end is what unlocks "I accept". */
function DocumentReader({
  doc,
  onClose,
  onRead,
  onAccept,
  alreadyRead,
}: {
  doc: LegalDocument;
  onClose: () => void;
  onRead: () => void;
  onAccept: () => void;
  alreadyRead: boolean;
}) {
  const [progress, setProgress] = useState(alreadyRead ? 1 : 0);
  const reached = useRef(alreadyRead);

  return (
    <Modal
      open
      onClose={onClose}
      size="xl"
      title={doc.title}
      description={`Version ${doc.version} · in force from ${asDay(doc.effectiveFrom)} · ${doc.readMinutes} min read`}
      footer={
        <div className="flex flex-wrap items-center gap-4">
          <div className="min-w-[160px] flex-1">
            <ProgressBar value={progress} tone={progress >= 1 ? 'success' : 'gold'} />
            <p className="mt-1.5 text-[12px] text-ink-3">{progress >= 1 ? 'You have reached the end.' : `${Math.round(progress * 100)}% read — scroll to the end to accept.`}</p>
          </div>
          <Button variant="subtle" onClick={onClose}>
            Close
          </Button>
          <Button disabled={progress < 1} onClick={onAccept}>
            I have read it — accept
          </Button>
        </div>
      }
    >
      <div
        className="-mx-6 -mb-6 max-h-[62vh] overflow-y-auto px-6 pb-8"
        onScroll={(e) => {
          const el = e.currentTarget;
          const p = el.scrollHeight <= el.clientHeight ? 1 : el.scrollTop / (el.scrollHeight - el.clientHeight);
          const next = Math.min(1, Math.max(progress, p >= 0.985 ? 1 : p));
          setProgress(next);
          if (next >= 1 && !reached.current) {
            reached.current = true;
            onRead();
          }
        }}
      >
        <p className="mb-8 rounded-2xl border border-stroke bg-canvas/40 p-5 text-[14.5px] leading-relaxed text-ink-2">{doc.summary}</p>
        <LegalBody doc={doc} compact />
        <p className="mt-10 border-t border-stroke pt-6 text-center text-[12.5px] text-ink-3">— End of the {doc.title} —</p>
      </div>
    </Modal>
  );
}

export function signedRecordHtml(record: SignedRecord, customerRef: string, company: { legalName: string; rcNumber: string }): string {
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Kudi9ja — signed agreement ${esc(customerRef)}</title>
<style>body{font-family:Figtree,Segoe UI,Arial,sans-serif;color:#1a1614;max-width:720px;margin:40px auto;padding:0 24px;line-height:1.55}
h1{font-size:24px;margin:0}h2{font-size:15px;margin:28px 0 8px;text-transform:uppercase;letter-spacing:.08em;color:#9a6510}
table{width:100%;border-collapse:collapse;font-size:14px}td{padding:8px 0;border-bottom:1px solid #e6dfd6;vertical-align:top}td:first-child{color:#5a524b;width:42%}
.sig{border:1px solid #e6dfd6;border-radius:12px;padding:16px;background:#fffdf8;margin-top:8px}.sig img{max-height:120px;max-width:100%}
small{color:#8a8078}</style></head><body>
<h1>Record of agreement</h1><p><small>${esc(company.legalName)} · ${esc(company.rcNumber)} · Kudi9ja</small></p>
<h2>The customer</h2><table>
<tr><td>Full name</td><td>${esc(record.fullName)}</td></tr>
<tr><td>Email</td><td>${esc(record.email)}</td></tr>
<tr><td>Customer reference</td><td>${esc(customerRef)}</td></tr>
<tr><td>Signed</td><td>${esc(asDayTime(record.signedAt))} (${esc(record.signedAt)})</td></tr>
<tr><td>Device</td><td>${esc(record.device)}</td></tr></table>
<h2>Agreements accepted</h2><table>${record.documents
    .map((d) => `<tr><td>${esc(d.title)}</td><td>Version ${esc(d.version)}</td></tr>`)
    .join('')}</table>
<h2>Signature</h2><p>Typed name: <strong>${esc(record.typedName)}</strong></p>
<div class="sig"><img src="${record.signature}" alt="Signature of ${esc(record.fullName)}"></div>
<p><small>Signed electronically. The customer agreed that this electronic signature is the legal equivalent of a handwritten one, and that this record may be kept as evidence of the agreement under section 93 of the Evidence Act 2011.</small></p>
</body></html>`;
}
