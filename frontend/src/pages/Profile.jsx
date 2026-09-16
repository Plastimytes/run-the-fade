import { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext.jsx';
import { api, photoSrc } from '../api.js';
import Layout from '../components/Layout.jsx';
import { WEIGHT_CLASSES, HEIGHT_CLASSES, FIGHTING_STYLES, STRENGTH_OPTIONS } from '../constants.js';

export default function Profile() {
  const { profile, refresh } = useAuth();
  const [form, setForm] = useState(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [geoStatus, setGeoStatus] = useState('');
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState('');

  useEffect(() => {
    if (profile) {
      setForm({
        weight_class: profile.weight_class === 'Unset' ? '' : profile.weight_class,
        height_class: profile.height_class === 'Unset' ? '' : profile.height_class,
        fighting_style: profile.fighting_style === 'Unset' ? '' : profile.fighting_style,
        strengths: profile.strengths || [],
        bio: profile.bio || '',
        city: profile.city || '',
        lat: profile.lat,
        lng: profile.lng,
        status: profile.status,
      });
    }
  }, [profile]);

  if (!form) return <Layout><p className="muted">Loading…</p></Layout>;

  const onPhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoUploading(true);
    setPhotoError('');
    try {
      await api.uploadPhoto(file);
      await refresh();
    } catch (err) {
      setPhotoError(err.message);
    } finally {
      setPhotoUploading(false);
    }
  };

  const toggleStrength = (s) => {
    setForm((f) => ({
      ...f,
      strengths: f.strengths.includes(s) ? f.strengths.filter((x) => x !== s) : [...f.strengths, s],
    }));
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus('Geolocation not supported by this browser');
      return;
    }
    setGeoStatus('Locating…');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({ ...f, lat: pos.coords.latitude, lng: pos.coords.longitude }));
        setGeoStatus('Location captured');
      },
      () => setGeoStatus('Could not get location — enter your city manually'),
    );
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      await api.updateMe(form);
      await refresh();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <h1 className="page-title">My Profile</h1>
      <p className="page-subtitle">This is what other fighters see when they swipe.</p>

      {error && <div className="error-banner">{error}</div>}
      {photoError && <div className="error-banner">{photoError}</div>}

      <div className="avatar-upload">
        {profile?.photo_url ? (
          <img className="avatar-preview" src={photoSrc(profile.photo_url)} alt="Your profile" />
        ) : (
          <div className="avatar-placeholder">🥊</div>
        )}
        <div>
          <label className="btn btn-secondary" style={{ display: 'inline-block', cursor: 'pointer' }}>
            {photoUploading ? 'Uploading…' : 'Change Photo'}
            <input type="file" accept="image/*" onChange={onPhotoChange} disabled={photoUploading} style={{ display: 'none' }} />
          </label>
          <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>JPG, PNG, WEBP, or GIF. Max 5MB.</div>
        </div>
      </div>

      <div className="toggle-row">
        <div>
          <div className="toggle-label">Looking for a fade</div>
          <div className="toggle-desc">Turn this on to appear in other fighters' decks.</div>
        </div>
        <button
          type="button"
          className={'switch' + (form.status === 'looking' ? ' on' : '')}
          onClick={() => setForm((f) => ({ ...f, status: f.status === 'looking' ? 'not_looking' : 'looking' }))}
        />
      </div>

      <form onSubmit={submit}>
        <div className="grid-2">
          <div className="field">
            <label>Weight Class</label>
            <select
              value={form.weight_class}
              onChange={(e) => setForm((f) => ({ ...f, weight_class: e.target.value }))}
              required
            >
              <option value="" disabled>Select…</option>
              {WEIGHT_CLASSES.map((w) => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Height Class</label>
            <select
              value={form.height_class}
              onChange={(e) => setForm((f) => ({ ...f, height_class: e.target.value }))}
              required
            >
              <option value="" disabled>Select…</option>
              {HEIGHT_CLASSES.map((h) => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
        </div>

        <div className="field">
          <label>Fighting Style</label>
          <select
            value={form.fighting_style}
            onChange={(e) => setForm((f) => ({ ...f, fighting_style: e.target.value }))}
            required
          >
            <option value="" disabled>Select…</option>
            {FIGHTING_STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="field">
          <label>Strengths</label>
          <div className="tag-row">
            {STRENGTH_OPTIONS.map((s) => (
              <button
                type="button"
                key={s}
                className={'tag' + (form.strengths.includes(s) ? ' accent' : '')}
                onClick={() => toggleStrength(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>Bio</label>
          <textarea
            value={form.bio}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
            placeholder="Callout, record, what you're looking for…"
          />
        </div>

        <div className="grid-2">
          <div className="field">
            <label>City</label>
            <input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
          </div>
          <div className="field">
            <label>Location for matching</label>
            <button type="button" className="btn btn-secondary btn-block" onClick={useMyLocation}>
              Use my current location
            </button>
            {geoStatus && <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>{geoStatus}</div>}
          </div>
        </div>

        <button className="btn btn-primary" disabled={saving} style={{ marginTop: 8 }}>
          {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save Profile'}
        </button>
      </form>
    </Layout>
  );
}
