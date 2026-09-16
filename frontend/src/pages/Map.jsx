import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api, photoSrc } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import Layout from '../components/Layout.jsx';

const FALLBACK_CENTER = [0.3476, 32.5825]; // used only if no location is available anywhere

export default function MapPage() {
  const { profile } = useAuth();
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersLayer = useRef(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const startCenter =
      profile?.lat != null && profile?.lng != null ? [profile.lat, profile.lng] : FALLBACK_CENTER;

    const map = L.map(mapRef.current, { zoomControl: true }).setView(startCenter, 12);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    mapInstance.current = map;
    markersLayer.current = L.layerGroup().addTo(map);

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [nearby, locs] = await Promise.all([api.getNearby(), api.getAllLocations()]);

        // Nearby "looking" fighters — accent-colored dots
        nearby.fighters
          .filter((f) => f.lat != null && f.lng != null)
          .forEach((f) => {
            const marker = L.circleMarker([f.lat, f.lng], {
              radius: 9,
              color: '#f2e600',
              weight: 2,
              fillColor: '#f2e600',
              fillOpacity: 0.85,
            });
            const photo = f.photo_url
              ? `<img src="${photoSrc(f.photo_url)}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;margin-bottom:6px" />`
              : '';
            marker.bindPopup(
              `<div>${photo}<div class="map-popup-title">${f.name}</div><div class="map-popup-meta">${f.weight_class} · ${f.fighting_style}</div></div>`
            );
            marker.addTo(markersLayer.current);
          });

        // Fade venues — amber dots
        locs.locations
          .filter((l) => l.lat != null && l.lng != null)
          .forEach((l) => {
            const marker = L.circleMarker([l.lat, l.lng], {
              radius: 8,
              color: '#23f1e0',
              weight: 2,
              fillColor: '#23f1e0',
              fillOpacity: 0.75,
            });
            marker.bindPopup(
              `<div><div class="map-popup-title">${l.name}</div><div class="map-popup-meta">${l.address}</div></div>`
            );
            marker.addTo(markersLayer.current);
          });

        // My own location — bright green
        if (profile?.lat != null && profile?.lng != null) {
          L.circleMarker([profile.lat, profile.lng], {
            radius: 8,
            color: '#ffffff',
            weight: 3,
            fillColor: '#ffffff',
            fillOpacity: 0.9,
          })
            .bindPopup('<div class="map-popup-title">You</div>')
            .addTo(markersLayer.current);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    load();

    return () => {
      map.remove();
      mapInstance.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Layout>
      <h1 className="page-title">Map</h1>
      <p className="page-subtitle">Fighters looking for a fade, and every overseer's location, near you.</p>

      {error && <div className="error-banner">{error}</div>}
      {loading && <p className="muted">Loading map…</p>}

      <div className="map-legend">
        <span><span className="legend-dot" style={{ background: '#f2e600' }} /> Fighters looking</span>
        <span><span className="legend-dot" style={{ background: '#23f1e0' }} /> Fade locations</span>
        <span><span className="legend-dot" style={{ background: '#ffffff' }} /> You</span>
      </div>

      <div className="map-container" ref={mapRef} />

      {!profile?.lat && (
        <p className="muted" style={{ marginTop: 10, fontSize: 12 }}>
          Set your location on your Profile page to see yourself on the map and get accurate distances.
        </p>
      )}
    </Layout>
  );
}
