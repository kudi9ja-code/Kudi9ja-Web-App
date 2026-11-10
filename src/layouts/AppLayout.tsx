import { createPortal } from 'react-dom';
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Bell,
  ChevronDown,
  CreditCard,
  Gauge,
  Home,
  LineChart,
  LogOut,
  Menu,
  X,
  MessagesSquare,
  Moon,
  // PiggyBank, // savings is switched off for now
  ReceiptText,
  Shield,
  ShieldCheck,
  Star,
  Sun,
  User,
  // Users, // Ajo circles are switched off for now
  Wrench,
} from 'lucide-react';
import { BrandLogo } from '../components/Brand';
import { AgreementUpdates } from '../components/AgreementUpdates';
import { Avatar } from '../components/ui/Bits';
import { IconButton } from '../components/ui/Button';
import { useDialogs } from '../components/ui/Dialogs';
import { useDashboard } from '../hooks/queries';
import { useSupportLive, useSupportUnread } from '../hooks/support';
import { cn } from '../lib/cn';
import { firstName } from '../lib/format';
import { useIdleLock, useProfile, useSession } from '../state/session';
import { useSettings } from '../state/settings';
import { useTheme } from '../state/theme';

const NAV = [
  { to: '/app', label: 'Home', icon: Home, end: true },
  // Savings and Ajo circles are switched off for now.
  // { to: '/app/savings', label: 'Save', icon: PiggyBank },
  { to: '/app/loans', label: 'Borrow', icon: CreditCard },
  { to: '/app/wallet', label: 'Wallet', icon: ReceiptText },
  // { to: '/app/circles', label: 'Ajo circles', icon: Users },
  { to: '/app/insights', label: 'Insights', icon: LineChart },
  { to: '/app/reviews', label: 'Reviews', icon: Star },
];

const MOBILE_NAV = [
  { to: '/app', label: 'Home', icon: Home, end: true },
  // { to: '/app/savings', label: 'Save', icon: PiggyBank },
  { to: '/app/loans', label: 'Borrow', icon: CreditCard },
  { to: '/app/wallet', label: 'Wallet', icon: ReceiptText },
  { to: '/app/profile', label: 'Profile', icon: User },
];

export function AppLayout() {
  useIdleLock();
  const settings = useSettings();
  const { isAdmin } = useSession();
  const { pathname } = useLocation();
  // Replies from the team arrive live anywhere in the app, so the badge is current.
  useSupportLive('customer');
  const supportUnread = useSupportUnread().data ?? 0;
  const chat = pathname.startsWith('/app/support');

  return (
    <div className="min-h-screen bg-canvas">
      <div className="night-gradient pointer-events-none fixed inset-0" />
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[260px] flex-col border-r border-stroke bg-surface/70 backdrop-blur-xl lg:flex">
        <div className="px-6 pb-4 pt-6">
          <BrandLogo height={40} to="/app" />
        </div>
        <nav className="scrollbar-thin flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {NAV.map((item) => (
            <SideLink key={item.to} {...item} />
          ))}
          <div className="my-4 h-px bg-stroke" />
          <SideLink to="/app/support" label="Help & complaints" icon={MessagesSquare} badge={supportUnread} />
          <SideLink to="/app/notifications" label="Notifications" icon={Bell} />
          <SideLink to="/app/profile" label="Profile" icon={User} />
          <SideLink to="/app/security" label="Security" icon={Shield} />
        </nav>
        {isAdmin && (
          <div className="p-3">
            <Link
              to="/admin"
              className="group flex items-center gap-3 rounded-2xl border border-gold/30 bg-gold/[0.07] p-3 transition hover:bg-gold/12"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl gold-gradient text-on-gold">
                <ShieldCheck className="h-[18px] w-[18px]" />
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-extrabold">Go to admin</span>
                <span className="block text-[11.5px] text-ink-3">The Kudi9ja panel</span>
              </span>
            </Link>
          </div>
        )}
        <p className="px-6 pb-5 text-[10.5px] leading-relaxed text-ink-3">
          {settings.company.legalName} · {settings.company.rcNumber}
        </p>
      </aside>

      <div className="relative lg:pl-[260px]">
        <TopBar supportUnread={supportUnread} />
        {settings.switches.maintenanceMode && (
          <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6 lg:px-10">
            <div className="flex items-center gap-3 rounded-2xl border border-gold/30 bg-gold/[0.08] px-4 py-3 text-[13px] text-ink-2">
              <Wrench className="h-4 w-4 shrink-0 text-gold" />
              Kudi9ja is under maintenance. You can look around, but new loans are paused for now.
            </div>
          </div>
        )}
        <main
          className={
            chat
              ? 'h-[calc(100dvh-64px-66px)] lg:h-[calc(100dvh-64px)]'
              : 'mx-auto max-w-6xl px-4 pb-32 pt-6 sm:px-6 lg:px-10 lg:pb-16'
          }
        >
          <Outlet />
        </main>
      </div>

      <MobileNav />
      <AgreementUpdates />
    </div>
  );
}

function SideLink({
  to,
  label,
  icon: Icon,
  end,
  badge,
}: {
  to: string;
  label: string;
  icon: typeof Home;
  end?: boolean;
  badge?: number;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[14px] font-semibold transition',
          isActive ? 'bg-gold/10 text-gold' : 'text-ink-2 hover:bg-surface-alt hover:text-ink',
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full gold-gradient" />}
          <Icon className="h-[18px] w-[18px]" />
          <span className="flex-1">{label}</span>
          {!!badge && (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1.5 text-[10.5px] font-extrabold text-on-gold">
              {badge > 99 ? '99+' : badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

function TopBar({ supportUnread }: { supportUnread: number }) {
  const [menu, setMenu] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => {
    setMenu(false);
  }, [pathname]);
  const dashboard = useDashboard();
  const unread = dashboard.data?.unreadNotifications ?? 0;
  const { resolved } = useTheme();
  const { setThemeChoice } = useSession();

  return (
    <div className="sticky top-0 z-20 border-b border-stroke/70 bg-canvas/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6 lg:px-10">
        <button
          type="button"
          onClick={() => setMenu(true)}
          className="relative -ml-1.5 grid h-10 w-10 place-items-center rounded-xl text-ink-2 transition hover:bg-surface-alt hover:text-ink lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
          {supportUnread > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-gold ring-2 ring-canvas" />}
        </button>
        <div className="lg:hidden">
          <BrandLogo height={30} to="/app" />
        </div>
        <div className="flex-1" />
        <IconButton
          label={resolved === 'dark' ? 'Switch to light' : 'Switch to dark'}
          onClick={() => setThemeChoice(resolved === 'dark' ? 'light' : 'dark')}
        >
          {resolved === 'dark' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
        </IconButton>
        <Link to="/app/notifications" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}>
          <IconButton label="Notifications" badge={unread} tabIndex={-1}>
            <Bell className="h-[18px] w-[18px]" />
          </IconButton>
        </Link>
        <AccountMenu />
      </div>
      {menu && createPortal(<MobileMenu onClose={() => setMenu(false)} supportUnread={supportUnread} />, document.body)}
    </div>
  );
}

/** Everything in the sidebar, for screens too narrow to show it. */
function MobileMenu({ onClose, supportUnread }: { onClose: () => void; supportUnread: number }) {
  const { isAdmin } = useSession();
  const settings = useSettings();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
      <div className="absolute inset-0 animate-fade-in bg-black/60" onClick={onClose} />
      <aside className="absolute inset-y-0 left-0 flex w-[290px] max-w-[85vw] animate-sheet-in flex-col border-r border-stroke bg-surface">
        <div className="flex items-center justify-between px-5 pb-3 pt-5">
          <BrandLogo height={34} to="/app" />
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg text-ink-3 hover:text-ink" aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="scrollbar-thin flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {NAV.map((item) => (
            <SideLink key={item.to} {...item} />
          ))}
          <div className="my-3 h-px bg-stroke" />
          <SideLink to="/app/support" label="Help & complaints" icon={MessagesSquare} badge={supportUnread} />
          <SideLink to="/app/notifications" label="Notifications" icon={Bell} />
          <SideLink to="/app/profile" label="Profile" icon={User} />
          <SideLink to="/app/security" label="Security" icon={Shield} />
          {isAdmin && <SideLink to="/admin" label="Admin panel" icon={ShieldCheck} />}
        </nav>
        <p className="px-6 pb-5 pt-2 text-[10.5px] leading-relaxed text-ink-3">
          {settings.company.legalName} · {settings.company.rcNumber}
        </p>
      </aside>
    </div>
  );
}

function AccountMenu() {
  const profile = useProfile();
  const { signOut, isAdmin, adminRole } = useSession();
  const dialogs = useDialogs();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const confirmSignOut = async () => {
    setOpen(false);
    const ok = await dialogs.confirm({
      title: 'Sign out?',
      message: 'Your money and history stay safe. You will need your email and password to sign back in.',
      confirmLabel: 'Sign out',
      danger: true,
    });
    if (ok) await signOut();
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border border-stroke bg-surface py-1 pl-1 pr-2.5 transition hover:border-gold/40"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Avatar name={profile.fullName} size={32} />
        <span className="hidden text-[13px] font-bold sm:block">{firstName(profile.fullName)}</span>
        <ChevronDown className="h-4 w-4 text-ink-3" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-[calc(100%+8px)] w-64 animate-sheet-in overflow-hidden rounded-2xl border border-stroke bg-surface shadow-pop">
          <div className="border-b border-stroke px-4 py-3.5">
            <p className="truncate text-sm font-extrabold">{profile.fullName}</p>
            <p className="truncate text-[12px] text-ink-3">{profile.email}</p>
            <p className="mt-1.5 font-mono text-[11.5px] font-bold text-gold">{profile.customerRef}</p>
          </div>
          <div className="p-1.5">
            <MenuLink to="/app/profile" icon={User} label="Profile" />
            <MenuLink to="/app/security" icon={Shield} label="Security" />
            <MenuLink to="/app/support" icon={MessagesSquare} label="Help & complaints" />
            {isAdmin && <MenuLink to="/admin" icon={Gauge} label={`Admin panel${adminRole ? ` · ${adminRole.toLowerCase()}` : ''}`} />}
            <button
              type="button"
              onClick={confirmSignOut}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold text-danger transition hover:bg-danger/10"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuLink({ to, icon: Icon, label }: { to: string; icon: typeof Home; label: string }) {
  return (
    <Link to={to} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-semibold text-ink-2 transition hover:bg-surface-alt hover:text-ink">
      <Icon className="h-4 w-4" /> {label}
    </Link>
  );
}

function MobileNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-stroke bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
      <div className="grid h-[66px] grid-cols-5">
        {MOBILE_NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => cn('flex flex-col items-center justify-center gap-1 text-[10.5px] font-semibold', isActive ? 'text-gold' : 'text-ink-3')}
          >
            {({ isActive }) => (
              <>
                <span className={cn('mb-0.5 h-[3px] w-5 rounded-full transition', isActive ? 'gold-gradient' : 'bg-transparent')} />
                <Icon className="h-[21px] w-[21px]" />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
