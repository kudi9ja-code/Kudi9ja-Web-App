import { BriefcaseBusiness, /* PiggyBank, */ ShieldCheck, UserRound, Wallet } from 'lucide-react';
import { cn } from '../lib/cn';
import { nairaShort /* , ratePct */ } from '../lib/format';
import { useSettings } from '../state/settings';

/** The headline and the five promises, shared by the home page hero and the sign-in panel. */
export function PromiseHeading({ as: Tag = 'h1', className }: { as?: 'h1' | 'h2'; className?: string }) {
  return (
    <Tag className={cn('font-extrabold tracking-[-0.035em]', className)}>
      Easy Money, <span className="gold-text">that resolves your needs!</span>
    </Tag>
  );
}

export function PromiseList({ className }: { className?: string }) {
  const s = useSettings();
  const promises = [
    { icon: BriefcaseBusiness, title: 'Employer-Guaranteed Employee Loans', text: 'Your employer guarantees the loan, so you can get money for what you need before your salary comes in.' },
    { icon: UserRound, title: `Personal loans up to ${nairaShort(s.lending.maxAmount)}`, text: 'Borrow in your own name, at a flat rate set by the tenure you choose, and repay monthly or weekly.' },
    { icon: Wallet, title: 'Straight to your wallet', text: 'Approved loans land in your Kudi9ja wallet, with a repayment plan you can read at a glance.' },
    // Savings is switched off for now.
    // { icon: PiggyBank, title: `${ratePct(s.savings.annualRate * 100)} a year, paid upfront`, text: 'Lock any amount and your full return lands in your wallet the moment the plan starts.' },
    { icon: ShieldCheck, title: 'Two keys on every naira', text: 'A sign-in passcode to get in, and a separate transaction PIN for everything that moves money.' },
  ];

  return (
    <div className={cn('space-y-5', className)}>
      {promises.map(({ icon: Icon, title, text }, i) => (
        <div key={title} className="flex animate-rise gap-4" style={{ animationDelay: `${150 + i * 90}ms` }}>
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-gold/25 bg-gold/10 text-gold">
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <p className="font-extrabold">{title}</p>
            <p className="mt-0.5 text-[13.5px] leading-relaxed text-ink-2">{text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
