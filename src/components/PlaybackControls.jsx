import React, { useContext, useState } from "react";
import { Play, Pause, RotateCcw, FastForward, X, Square } from "lucide-react";
import { PlaybackContext } from "../playback/PlaybackProvider";

export default function PlaybackControls({ onSpeedChange }) {
  const { isPlaying, togglePlay, reset,speed, setSpeed } = useContext(PlaybackContext);
  const [showSpeed, setShowSpeed] = useState(true);



  const handleSpeedChange = (e) => {
    const newSpeed = parseFloat(e.target.value);
    setSpeed(newSpeed);
    if (onSpeedChange) onSpeedChange(newSpeed);
  };

    // 🔹 Stop playback (pause + reset position logic handled in parent if needed)
  const handleStop = () => {
    togglePlay(false);
    reset();
  };

   // 🔹 Cancel just hides or clears speed input
  const handleCancel = () => {
    setShowSpeed(false);
    setTimeout(() => setShowSpeed(true), 100); // small UX reset if needed
  };


  return (
    <div className="flex flex-col items-center gap-2 mt-4">
      {/* Playback Buttons */}
      <div className="flex justify-center gap-4 items-center">
        <button
          onClick={togglePlay}
          className="p-2 bg-blue-600 text-white rounded-full shadow-md"
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
        </button>
         {/* Stop */}
      

        {/* Reset */}
        <button
          onClick={reset}
          className="p-2 bg-gray-300 text-gray-700 rounded-full shadow-md"
        >
          <RotateCcw size={18} />
        </button>
      </div>

      {/* Speed Control */}
      <div className="flex items-center gap-2 text-sm mt-2">
        <FastForward size={16} className="text-gray-500" />
        <span>Speed: {speed.toFixed(1)}x</span>
          <button
            onClick={handleCancel}
            className="p-1 bg-gray-200 hover:bg-gray-300 rounded-full text-gray-600"
            title="Cancel speed input"
          >
            <X size={14} />
          </button>
      </div>
      <input
        type="range"
        min="0.5"
        max="5"
        step="0.5"
        value={speed}
        onChange={handleSpeedChange}
        className="w-40 accent-blue-600"
      />
    </div>
  );
}
