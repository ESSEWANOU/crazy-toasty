import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface StoreLocation {
  city: string;
  addr: string;
  lat: number;
  lng: number;
}

const flameIcon = L.divIcon({
  className: "tc-marker",
  html: `<div style="
    width:36px;height:36px;border-radius:50% 50% 50% 0;
    background:linear-gradient(135deg,#ff5a3c,#ffa838);
    transform:rotate(-45deg);
    box-shadow:0 6px 20px rgba(255,90,60,0.5);
    display:grid;place-items:center;
    border:2px solid #1a1208;">
    <span style="transform:rotate(45deg);font-size:18px;">🔥</span>
  </div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -32],
});

interface Props {
  stores: StoreLocation[];
  activeIndex: number;
  onSelect: (i: number) => void;
}

export function StoresMap({ stores, activeIndex, onSelect }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="absolute inset-0 bg-background/40" />;

  const center: [number, number] = [stores[activeIndex].lat, stores[activeIndex].lng];

  return (
    <MapContainer
      center={center}
      zoom={13}
      key={activeIndex}
      scrollWheelZoom={false}
      className="absolute inset-0 w-full h-full"
      style={{ background: "#1a1208" }}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap"
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      {stores.map((s, i) => (
        <Marker
          key={s.city}
          position={[s.lat, s.lng]}
          icon={flameIcon}
          eventHandlers={{ click: () => onSelect(i) }}
        >
          <Popup>
            <div style={{ minWidth: 180 }}>
              <div style={{ fontWeight: 800, marginBottom: 4 }}>{s.city}</div>
              <div style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>{s.addr}</div>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(s.addr + ", Toulouse")}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-block",
                  background: "#ff5a3c",
                  color: "#fff",
                  padding: "6px 12px",
                  borderRadius: 999,
                  fontWeight: 700,
                  fontSize: 12,
                  textDecoration: "none",
                }}
              >
                🧭 Itinéraire
              </a>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
