import React, { useEffect, useRef, useState, useContext, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  LayersControl,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { PlaybackContext } from "../playback/PlaybackProvider";

const { BaseLayer } = LayersControl;

const stopIcon = (n) =>
  L.divIcon({
    html: `<div style="background:#2563eb;color:white;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px">${n}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });

function FitBounds({ markers, routeGeo }) {
  const map = useMap();
  useEffect(() => {
    const points = [];
    if (routeGeo?.length) routeGeo.forEach((c) => points.push([c[0], c[1]]));
    else if (markers?.length) markers.forEach((m) => points.push([m.lat, m.lng]));
    if (!points.length) return;
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds.pad(0.2));
  }, [markers, routeGeo, map]);
  return null;
}

function LocationTools() {
  const map = useMap();
  const [userPos, setUserPos] = useState(null);

  const handleMyLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserPos([latitude, longitude]);
        map.flyTo([latitude, longitude], 15);
        L.popup()
          .setLatLng([latitude, longitude])
          .setContent(`<b>You are here 📍</b>`)
          .openOn(map);
      },
      (err) => alert("Unable to fetch location: " + err.message)
    );
  };

  const handleShareLocation = () => {
    const center = map.getCenter();
    const shareUrl = `${window.location.origin}?lat=${center.lat}&lng=${center.lng}`;
    navigator.clipboard?.writeText(shareUrl);
    alert(`Copied share link:\n${shareUrl}`);
  };

  return (
    <>
      {userPos && (
        <Marker
          position={userPos}
          icon={L.divIcon({
            html: `<div style="background:#1d4ed8;border:2px solid white;width:16px;height:16px;border-radius:50%"></div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8],
          })}
        />
      )}
      <div
        className="leaflet-top leaflet-right"
        style={{ zIndex: 1000, marginTop: "250px", marginRight: "10px", pointerEvents: "auto" }}
      >
        <div className="bg-white rounded-lg shadow-md p-2 flex flex-col gap-2">
          <button onClick={handleMyLocation} className="px-2 py-1 text-xs bg-blue-600 text-white rounded-md">📍 My Location</button>
          <button onClick={handleShareLocation} className="px-2 py-1 text-xs bg-gray-700 text-white rounded-md">🔗 Share</button>
        </div>
      </div>
    </>
  );
}

export default function MapView({
  markers = [],
  routeGeo = null,
  routeMeta = null,
  travelMode = "car",
  onPlaybackUpdate,
}) {
  const { isPlaying, speed: globalSpeed, resetSignal } = useContext(PlaybackContext);
  const [vehiclePos, setVehiclePos] = useState(routeGeo?.[0] ?? null);
  const animRef = useRef({ raf: null, coords: [], total: 0 });

  // vehicle icon memoized by travelMode
  const vehicleIcon = useMemo(
    () =>
      L.divIcon({
        html: travelMode === "bike" ? "🏍️" : travelMode === "car" ? "🚗" : "🚶‍♂️",
        className: "text-2xl",
        iconSize: [48, 48],
        iconAnchor: [14, 14],
      }),
    [travelMode]
  );

  // compute distances and duration when route or speed changes
  useEffect(() => {
    if (!routeGeo?.length) {
      setVehiclePos(null);
      animRef.current.coords = [];
      animRef.current.total = 0;
      return;
    }

    animRef.current.coords = routeGeo;

    // realistic avg speeds (m/s)
    const baseSpeeds = { car: 25, bike: 8, walk: 1.5 };
    const avgSpeed = baseSpeeds[travelMode] ?? baseSpeeds.car;

    const distanceMeters = routeMeta?.distance ?? (() => {
      // fallback compute from coordinates
      let cum = 0;
      for (let i = 1; i < routeGeo.length; i++) {
        const a = routeGeo[i - 1], b = routeGeo[i];
        const R = 6371000;
        const toRad = (v) => (v * Math.PI) / 180;
        const dLat = toRad(b[0] - a[0]), dLon = toRad(b[1] - a[1]);
        const lat1 = toRad(a[0]), lat2 = toRad(b[0]);
        const A = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(A), Math.sqrt(1 - A));
        cum += R * c;
      }
      return cum;
    })();

    // protect against 0 or very small speeds
    const safeGlobalSpeed = Math.max(globalSpeed ?? 1, 0.1);

    // SIMULATION_SCALE reduces real-world duration so animation is visible
    const SIMULATION_SCALE = 25;
    const durationMs = (distanceMeters / avgSpeed) * 100 / (safeGlobalSpeed * SIMULATION_SCALE);

    animRef.current.total = Math.max(100, durationMs); // at least 100ms
    // reset marker to start when new route set
    setVehiclePos(routeGeo[0]);
  }, [routeGeo, routeMeta, travelMode, globalSpeed]);

  // animation loop, store RAF id in animRef.current.raf
  useEffect(() => {
    if (!animRef.current.coords?.length) return;

    const coords = animRef.current.coords;
    const total = animRef.current.total;
    let startTime = null;

    // precompute cumulative distances
    const dists = [0];
    let cum = 0;
    for (let i = 1; i < coords.length; i++) {
      const a = coords[i - 1], b = coords[i];
      const R = 6371000;
      const toRad = (v) => (v * Math.PI) / 180;
      const dLat = toRad(b[0] - a[0]), dLon = toRad(b[1] - a[1]);
      const lat1 = toRad(a[0]), lat2 = toRad(b[0]);
      const A = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(A), Math.sqrt(1 - A));
      const d = R * c;
      cum += d;
      dists.push(cum);
    }
    const totalLen = dists[dists.length - 1] || 0;

    const sampleAt = (t) => {
      const target = t * totalLen;
      for (let i = 1; i < dists.length; i++) {
        if (target <= dists[i]) {
          const a = coords[i - 1], b = coords[i];
          const segT = (target - dists[i - 1]) / (dists[i] - dists[i - 1] || 1);
          return [a[0] + (b[0] - a[0]) * segT, a[1] + (b[1] - a[1]) * segT];
        }
      }
      return coords[coords.length - 1];
    };

    function step(ts) {
      if (!startTime) startTime = ts;
      const elapsed = ts - startTime;
      const progress = Math.min(1, elapsed / total);
      const pos = sampleAt(progress);
      setVehiclePos(pos);

      if (onPlaybackUpdate && progress > 0) {
        onPlaybackUpdate({
          coords: pos,
          elapsed: elapsed / 1000,
          distance: totalLen * progress,
          speed: totalLen / (total / 1000 || 1),
        });
      }

      if (progress < 1 && isPlaying) {
        animRef.current.raf = requestAnimationFrame(step);
      } else {
        animRef.current.raf = null;
      }
    }

    // start only when playing
    if (isPlaying) {
      // cancel previous if any
      if (animRef.current.raf) cancelAnimationFrame(animRef.current.raf);
      animRef.current.raf = requestAnimationFrame(step);
    }

    return () => {
      if (animRef.current.raf) {
        cancelAnimationFrame(animRef.current.raf);
        animRef.current.raf = null;
      }
    };
  }, [isPlaying, animRef.current?.coords, animRef.current?.total, routeGeo, routeMeta, globalSpeed, onPlaybackUpdate]);

  // Listen for resetSignal from PlaybackProvider
  useEffect(() => {
    // cancel RAF and move marker back to start instantly
    if (animRef.current.raf) {
      cancelAnimationFrame(animRef.current.raf);
      animRef.current.raf = null;
    }
    if (routeGeo && routeGeo.length > 0) {
      setVehiclePos(routeGeo[0]);
      if (onPlaybackUpdate && progress > 0) {
        onPlaybackUpdate({
          coords: routeGeo[0],
          elapsed: 0,
          distance: 0,
          speed: 0,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetSignal]); // runs when resetSignal changes


  
  return (
    <MapContainer style={{ height: "100vh", width: "100%" }} center={[17.385044, 78.486671]} zoom={13} className="h-full w-full">
      <LayersControl position="topright">
        <BaseLayer checked name="OpenStreetMap">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
        </BaseLayer>
        <BaseLayer name="Satellite">
          <TileLayer url="https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}" subdomains={["mt0", "mt1", "mt2", "mt3"]} />
        </BaseLayer>
        <BaseLayer name="Terrain">
          <TileLayer url="https://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}" subdomains={["mt0", "mt1", "mt2", "mt3"]} />
        </BaseLayer>
        <BaseLayer name="Dark Mode">
         <TileLayer
    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    attribution="© OpenStreetMap contributors © CartoDB"
  /></BaseLayer>
      </LayersControl>

      <LocationTools />

      {markers.map((m, i) => (
        <Marker key={i} position={[m.lat, m.lng]} icon={stopIcon(i + 1)} />
      ))}
      {routeGeo && <Polyline positions={routeGeo} pathOptions={{ color: "blue", weight: 4 }} />}
      {vehiclePos && <Marker key={`vehicle-${travelMode}`} position={vehiclePos} icon={vehicleIcon} />}
      <FitBounds markers={markers} routeGeo={routeGeo} />
    </MapContainer>
  );
}
