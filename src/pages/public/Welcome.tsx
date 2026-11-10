import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, FileText, Fingerprint, Landmark, Lock, Menu, /* PiggyBank, */ ShieldCheck, /* Users, */ X, Zap } from 'lucide-react';
import { BrandLogo, BrandMark } from '../../components/Brand';
import { PromiseHeading, PromiseList } from '../../components/Promises';
import { usePageTitle } from '../../components/PageHeader';
import { Button } from '../../components/ui/Button';
import { nairaFlat, nairaShort /* , ratePct */ } from '../../lib/format';
import { useSettings } from '../../state/settings';

/** The app's three onboarding slides, as a landing page. */
export default function Welcome() {
  usePageTitle('');
  const s = useSettings();
  const [menu, setMenu] = useState(false);
  // const rate = ratePct(s.savings.annualRate * 100); // savings is switched off for now

  return (
    <div className="min-h-screen bg-canvas">
      <div className="night-gradient pointer-events-none fixed inset-0" />

      <header className="relative z-20 mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <BrandLogo height={40} />
        {/* Phones: everything sits behind one menu button so the bar doesn't overflow. */}
        <button
          type="button"
          onClick={() => setMenu((m) => !m)}
          className="grid h-10 w-10 place-items-center rounded-xl border border-stroke bg-surface text-ink-2 transition hover:text-ink md:hidden"
          aria-label={menu ? 'Close menu' : 'Open menu'}
          aria-expanded={menu}
        >
          {menu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        {menu && (
          <div className="absolute inset-x-5 top-full -mt-1 animate-rise rounded-2xl border border-stroke bg-surface p-2 shadow-card md:hidden">
            <Link to="/legal" className="block rounded-xl px-4 py-3 text-[15px] font-semibold text-ink-2 hover:bg-surface-alt hover:text-ink">
              How it works
            </Link>
            <a href={`mailto:${s.company.supportEmail}`} className="block rounded-xl px-4 py-3 text-[15px] font-semibold text-ink-2 hover:bg-surface-alt hover:text-ink">
              Contact us
            </a>
            <div className="mt-2 grid gap-2 border-t border-stroke p-2 pt-4">
              <Button variant="ghost" block to="/signin">
                Sign in
              </Button>
              <Button block to="/signup">
                Open an account
              </Button>
            </div>
          </div>
        )}
        <nav className="hidden items-center gap-2 md:flex">
          <Link to="/legal" className="px-3 py-2 text-[13.5px] font-semibold text-ink-2 hover:text-ink">
            How it works
          </Link>
          <a href={`mailto:${s.company.supportEmail}`} className="px-3 py-2 text-[13.5px] font-semibold text-ink-2 hover:text-ink">
            Contact us
          </a>
          <Button variant="ghost" size="sm" to="/signin">
            Sign in
          </Button>
          <Button size="sm" to="/signup">
            Open an account
          </Button>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-8 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:pt-14">
        <div className="animate-rise">
          <ul className="grid w-fit grid-cols-2 gap-x-4 gap-y-1.5 rounded-2xl border border-gold/30 bg-gold/10 px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.1em] text-gold sm:flex sm:rounded-full sm:py-1.5 sm:text-[12px] sm:tracking-[0.14em]">
            {['Employee loans', 'Personal loans', 'Business loans' /* , 'Savings' */].map((label) => (
              <li key={label} className="flex items-center gap-2 whitespace-nowrap">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold" /> {label}
              </li>
            ))}
          </ul>
          <PromiseHeading className="mt-6 text-[42px] leading-[1.04] sm:text-[60px]" />
          <p className="mt-6 max-w-xl text-[17.6px] leading-relaxed text-ink">
            At Kudi9ja, we provide flexible financing solutions designed to meet your needs, with competitive monthly interest rates that make
            repayment easy and convenient.
          </p>
          <p className="mt-4 max-w-xl text-[17.6px] leading-relaxed text-ink">
            Money for the needs that can’t wait for month end, paid straight into your Kudi9ja wallet, with a repayment plan that is clear from
            day one.
          </p>
          <div className="mt-8 flex gap-2 sm:gap-3">
            <Button size="hero" to="/signup" iconRight={<ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />}>
              Get started
            </Button>
            <Button size="hero" variant="ghost" to="/signin">
              I already have an account
            </Button>
          </div>
          <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-[13px] text-ink-2">
            {[
              [ShieldCheck, 'Accounts held with your BVN & NIN'],
              [Lock, 'Passcode + transaction PIN'],
              [Fingerprint, 'Payments secured by Paystack'],
            ].map(([Icon, label]) => {
              const I = Icon as typeof Lock;
              return (
                <span key={label as string} className="flex items-center gap-2">
                  <I className="h-4 w-4 text-gold" /> {label as string}
                </span>
              );
            })}
          </div>
        </div>

        {/* The five promises, the same list the sign-in page shows */}
        <div className="relative animate-rise [animation-delay:150ms]">
          <div className="absolute -inset-6 rounded-[40px] bg-gold/10 blur-3xl" />
          <div className="card-gradient relative overflow-hidden rounded-3xl border border-gold/25 p-6 shadow-pop sm:p-8">
            <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-gold/20 blur-3xl" />
            <div className="relative">
              <div className="mb-7 flex items-center justify-between">
                <p className="eyebrow text-gold">Why Kudi9ja</p>
                <BrandMark size={28} />
              </div>
              <PromiseList />
            </div>
          </div>
        </div>
      </section>

      {/* Three products */}
      <section className="relative mx-auto max-w-6xl px-5 pb-20 sm:px-8">
        {/* Was three products in a grid (sm:grid-cols-2 lg:grid-cols-3); Savings and Ajo circles are switched off for now. */}
        <div className="mx-auto grid max-w-xl gap-5">
          <Product
            icon={<Zap />}
            eyebrow="Borrow"
            title="Credit at your speed"
            stat={nairaShort(s.lending.maxAmount)}
            statLabel="the most we lend"
            points={[
              'Interest rate as low as 5%',
              `Borrow ${nairaFlat(s.lending.minAmount)} to ${nairaFlat(s.lending.maxAmount)}`,
              'Repay weekly or monthly',
            ]}
          />
          {/* Savings and Ajo circles are switched off for now.
          <Product
            icon={<PiggyBank />}
            eyebrow="Save"
            title={`Fixed Savings at ${rate}`}
            stat={rate}
            statLabel="per annum, paid instantly"
            points={['Your whole return lands the day you start', 'Top up whenever you like', 'Principal returns in full at maturity']}
          />
          <Product
            className="sm:col-span-2 lg:col-span-1"
            icon={<Users />}
            eyebrow="Ajo circles"
            title="Ajo, done properly"
            stat={`${s.thrift.minMembers}–${s.thrift.maxMembers}`}
            statLabel="members per circle"
            points={['Everyone pays in each cycle', 'One member collects the pot each round', 'Kudi9ja keeps the record and the reminders']}
          />
          */}
        </div>
      </section>

      {/* How money moves */}
      <section className="relative mx-auto max-w-6xl px-5 pb-24 sm:px-8">
        <div className="rounded-3xl border border-stroke bg-surface p-5 sm:p-8 lg:p-10">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <p className="eyebrow text-gold">Built on trust</p>
              <h2 className="mt-3 text-[26px] font-extrabold leading-tight tracking-[-0.03em] sm:text-[30px]">Paid in by Paystack. Paid out to you alone.</h2>
              <p className="mt-4 leading-relaxed text-ink-2">
                Add money or repay a loan by card, bank transfer or USSD through Paystack. It reaches your wallet — or comes off what you owe — the
                moment Paystack confirms it, with no receipt to upload and nothing to wait for. Withdrawals go only to a bank account in your own name.
              </p>
              <div className="mt-6 flex items-center gap-3 rounded-2xl border border-stroke bg-canvas/40 p-4">
                <Landmark className="h-5 w-5 shrink-0 text-gold" />
                <p className="text-[13px] text-ink-2">
                  Card details go to Paystack, never to Kudi9ja. Every payment is checked with Paystack before a naira is credited.
                </p>
              </div>
            </div>
            <ol className="space-y-4">
              {[
                'Open your account in a few minutes — BVN, NIN and a payout account in your own name.',
                'Add money by card, bank transfer or USSD through Paystack — credited the moment it is confirmed.',
                'Apply for a loan and repay it from your wallet — every move confirmed with your PIN.',
                'Withdraw to your own bank account. Once approved, Paystack sends it straight to your bank.',
              ].map((t, i) => (
                <li key={t} className="flex gap-4">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full gold-gradient text-[13px] font-extrabold text-on-gold">{i + 1}</span>
                  <p className="pt-1 text-[14.5px] leading-relaxed text-ink-2">{t}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center gap-4 text-center">
          <h2 className="text-[26px] font-extrabold tracking-[-0.03em] sm:text-[28px]">Ready when you are.</h2>
          <div className="flex justify-center gap-2 sm:gap-3">
            <Button size="hero" to="/signup" iconRight={<ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />}>
              Open my account
            </Button>
            <Button size="hero" variant="ghost" to="/legal" icon={<FileText className="h-4 w-4 sm:h-5 sm:w-5" />}>
              Read the terms first
            </Button>
          </div>
        </div>
      </section>

      <footer className="relative border-t border-stroke">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 text-[12.5px] text-ink-3 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <p className="max-w-xl leading-relaxed lg:max-w-none">
            © {new Date().getFullYear()} {s.company.legalName} · {s.company.rcNumber}. Kudi9ja is a product of {s.company.legalName}.
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-2 whitespace-nowrap">
            <Link to="/legal/terms" className="hover:text-gold">Terms</Link>
            <Link to="/legal/privacy" className="hover:text-gold">Privacy</Link>
            <Link to="/legal/lending" className="hover:text-gold">Lending Agreement</Link>
            <a href={`mailto:${s.company.supportEmail}`} className="hover:text-gold">{s.company.supportEmail}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Product({
  className,
  icon,
  eyebrow,
  title,
  stat,
  statLabel,
  points,
}: {
  className?: string;
  icon: ReactNode;
  eyebrow: string;
  title: string;
  stat: string;
  statLabel: string;
  points: string[];
}) {
  return (
    <div className={`group rounded-3xl border border-stroke bg-surface p-6 transition hover:-translate-y-1 hover:border-gold/35 sm:p-7 ${className ?? ''}`}>
      <span className="grid h-12 w-12 place-items-center rounded-2xl border border-gold/25 bg-gold/10 text-gold [&>svg]:h-6 [&>svg]:w-6">{icon}</span>
      <p className="eyebrow mt-6 text-gold">{eyebrow}</p>
      <h3 className="mt-1.5 text-xl font-extrabold tracking-[-0.02em]">{title}</h3>
      <div className="mt-5 flex items-baseline gap-3 border-y border-stroke py-4">
        <span className="num text-[30px] font-extrabold tracking-[-0.03em] gold-text">{stat}</span>
        <span className="text-[12.5px] text-ink-3">{statLabel}</span>
      </div>
      <ul className="mt-5 space-y-2.5">
        {points.map((p) => (
          <li key={p} className="flex gap-2.5 text-[13.5px] text-ink-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /> {p}
          </li>
        ))}
      </ul>
    </div>
  );
}
