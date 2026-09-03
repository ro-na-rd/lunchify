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

const CopyIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const LinkIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
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
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingOrg, setSavingOrg] = useState(false);
  const [savingCutoff, setSavingCutoff] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [editingPin, setEditingPin] = useState(null);
  const [pinValue, setPinValue] = useState('');

  useEffect(() => {
    Promise.all([
      apiFetch('/api/admin/settings'),
      apiFetch('/api/admin/restaurants'),
    ])
      .then(([settingsData, restaurantsData]) => {
        setSettings(settingsData);
        setRestaurants(restaurantsData || []);
      })
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

  const handleSavePin = async (restId) => {
    if (!pinValue.trim() || pinValue.length < 4) {
      showToast({ type: 'error', title: 'Invalid PIN', message: 'PIN must be at least 4 digits.' });
      return;
    }
    try {
      await apiFetch(`/api/admin/restaurants/${restId}/pin`, {
        method: 'PUT',
        body: JSON.stringify({ pin: pinValue.trim() }),
      });
      setRestaurants(prev => prev.map(r => r.id === restId ? { ...r, pin: pinValue.trim() } : r));
      setEditingPin(null);
      setPinValue('');
      showToast({ type: 'success', title: 'PIN updated', message: 'Restaurant PIN has been changed.' });
    } catch (err) {
      showToast({ type: 'error', title: 'Save failed', message: err.message });
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
          <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-blue-900/20 flex items-center justify-center text-brand-600 dark:text-blue-400">
            <BuildingIcon />
          </div>
          <div>
            <h3 className="text-base font-semibold text-surface-900 dark:text-surface-100">Organization Information</h3>
            <p className="text-sm text-surface-500 dark:text-surface-400">Basic company details</p>
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
          <div className="w-10 h-10 rounded-xl bg-warning-50 dark:bg-amber-900/20 flex items-center justify-center text-warning-600 dark:text-amber-400">
            <ClockIcon />
          </div>
          <div>
            <h3 className="text-base font-semibold text-surface-900 dark:text-surface-100">Lunch Confirmation Deadline</h3>
            <p className="text-sm text-surface-500 dark:text-surface-400">Employees must confirm their lunch before this time each day</p>
          </div>
        </div>

        <div className="max-w-lg">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-200 mb-1.5">Hour</label>
              <select
                value={settings?.lunch_cutoff_hour ?? 10}
                onChange={(e) => setSettings({ ...settings, lunch_cutoff_hour: parseInt(e.target.value) })}
                className="w-full rounded-xl border border-surface-300 dark:border-surface-700 px-4 py-2.5 text-sm bg-white dark:bg-surface-800 dark:text-surface-100 appearance-none transition-colors focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
              >
                {Array.from({ length: 24 }, (_, i) => (
                  <option key={i} value={i}>{i.toString().padStart(2, '0')}</option>
                ))}
              </select>
            </div>
            <span className="text-2xl font-bold text-surface-300 dark:text-surface-600 pb-2.5">:</span>
            <div className="flex-1">
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-200 mb-1.5">Minute</label>
              <select
                value={settings?.lunch_cutoff_minute ?? 0}
                onChange={(e) => setSettings({ ...settings, lunch_cutoff_minute: parseInt(e.target.value) })}
                className="w-full rounded-xl border border-surface-300 dark:border-surface-700 px-4 py-2.5 text-sm bg-white dark:bg-surface-800 dark:text-surface-100 appearance-none transition-colors focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10"
              >
                {[0, 15, 30, 45].map(m => (
                  <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-3 p-3 bg-surface-50 dark:bg-surface-700/50 rounded-xl">
            <p className="text-sm text-surface-600 dark:text-surface-300">
              Current cutoff time:{' '}
              <span className="font-semibold text-surface-900 dark:text-surface-100">
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

      {/* Restaurant Kitchen View Links */}
      {restaurants.length > 0 && (
        <Card>
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-success-50 dark:bg-emerald-900/20 flex items-center justify-center text-success-600 dark:text-emerald-400">
              <LinkIcon />
            </div>
            <div>
              <h3 className="text-base font-semibold text-surface-900 dark:text-surface-100">Kitchen View Links</h3>
              <p className="text-sm text-surface-500 dark:text-surface-400">Share these links with restaurant staff — no login required</p>
            </div>
          </div>

          <div className="space-y-3">
            {restaurants.map((rest) => {
              const kitchenUrl = `${window.location.origin}/kitchen/${rest.id}`;
              const isEditing = editingPin === rest.id;
              return (
                <div key={rest.id} className="p-4 bg-surface-50 dark:bg-surface-700/50 rounded-xl space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-success-100 dark:bg-emerald-900/30 flex items-center justify-center text-success-600 dark:text-emerald-400 font-bold text-sm shrink-0">
                      {rest.name?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-900 dark:text-surface-100">{rest.name}</p>
                      <p className="text-xs text-surface-400 truncate font-mono">{kitchenUrl}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={copiedId === rest.id ? <CheckIcon /> : <CopyIcon />}
                      onClick={() => {
                        navigator.clipboard.writeText(kitchenUrl);
                        setCopiedId(rest.id);
                        showToast({ type: 'success', title: 'Copied!', message: `Kitchen URL for ${rest.name} copied to clipboard.` });
                        setTimeout(() => setCopiedId(null), 2000);
                      }}
                    >
                      {copiedId === rest.id ? 'Copied' : 'Copy'}
                    </Button>
                    <a
                      href={kitchenUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Open
                    </a>
                  </div>

                  {/* PIN Section */}
                  <div className="flex items-center gap-2 pl-12">
                    <span className="text-xs text-surface-500 dark:text-surface-400">PIN:</span>
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          value={pinValue}
                          onChange={(e) => setPinValue(e.target.value.replace(/\D/g, ''))}
                          className="w-24 px-2 py-1 text-sm font-mono rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-surface-100 focus:outline-none focus:border-brand-500"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSavePin(rest.id)}
                          className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => { setEditingPin(null); setPinValue(''); }}
                          className="text-xs font-medium text-surface-400 hover:text-surface-600"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditingPin(rest.id); setPinValue(rest.pin || ''); }}
                        className="flex items-center gap-1.5 text-sm font-mono text-surface-700 dark:text-surface-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                      >
                        <span className="px-2 py-0.5 bg-surface-200 dark:bg-surface-600 rounded text-xs">{rest.pin || '----'}</span>
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* About */}
      <Card>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-surface-100 dark:bg-surface-700 flex items-center justify-center text-surface-600 dark:text-surface-300">
            <InfoIcon />
          </div>
          <div>
            <h3 className="text-base font-semibold text-surface-900 dark:text-surface-100">About Lunchify</h3>
            <p className="text-sm text-surface-500 dark:text-surface-400">Application information</p>
          </div>
        </div>

        <div className="space-y-3 max-w-lg">
          <div className="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-700/50 rounded-xl">
            <span className="text-sm text-surface-600 dark:text-surface-300">Application</span>
            <span className="text-sm font-semibold text-surface-900 dark:text-surface-100">Lunchify</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-700/50 rounded-xl">
            <span className="text-sm text-surface-600 dark:text-surface-300">Version</span>
            <span className="text-sm font-semibold text-surface-900 dark:text-surface-100">1.0.0</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-700/50 rounded-xl">
            <span className="text-sm text-surface-600 dark:text-surface-300">Role</span>
            <span className="text-sm font-semibold text-brand-600 dark:text-blue-400">Company Admin</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-700/50 rounded-xl">
            <span className="text-sm text-surface-600 dark:text-surface-300">Environment</span>
            <span className="text-sm font-semibold text-surface-900 dark:text-surface-100">Production</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
