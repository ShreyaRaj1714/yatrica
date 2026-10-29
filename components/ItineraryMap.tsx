'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ── Fix broken Leaflet default icons in Next.js/webpack ──────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ── Types ─────────────────────────────────────────────────────────────────

export interface MapMarker {
  lat: number;
  lng: number;
  label: string;       // popup heading
  sublabel?: string;   // popup sub-line
  emoji: string;       // shown on the pin
  color: string;       // tailwind-like hex for the pin background
}

interface Props {
  markers: MapMarker[];
}

// ── Custom div icon factory ───────────────────────────────────────────────

function makeIcon(emoji: string, color: string) {
  return L.divIcon({
    className: '',
    iconSize:   [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36],
    html: `
      <div style="
        width:36px; height:36px;
        background:${color};
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        border:2px solid white;
        box-shadow:0 2px 6px rgba(0,0,0,0.3);
        display:flex; align-items:center; justify-content:center;
      ">
        <span style="transform:rotate(45deg); font-size:15px; line-height:1;">${emoji}</span>
      </div>`,
  });
}

// ── Auto-fit bounds ───────────────────────────────────────────────────────

function FitBounds({ markers }: { markers: MapMarker[] }) {
  const map = useMap();
  useEffect(() => {
    if (markers.length === 0) return;
    if (markers.length === 1) {
      map.setView([markers[0].lat, markers[0].lng], 13);
      return;
    }
    const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]));
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [map, markers]);
  return null;
}

// ── Map component ─────────────────────────────────────────────────────────

export default function ItineraryMap({ markers }: Props) {
  if (markers.length === 0) return null;

  const center: [number, number] = [markers[0].lat, markers[0].lng];

  return (
    <div className="rounded-2xl overflow-hidden border border-orange-100 shadow-md" style={{ height: 420 }}>
      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom={false}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds markers={markers} />
        {markers.map((m, i) => (
          <Marker
            key={i}
            position={[m.lat, m.lng]}
            icon={makeIcon(m.emoji, m.color)}
          >
            <Popup>
              <div className="text-sm leading-snug">
                <p className="font-semibold text-stone-800">{m.label}</p>
                {m.sublabel && <p className="text-stone-500 text-xs mt-0.5">{m.sublabel}</p>}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
