import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { Card, Button, Input, Skeleton, PageHeader } from '../../components/ui';

const SettingsIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const BuildingIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const InfoIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const SaveIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <Skeleton variant="text" width={200} height={32} />
        <Skeleton variant="text" width={300} height={18} className="mt-2" />
      </div>
      {[...Array(3)].map((_, i) => (
        <Card key={i}>
          <div className="flex items-center gap-3 mb-5">
            <Skeleton variant="rectangular" width={40} height={40} className="rounded-xl" />
            <div className="space-y-1.5">
              <Skeleton variant="text" width={150} height={20} />
              <Skeleton variant="text" width={200} height={14} />
            </div>
          </div>
          <Skeleton variant="rectangular" width="100%" height={40} className="rounded-xl" />
          <Skeleton variant="rectangular" width={120} height={40} className="rounded-xl mt-4" />
        </Card>
      ))}
    </div>
  );
}

export default function AdminSettings() {
  const { apiFetch } = useAuth();
  const { showToast } = useToast();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingOrg, setSavingOrg] = useState(false);
  const [savingCutoff, setSavingCutoff] = useState(false);

  useEffect(() => {
    apiFetch('/api/admin/settings')
      .then(setSettings)
      .finally(() => setLoading(false));
  }, []);

  const handleSaveOrganization = async () => {
    setSavingOrg(true);
    try {
      await apiFetch('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify({
          name: settings.name,
          lunch_cutoff_hour: settings.lunch_cutoff_hour,
          lunch_cutoff_minute: settings.lunch_cutoff_minute,
        }),
      });
      showToast({ type: 'success', title: 'Organization updated', message: 'Company name has been saved.' });
    } catch (err) {
      showToast({ type: 'error', title: 'Save failed', message: err.message });
    } finally {
      setSavingOrg(false);
    }
  };

  const handleSaveCutoff = async () => {
    setSavingCutoff(true);
    try {
      await apiFetch('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify({
          name: settings.name,
          lunch_cutoff_hour: settings.lunch_cutoff_hour,
          lunch_cutoff_minute: settings.lunch_cutoff_minute,
        }),
      });
      showToast({ type: 'success', title: 'Cutoff time updated', message: `Lunch cutoff set to ${settings.lunch_cutoff_hour.toString().padStart(2, '0')}:${settings.lunch_cutoff_minute.toString().padStart(2, '0')}.` });
    } catch (err) {
      showToast({ type: 'error', title: 'Save failed', message: err.message });
    } finally {
      setSavingCutoff(false);
    }
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Settings"
        subtitle="Configure organization and lunch confirmation settings"
      />

      {/* Organization Info */}
      <Card>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
            <BuildingIcon />
          </div>
          <div>
            <h3 className="text-base font-semibold text-surface-900">Organization Information</h3>
            <p className="text-sm text-surface-500">Basic company details</p>
          </div>
        </div>

        <div className="max-w-lg">
          <Input
            label="Company Name"
            placeholder="Your company name"
            value={settings?.name || ''}
            onChange={(e) => setSettings({ ...settings, name: e.target.value })}
          />
        </div>

        <div className="mt-5">
          <Button
            variant="primary"
            icon={<SaveIcon />}
            loading={savingOrg}
            onClick={handleSaveOrganization}
          >
            Save Organization
          </Button>
        </div>
      </Card>

      {/* Lunch Settings */}
      <Card>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-warning-50 flex items-center justify-center text-warning-600">
            <ClockIcon />
          </div>
          <div>
            <h3 className="text-base font-semibold text-surface-900">Lunch Confirmation Deadline</h3>
            <p className="text-sm text-surface-500">Employees must confirm their lunch before this time each day</p>
          </div>
        </div>

        <div className="max-w-lg">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Hour</label>
              <select
                value={settings?.lunch_cutoff_hour ?? 10}
                onChange={(e) => setSettings({ ...settings, lunch_cutoff_hour: parseInt(e.target.value) })}
                className="w-full rounded-xl border border-surface-300 px-4 py-2.5 text-sm bg-white appearance-none transition-colors focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>{i.toString().padStart(2, '0')}</option>
                ))}
              </select>
            </div>
            <span className="text-2xl font-bold text-surface-300 pb-2.5">:</span>
            <div className="flex-1">
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Minute</label>
              <select
                value={settings?.lunch_cutoff_minute ?? 0}
                onChange={(e) => setSettings({ ...settings, lunch_cutoff_minute: parseInt(e.target.value) })}
                className="w-full rounded-xl border border-surface-300 px-4 py-2.5 text-sm bg-white appearance-none transition-colors focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
              >
                {[0, 15, 30, 45].map(m => (
                  <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-3 p-3 bg-surface-50 rounded-xl">
            <p className="text-sm text-surface-600">
              Current cutoff time:{' '}
              <span className="font-semibold text-surface-900">
                {settings?.lunch_cutoff_hour?.toString().padStart(2, '0')}:{settings?.lunch_cutoff_minute?.toString().padStart(2, '0')}
              </span>
            </p>
          </div>
        </div>

        <div className="mt-5">
          <Button
            variant="primary"
            icon={<SaveIcon />}
            loading={savingCutoff}
            onClick={handleSaveCutoff}
          >
            Save Cutoff Time
          </Button>
        </div>
      </Card>

      {/* About */}
      <Card>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-surface-100 flex items-center justify-center text-surface-600">
            <InfoIcon />
          </div>
          <div>
            <h3 className="text-base font-semibold text-surface-900">About Lunchify</h3>
            <p className="text-sm text-surface-500">Application information</p>
          </div>
        </div>

        <div className="space-y-3 max-w-lg">
          <div className="flex items-center justify-between p-3 bg-surface-50 rounded-xl">
            <span className="text-sm text-surface-600">Application</span>
            <span className="text-sm font-semibold text-surface-900">Lunchify</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-surface-50 rounded-xl">
            <span className="text-sm text-surface-600">Version</span>
            <span className="text-sm font-semibold text-surface-900">1.0.0</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-surface-50 rounded-xl">
            <span className="text-sm text-surface-600">Role</span>
            <span className="text-sm font-semibold text-brand-600">Company Admin</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-surface-50 rounded-xl">
            <span className="text-sm text-surface-600">Environment</span>
            <span className="text-sm font-semibold text-surface-900">Production</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
