import React, { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Link2, ShieldCheck } from 'lucide-react';
import { getConfiguredDataSource, setConfiguredDataSource, type DataSource } from '@/lib/data-source';

interface EpicConfigForm {
  fhirBaseUrl: string;
  tokenUrl: string;
  clientId: string;
  keyId: string;
  scopes: string;
  locationId: string;
  locationName: string;
  mrnSystem: string;
  authMode: 'backend_services' | 'sandbox_fixtures';
  privateKeyPem: string;
}

const EMPTY_FORM: EpicConfigForm = {
  fhirBaseUrl: 'https://fhir.epic.com/interconnect-fhir-oauth/api/FHIR/R4',
  tokenUrl: 'https://fhir.epic.com/interconnect-fhir-oauth/oauth2/token',
  clientId: '',
  keyId: '',
  scopes: '',
  locationId: '',
  locationName: '',
  mrnSystem: 'urn:oid:1.2.840.114350.1.13.0.1.7.5.737384',
  authMode: 'sandbox_fixtures',
  privateKeyPem: '',
};

interface EpicFhirSettingsProps {
  actorEmployeeNumber?: string;
}

export default function EpicFhirSettings({ actorEmployeeNumber }: EpicFhirSettingsProps) {
  const [form, setForm] = useState<EpicConfigForm>(EMPTY_FORM);
  const [dataSource, setDataSource] = useState<DataSource>(getConfiguredDataSource());
  const [configured, setConfigured] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!window.electronAPI?.getEpicConfig) return;
      const config = await window.electronAPI.getEpicConfig();
      if (cancelled || !config) return;
      setConfigured(config.configured);
      setForm((prev) => ({
        ...prev,
        fhirBaseUrl: config.fhirBaseUrl,
        tokenUrl: config.tokenUrl,
        clientId: config.clientId,
        keyId: config.keyId ?? '',
        scopes: config.scopes,
        locationId: config.locationId ?? '',
        locationName: config.locationName ?? '',
        mrnSystem: config.mrnSystem,
        authMode: config.authMode,
      }));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    window.setTimeout(() => setMessage(null), 4000);
  };

  const handleSave = async () => {
    if (!window.electronAPI?.saveEpicConfig) {
      showMessage('error', 'Epic settings are only available in the desktop app.');
      return;
    }
    setIsSaving(true);
    const result = await window.electronAPI.saveEpicConfig({
      fhirBaseUrl: form.fhirBaseUrl,
      tokenUrl: form.tokenUrl,
      clientId: form.clientId,
      keyId: form.keyId || undefined,
      scopes: form.scopes,
      locationId: form.locationId || undefined,
      locationName: form.locationName || undefined,
      mrnSystem: form.mrnSystem,
      authMode: form.authMode,
      privateKeyPem: form.privateKeyPem || undefined,
      actorEmployeeNumber,
    });
    setIsSaving(false);
    if (!result.success) {
      showMessage('error', result.error || 'Could not save Epic settings');
      return;
    }
    setConfigured(Boolean(result.config?.configured));
    setConfiguredDataSource(dataSource);
    setForm((prev) => ({ ...prev, privateKeyPem: '' }));
    showMessage('success', 'Epic FHIR settings saved. The private key is stored in the encrypted vault.');
  };

  const handleTest = async () => {
    if (!window.electronAPI?.testEpicConnection) {
      showMessage('error', 'Epic settings are only available in the desktop app.');
      return;
    }
    setIsTesting(true);
    const result = await window.electronAPI.testEpicConnection(actorEmployeeNumber);
    setIsTesting(false);
    if (result.ok) {
      showMessage('success', `Connected (${result.fhirVersion ?? 'R4'})`);
    } else {
      showMessage('error', result.error || 'Connection failed');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Epic FHIR
            </CardTitle>
            <CardDescription>
              Pull in-progress encounters from Epic using SMART Backend Services. TLS is required.
              Register the app at fhir.epic.com and upload the public JWKS. Sandbox fixtures fill rooms 801–840 (Lopez / Lin / Roberts stay on 812–814) when you click Sync Epic census — no credentials required.
            </CardDescription>
          </div>
          <Badge variant={configured ? 'default' : 'secondary'}>
            {form.authMode === 'sandbox_fixtures' ? 'Sandbox fixtures' : configured ? 'Configured' : 'Not configured'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Patient data source</Label>
            <Select value={dataSource} onValueChange={(value: DataSource) => setDataSource(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="local_device">Local device only</SelectItem>
                <SelectItem value="epic_fhir">Epic FHIR census</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Auth mode</Label>
            <Select
              value={form.authMode}
              onValueChange={(value: EpicConfigForm['authMode']) => setForm({ ...form, authMode: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sandbox_fixtures">Epic-shaped sandbox fixtures (no credentials)</SelectItem>
                <SelectItem value="backend_services">SMART Backend Services (live Epic)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="fhir-base">FHIR R4 base URL</Label>
            <Input
              id="fhir-base"
              value={form.fhirBaseUrl}
              onChange={(e) => setForm({ ...form, fhirBaseUrl: e.target.value })}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="token-url">Token URL</Label>
            <Input
              id="token-url"
              value={form.tokenUrl}
              onChange={(e) => setForm({ ...form, tokenUrl: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="client-id">Non-production client ID</Label>
            <Input
              id="client-id"
              value={form.clientId}
              onChange={(e) => setForm({ ...form, clientId: e.target.value })}
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="key-id">Key ID (optional)</Label>
            <Input
              id="key-id"
              value={form.keyId}
              onChange={(e) => setForm({ ...form, keyId: e.target.value })}
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location-id">Unit location FHIR ID</Label>
            <Input
              id="location-id"
              value={form.locationId}
              onChange={(e) => setForm({ ...form, locationId: e.target.value })}
              placeholder="Encounter.location filter"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location-name">Unit location name</Label>
            <Input
              id="location-name"
              value={form.locationName}
              onChange={(e) => setForm({ ...form, locationName: e.target.value })}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="scopes">SMART scopes</Label>
            <Input
              id="scopes"
              value={form.scopes}
              onChange={(e) => setForm({ ...form, scopes: e.target.value })}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="private-key">Private key PEM (never stored in the renderer after save)</Label>
            <Textarea
              id="private-key"
              value={form.privateKeyPem}
              onChange={(e) => setForm({ ...form, privateKeyPem: e.target.value })}
              placeholder="-----BEGIN PRIVATE KEY-----"
              className="font-mono text-xs min-h-28"
            />
          </div>
        </div>

        {message && (
          <Alert className={message.type === 'error' ? 'border-red-300' : 'border-green-300'}>
            <AlertDescription className="flex items-center gap-2">
              {message.type === 'success' && <ShieldCheck className="h-4 w-4" />}
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void handleSave()} disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Save connection'}
          </Button>
          <Button variant="outline" onClick={() => void handleTest()} disabled={isTesting}>
            {isTesting ? 'Testing…' : 'Test connection'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
