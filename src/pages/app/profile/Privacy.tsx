import { useState } from 'react';
import { Download, ShieldX, TriangleAlert } from 'lucide-react';
import { PageHeader } from '../../../components/PageHeader';
import { Notice } from '../../../components/ui/Bits';
import { Button } from '../../../components/ui/Button';
import { Card, DetailRows, SectionHeader } from '../../../components/ui/Card';
import { Input, Textarea } from '../../../components/ui/Field';
import { Modal } from '../../../components/ui/Modal';
import { OtpInput } from '../../../components/ui/PinPad';
import { Skeleton } from '../../../components/ui/Spinner';
import { useAction } from '../../../hooks/useAction';
import { useClosure } from '../../../hooks/queries';
import { meApi } from '../../../lib/api/endpoints';
import { downloadFile } from '../../../lib/cn';
import { asDay, maskEmail, naira } from '../../../lib/format';
import { useProfile, useSession } from '../../../state/session';
import { useSettings } from '../../../state/settings';

export default function Privacy() {
  const settings = useSettings();
  const closure = useClosure();
  const { busy, run } = useAction();
  const [closing, setClosing] = useState(false);
  const c = closure.data;

  const exportData = async () => {
    const data = await run(() => meApi.dataExport(), 'Your data is downloading');
    if (data) downloadFile(`kudi9ja-my-data-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(data, null, 2));
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader back="/app/profile" backLabel="Profile" title="Privacy and your data" subtitle={`Questions about your data: ${settings.company.privacyEmail}`} />

      <Card>
        <SectionHeader title="A copy of your data" />
        <p className="text-[13.5px] text-ink-2">
          Everything we hold about you — your profile, transactions, savings, loans, card payments, agreements and signature, loan groups,
          notifications, and your Help &amp; complaints conversations — in one file you can keep. Files you sent in a conversation are listed by name;
          open them from Help &amp; complaints.
        </p>
        <Button className="mt-4" variant="ghost" loading={busy} icon={<Download className="h-4 w-4" />} onClick={() => void exportData()}>
          Download my data
        </Button>
      </Card>

      <Card accent="danger">
        <SectionHeader title="Close your account" />
        {closure.isLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : c ? (
          <div className="space-y-4">
            <DetailRows
              rows={[
                ['In your wallet', naira(c.walletBalance)],
                // ['Locked in savings', naira(c.lockedInSavings)], // savings is switched off for now
                ['Owed on loans', naira(c.outstandingOnLoans)],
              ]}
            />
            {c.canClose ? (
              <Notice tone="gold" icon={<TriangleAlert className="h-5 w-5" />}>
                Closing cannot be undone. {c.retentionNote}
              </Notice>
            ) : (
              <Notice tone="danger" title="Not yet">
                <ul className="list-disc space-y-1 pl-5">
                  {c.blockers.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </Notice>
            )}
            <Button variant="danger" disabled={!c.canClose} icon={<ShieldX className="h-4 w-4" />} onClick={() => setClosing(true)}>
              Close my account
            </Button>
          </div>
        ) : null}
      </Card>

      <CloseAccount open={closing} onClose={() => setClosing(false)} />
    </div>
  );
}

function CloseAccount({ open, onClose }: { open: boolean; onClose: () => void }) {
  const profile = useProfile();
  const { signOut } = useSession();
  const { busy, run } = useAction();
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [reason, setReason] = useState('');

  const send = async () => {
    if (await run(() => meApi.closureCode())) setSent(true);
  };
  const close = async () => {
    const done = await run(() => meApi.closeAccount(code, password, reason.trim()));
    if (done) await signOut(`Your account is closed. Records are kept until ${asDay(done.retainUntil)}, as the law requires.`);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      locked={busy}
      title="Close your account"
      description="We will email you a code to confirm it is you."
      footer={
        sent ? (
          <Button block variant="danger" loading={busy} disabled={code.length < 6 || !password || reason.trim().length < 3} onClick={() => void close()}>
            Close account permanently
          </Button>
        ) : (
          <Button block loading={busy} onClick={() => void send()}>
            Email me a code
          </Button>
        )
      }
    >
      {sent ? (
        <div className="space-y-4">
          <p className="text-center text-[13px] text-ink-3">Code sent to {maskEmail(profile.email)}</p>
          <OtpInput value={code} onChange={setCode} autoFocus />
          <Input label="Your password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          <Textarea label="Why are you leaving?" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} maxLength={500} />
        </div>
      ) : (
        <p className="text-[13.5px] text-ink-2">
          Once closed you cannot sign in again, and this account number cannot be reused. You are taken out of any loan group, and any open
          conversation with us is closed. Your transaction records and your conversations with us, with the files in them, are kept for the period
          the law requires, then deleted.
        </p>
      )}
    </Modal>
  );
}
