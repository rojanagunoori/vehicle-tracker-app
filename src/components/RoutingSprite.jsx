// src/components/RoutingSprite.jsx
import React from "react";

export default function RoutingSprite() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "none" }}
      aria-hidden="true"
    >
      {/* Start icon */}
      <symbol id="routing-sprite-start" viewBox="0 0 24 24">
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          d="M12 2v20M12 2l4 4m-4-4L8 6"
        />
      </symbol>

      {/* Turn left */}
      <symbol id="routing-sprite-turn-left" viewBox="0 0 24 24">
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          d="M14 4v4c0 2-2 4-4 4H4m0 0l4 4M4 12l4-4"
        />
      </symbol>

      {/* Turn right */}
      <symbol id="routing-sprite-turn-right" viewBox="0 0 24 24">
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          d="M10 4v4c0 2 2 4 4 4h6m0 0l-4 4m4-4l-4-4"
        />
      </symbol>

      {/* Continue straight */}
      <symbol id="routing-sprite-continue-straight" viewBox="0 0 24 24">
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          d="M12 22V2m0 0l4 4m-4-4L8 6"
        />
      </symbol>

      {/* Roundabout */}
      <symbol id="routing-sprite-roundabout" viewBox="0 0 24 24">
        <circle
          cx="12"
          cy="12"
          r="7"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />
        <path
          d="M12 5v4M19 12h-4M12 19v-4M5 12h4"
          stroke="currentColor"
          strokeWidth="2"
        />
      </symbol>

      {/* Destination */}
      <symbol id="routing-sprite-destination" viewBox="0 0 24 24">
        <path
          fill="currentColor"
          d="M12 2a6 6 0 016 6c0 6-6 12-6 12S6 14 6 8a6 6 0 016-6zm0 8a2 2 0 100-4 2 2 0 000 4z"
        />
      </symbol>
    </svg>
  );
}
