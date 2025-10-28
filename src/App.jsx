


// src/App.jsx
import React, { useState } from "react";
import MapView from "./components/MapView";
import Sidebar from "./components/Sidebar";
import { Menu } from "lucide-react";
import RoutingSprite from "./components/RoutingSprite";

export default function App() {
  const [markers, setMarkers] = useState([]);
  const [routeGeo, setRouteGeo] = useState(null);
  const [routeMeta, setRouteMeta] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [travelMode, setTravelMode] = useState("car"); // car | bike | walk
  const [telemetry, setTelemetry] = useState(null);



  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-100">
     
     
      {/* Sidebar (Desktop) */}
        <RoutingSprite />
      <div className="hidden lg:block w-[380px] bg-white shadow-lg z-20">
        <Sidebar
          open={sidebarOpen}
          onToggle={() => setSidebarOpen((s) => !s)}
          setMarkers={setMarkers}
          markers={markers}
          routeGeo={routeGeo}
          setRouteGeo={setRouteGeo}
          routeMeta={routeMeta}
          setRouteMeta={setRouteMeta}
          setTravelMode={setTravelMode}
           telemetry={telemetry}
           travelMode={travelMode}
           setTelemetry={setTelemetry}
        />
      </div>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute top-4 left-4 z-30 lg:hidden p-2 bg-white rounded-full shadow-md"
      >
        <Menu size={24} />
      </button>

      {/* Mobile Sidebar */}
        <RoutingSprite />
      <div
        className={`fixed top-0 left-0 h-full w-3/4 max-w-xs bg-white shadow-2xl transform z-20 transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:hidden`}
      >
        <Sidebar
          open={sidebarOpen}
          onToggle={() => setSidebarOpen((s) => !s)}
          setMarkers={setMarkers}
          markers={markers}
          routeGeo={routeGeo}
          setRouteGeo={setRouteGeo}
          routeMeta={routeMeta}
          setRouteMeta={setRouteMeta}
          closeMenu={() => setSidebarOpen(false)}
          setTravelMode={setTravelMode}
           telemetry={telemetry}
           travelMode={travelMode}
           setTelemetry={setTelemetry}
        />
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black bg-opacity-40 z-10 lg:hidden"
        ></div>
      )}

      {/* Map Area */}
      <div className="flex-1 z-0">
        <MapView markers={markers} routeGeo={routeGeo} routeMeta={routeMeta} travelMode={travelMode}  onPlaybackUpdate={setTelemetry}/>
      </div>
    </div>
  );
}
