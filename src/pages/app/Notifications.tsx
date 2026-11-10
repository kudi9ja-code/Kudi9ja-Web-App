import { useEffect, useRef } from 'react';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '../../components/PageHeader';
import { EmptyState, IconBadge, Switch } from '../../components/ui/Bits';
import { Button } from '../../components/ui/Button';
import { Card, SectionHeader } from '../../components/ui/Card';
import { useDialogs } from '../../components/ui/Dialogs';
import { Skeleton } from '../../components/ui/Spinner';
import { useAction } from '../../hooks/useAction';
import { keys, useNotifications, usePreferences } from '../../hooks/queries';
import { notificationsApi } from '../../lib/api/endpoints';
import { cn } from '../../lib/cn';
import { naira, relative } from '../../lib/format';
import { notifyStyle } from '../../lib/labels';

export default function Notifications() {
  const list = useNotifications();
  const prefs = usePreferences();
  const qc = useQueryClient();
  const dialogs = useDialogs();
  const { run } = useAction();
  const items = list.data?.items ?? [];
  const unread = items.filter((n) => !n.read).length;
  const marked = useRef(false);

  // Opening the page reads them; mark once, after they have been shown.
  useEffect(() => {
    if (marked.current || !unread) return;
    marked.current = true;
    const t = setTimeout(() => {
      void notificationsApi.markRead().then(() => {
        void qc.invalidateQueries({ queryKey: keys.notifications });
        void qc.invalidateQueries({ queryKey: keys.dashboard });
      });
    }, 1500);
    return () => clearTimeout(t);
  }, [unread, qc]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Notifications"
        subtitle={unread ? `${unread} new` : 'You are all caught up.'}
        actions={
          items.length > 0 && (
            <>
              <Button size="sm" variant="ghost" icon={<CheckCheck className="h-4 w-4" />} onClick={() => void run(async () => {
                await notificationsApi.markRead();
                await qc.invalidateQueries({ queryKey: keys.notifications });
              })}>
                Mark all read
              </Button>
              <Button size="sm" variant="subtle" icon={<Trash2 className="h-4 w-4" />} onClick={async () => {
                const ok = await dialogs.confirm({ title: 'Clear notifications?', message: 'They are removed from this list. Security alerts are kept on record.', confirmLabel: 'Clear' });
                if (ok) await run(async () => {
                  await notificationsApi.clear();
                  await qc.invalidateQueries({ queryKey: keys.notifications });
                }, 'Cleared');
              }}>
                Clear
              </Button>
            </>
          )
        }
      />

      <Card padded={false}>
        {list.isLoading ? (
          <div className="space-y-3 p-4">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : items.length ? (
          <ul className="divide-y divide-stroke">
            {items.map((n) => {
              const style = notifyStyle[n.kind];
              const Icon = style.icon;
              return (
                <li key={n.id} className={cn('flex gap-3.5 px-4 py-3.5', !n.read && 'bg-gold/[0.05]')}>
                  <IconBadge size={40} tone={style.tone}>
                    <Icon />
                  </IconBadge>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className={cn('text-sm', n.read ? 'font-semibold' : 'font-extrabold')}>{n.title}</p>
                      <span className="shrink-0 text-[11.5px] text-ink-3">{relative(n.date)}</span>
                    </div>
                    <p className="mt-0.5 text-[13px] text-ink-2">{n.body}</p>
                    {n.amount != null && <p className="num mt-1 text-[13px] font-bold text-gold">{naira(n.amount)}</p>}
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState icon={<Bell />} title="No notifications" message="Payments, loans and replies from the team show up here." />
        )}
      </Card>

      <Card>
        <SectionHeader title="What to tell me about" />
        <ul className="divide-y divide-stroke">
          {(prefs.data ?? []).map((p) => (
            <li key={p.kind} className="flex items-center justify-between gap-4 py-3">
              <div>
                <p className="text-sm font-semibold">{p.label}</p>
                {!p.canBeSwitchedOff && <p className="text-[12px] text-ink-3">{p.whyNot ?? 'Always on — too important to miss.'}</p>}
              </div>
              <Switch
                label={p.label}
                checked={p.enabled}
                disabled={!p.canBeSwitchedOff}
                onChange={(on) =>
                  void run(async () => {
                    const updated = await notificationsApi.setPreference(p.kind, on);
                    qc.setQueryData(keys.preferences, updated);
                  })
                }
              />
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
