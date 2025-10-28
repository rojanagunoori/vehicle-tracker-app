// src/components/Sidebar.jsx
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Navigation,
  Car,
  Bike,
  Footprints,
  LocateFixed,
  Share2,
} from "lucide-react";
import PlaybackControls from "./PlaybackControls";

export default function Sidebar({
  closeMenu,
  open,
  setMarkers,
  markers,
  routeGeo,
  setRouteGeo,
  routeMeta,
  setRouteMeta,
  setTravelMode,
  telemetry,travelMode,setTelemetry
}) {
  const [mode, setMode] = useState("search");
  const [searchInput, setSearchInput] = useState("");
  const [placeDetails, setPlaceDetails] = useState(null);
  const [points, setPoints] = useState([
    { label: "From", value: "" },
    { label: "To", value: "" },
  ]);
  const [profile, setProfile] = useState("car");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
const [activeField, setActiveField] = useState(null);


  // Simple geocoder
  const geocodeSingle = async (q) => {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      q
    )}&limit=1`;
    const r = await fetch(url, {
      headers: { "User-Agent": "VehicleTracker/1.0" },
    });
    const data = await r.json();
    if (!data?.length) return null;
    return {
      lat: parseFloat(data[0].lat),
      lon: parseFloat(data[0].lon),
      name: data[0].display_name,
    };
  };

  const handleSearch = async () => {
    if (!searchInput.trim()) return;
    setLoading(true);
    const result = await geocodeSingle(searchInput);
    if (!result) {
      alert("Location not found");
      setLoading(false);
      return;
    }
    setMarkers([{ lat: result.lat, lng: result.lon, name: result.name }]);
    setRouteGeo(null);
    setRouteMeta(null);
    setPlaceDetails(result);
    setLoading(false);
  };

  const addStop = () => {
    setPoints([
      ...points.slice(0, -1),
      { label: `Stop ${points.length - 1}`, value: "" },
      points[points.length - 1],
    ]);
  };

  const updatePoint = (i, val) => {
    const copy = [...points];
    copy[i].value = val;
    setPoints(copy);
  };

  const clearAll = () => {
    setSearchInput("");
    setPlaceDetails(null);
    setPoints([
      { label: "From", value: "" },
      { label: "To", value: "" },
    ]);
    setMarkers([]);
    setRouteGeo(null);
    setRouteMeta(null);
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: "Vehicle Tracker",
        text: "Check my current location on Vehicle Tracker!",
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  const handleMyLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setMarkers([{ lat: latitude, lng: longitude, name: "My Location" }]);
      },
     // () => alert("Unable to fetch location")
      (err) => {
      console.error("Geolocation error:", err);
      alert("Unable to fetch location: " + err.message);
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // inside Sidebar component

  const handleModeChange = (value) => {
  //setProfile(value);
  setTravelMode(value);
};

const getRoute = async () => {
  if (!points[0].value || !points[points.length - 1].value) {
    alert("Please enter From and To locations");
    return;
  }

  setLoading(true);
  setMarkers([]);
  setRouteGeo(null);
  setRouteMeta(null);

  try {
    // Geocode all points (from, stops, to)
    const geocoded = [];
    for (let p of points) {
      const g = await geocodeSingle(p.value);
      if (!g) {
        alert(`Could not find ${p.value}`);
        setLoading(false);
        return;
      }
      geocoded.push(g);
    }

    // Set markers
    setMarkers(geocoded.map((g) => ({ lat: g.lat, lng: g.lon, name: g.name })));

    // Fetch route from OSRM
    const coords = geocoded.map((g) => `${g.lon},${g.lat}`).join(";");
    const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=true`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data.routes?.length) {
      alert("No route found");
      setLoading(false);
      return;
    }

    const route = data.routes[0];
    const geom = route.geometry.coordinates.map(([lon, lat]) => [lat, lon]);


    

    setRouteGeo(geom);
    setRouteMeta({
      distance: route.distance,
      duration: route.duration,
      steps: route.legs.flatMap((l) =>
  l.steps.map((s) => {
    const { maneuver, name, distance } = s;
    let instruction = "";

    // 1️⃣ Generate readable instructions like OpenStreetMap
    if (maneuver.type === "depart") {
      instruction = `Drive ${maneuver.modifier ? maneuver.modifier : "straight"} on ${name || "the road"}`;
    } else if (maneuver.type === "turn") {
      instruction = `Turn ${maneuver.modifier || ""}${name ? ` onto ${name}` : ""}`;
    } else if (maneuver.type === "roundabout") {
      instruction = `Enter the roundabout and take the ${maneuver.exit || ""} exit${name ? ` onto ${name}` : ""}`;
    } else if (maneuver.type === "arrive") {
      instruction = "You have arrived at your destination";
    } else if (maneuver.type === "continue") {
      instruction = `Continue ${maneuver.modifier || ""}${name ? ` on ${name}` : ""}`;
    } else {
      // fallback to generic
      instruction = `${maneuver.type || "Proceed"}${name ? ` on ${name}` : ""}`;
    }

    return {
      instruction,
      distance,
      name,
    };
  })
),

    });
  } catch (err) {
    console.error(err);
    alert("Error fetching route");
  } finally {
    setLoading(false);
  }
};

const getDirectionIcon = (instruction = "") => {
  const text = instruction.toLowerCase();
  let iconId = "routing-sprite-continue-straight";

  if (text.includes("depart")) iconId = "routing-sprite-start";
  else if (text.includes("left")) iconId = "routing-sprite-turn-left";
  else if (text.includes("right")) iconId = "routing-sprite-turn-right";
  else if (text.includes("roundabout")) iconId = "routing-sprite-roundabout";
  else if (text.includes("arrive") || text.includes("destination"))
    iconId = "routing-sprite-destination";

  return (
    <svg width="22" height="22" className="text-blue-600 flex-shrink-0">
      <use href={`#${iconId}`} />
    </svg>
  );
};

useEffect(() => {
  if (routeGeo && routeGeo.length > 0 && routeMeta) {
    // update once after route fetched or mode changed
    setTelemetry({
      coords: routeGeo[0],
      speed: 0,
      distance: 0,
    });
  }
}, [routeGeo, routeMeta, travelMode]); // ✅ only update on new route or mode change


const fetchSuggestions = async (query) => {
  if (!query.trim()) {
    setSuggestions([]);
    return;
  }

  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    query
  )}&addressdetails=1&limit=5`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "VehicleTracker/1.0" },
    });
    const data = await res.json();

    setSuggestions(
      data.map((item) => ({
        display_name: item.display_name,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
      }))
    );
  } catch (err) {
    console.error("Error fetching suggestions:", err);
    setSuggestions([]);
  }
};


  // --- JSX ---
  return (
    <motion.div
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 80 }}
      className="flex flex-col h-full bg-gradient-to-b from-blue-50 to-white shadow-xl rounded-r-3xl p-5 overflow-y-auto"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-blue-700 tracking-tight">
          🚗 Vehicle Tracker
        </h1>
        
        {closeMenu && (
          <button
            onClick={closeMenu}
            className="text-gray-500 hover:text-gray-800 lg:hidden"
          >
            ✖
          </button>
        )}
      </div>

      {/* Mode Switch */}
      <div className="flex gap-2 mb-3">
        {[
          { key: "search", label: "Search", icon: Search },
          { key: "directions", label: "Directions", icon: Navigation },
        ].map(({ key, label, icon: Icon }) => (
          <motion.button
            key={key}
            whileTap={{ scale: 0.95 }}
            onClick={() => setMode(key)}
            className={`flex-1 flex items-center justify-center gap-1 border rounded-lg p-2 shadow-sm transition-all ${
              mode === key
                ? "bg-blue-600 text-white shadow-md"
                : "bg-gray-100 hover:bg-blue-100 text-gray-700"
            }`}
          >
            <Icon size={18} /> {label}
          </motion.button>
        ))}
      </div>

      {/* Search Mode */}
      {mode === "search" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <div className="relative w-full">
          <input
            className="w-full p-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400"
            placeholder="Enter place or lat,lng"
            value={searchInput}
           // onFocus={() => setActiveField(i)}

           // onChange={(e) => setSearchInput(e.target.value)}
           onChange={(e) => {
    setSearchInput(e.target.value);
    fetchSuggestions(e.target.value);
  }}
          />
          {suggestions.length > 0 && (
  <div className="absolute z-10 bg-white border border-gray-200 rounded-lg shadow-md w-full mt-1 max-h-48 overflow-y-auto">
    {suggestions.map((s, idx) => (
      <button
        key={idx}
        onClick={() => {
          setSearchInput(s.display_name);
          setSuggestions([]);
          setPlaceDetails({ name: s.display_name, lat: s.lat, lon: s.lon });
          setMarkers([{ lat: s.lat, lng: s.lon, name: s.display_name }]);
        }}
        className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm border-b last:border-b-0"
      >
        {s.display_name}
      </button>
    ))}
  </div>
)}</div>

          <button
            onClick={handleSearch}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg shadow transition-all"
          >
            {loading ? "Searching..." : "Search"}
          </button>

          {placeDetails && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm"
            >
              <p className="font-semibold text-blue-700">{placeDetails.name}</p>
              <p>Lat: {placeDetails.lat.toFixed(4)}</p>
              <p>Lng: {placeDetails.lon.toFixed(4)}</p>
            </motion.div>
          )}

          {/* Utility buttons */}
          <div className="flex gap-2 justify-between mt-3">
            <button
              onClick={handleMyLocation}
              className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg shadow"
            >
              <LocateFixed size={16} /> My Location
            </button>
            <button
              onClick={handleShare}
              className="flex-1 flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-600 text-white p-2 rounded-lg shadow"
            >
              <Share2 size={16} /> Share
            </button>
          </div>
        </motion.div>
      )}

      {/* Directions Mode */}
      {mode === "directions" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-3"
        >
         {points.map((p, i) => (
           <div key={i} className="relative mb-2 overflow-visible">
  <div key={i} className="flex items-center gap-2">
    <input
      className="flex-1 p-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-400"
      placeholder={p.label}
      value={p.value}
      onFocus={() => setActiveField(i)}

     // onChange={(e) => updatePoint(i, e.target.value)}
     onChange={(e) => {
          updatePoint(i, e.target.value);
          fetchSuggestions(e.target.value); // 👈 Fetch dropdown suggestions
        }}
    />
    {/* ❌ Cancel button only for stops (not From/To) */}
    {i > 0 && i < points.length - 1 && (
      <button
        onClick={() => {
          const updated = points.filter((_, idx) => idx !== i);
          setPoints(updated);
        }}
        className="p-2 text-red-500 hover:text-red-700"
        title="Remove stop"
      >
        ✖
      </button>
    )}
  </div>
  {/* 🔽 Suggestions dropdown */}
  {activeField === i && suggestions.length > 0 && p.value && (
      <div className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-ld w-full mt-1 max-h-48 overflow-y-auto">
        {suggestions.map((s, idx) => (
          <button
            key={idx}
            onClick={() => {
              const updated = [...points];
              updated[i] = {
                ...updated[i],
                value: s.display_name,
                lat: s.lat,
                lon: s.lon,
              };
              setPoints(updated);
              setSuggestions([]);
            }}
            className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm border-b last:border-b-0"
          >
            {s.display_name}
          </button>
        ))}
      </div>
    )}
  </div>
))}

          <div className="flex justify-between items-center text-sm">
            <button
              onClick={addStop}
              className="text-blue-500 hover:text-blue-700 font-medium"
            >
              + Add Stop
            </button>

            <select
               value={travelMode}
              onChange={(e) => handleModeChange(e.target.value)}
             // onChange={(e) => setTravelMode(e.target.value)}
              className="border rounded-lg p-1 shadow-sm"
            >
              <option value="car">🚗 Car</option>
              <option value="bike">🏍️ Bike</option>
              <option value="walk">🚶 Walk</option>
            </select>
          </div>

          <div className="flex gap-2 mt-2">
            <button
              onClick={getRoute}
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg shadow transition-all"
            >
              {loading ? "Routing..." : "Get Route"}
            </button>
            <button
              onClick={clearAll}
              className="flex-1 bg-gray-200 hover:bg-gray-300 p-2 rounded-lg shadow"
            >
              Clear
            </button>
          </div>
        </motion.div>
      )}

     

      <hr className="my-4 border-gray-300" />

      {/* Playback Controls */}
      <PlaybackControls />

      {/* Telemetry Box */}
      {telemetry && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 text-sm bg-gray-50 border border-gray-200 p-3 rounded-lg shadow-sm"
        >
          <p>
            <strong>Coords:</strong>{" "}
            {telemetry.coords[0].toFixed(5)}, {telemetry.coords[1].toFixed(5)}
          </p>
          <p>
            <strong>Speed:</strong> {(telemetry.speed * 3.6).toFixed(1)} km/h
          </p>
          <p>
            <strong>Distance:</strong> {(telemetry.distance / 1000).toFixed(2)} km
          </p>
        </motion.div>
      )}

 {routeMeta?.steps?.length > 0 && (
  <div className="mt-4 border-t pt-3">
    <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
      🧭 Directions
    </h3>
    <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
      {routeMeta.steps.map((step, i) => (
        <div
          key={i}
          className="flex items-start gap-3 bg-gray-50 rounded-lg p-2 shadow-sm"
        >
          {getDirectionIcon(step.instruction)}
          <div className="flex-1 text-sm">
            <p className="text-gray-800">
              {i + 1}. {step.instruction}
            </p>
            <p className="text-gray-500">
              {step.distance >= 1000
                ? `${(step.distance / 1000).toFixed(1)} km`
                : `${Math.round(step.distance)} m`}
            </p>
          </div>
        </div>
      ))}
    </div>
  </div>
)}


    </motion.div>
  );
}
