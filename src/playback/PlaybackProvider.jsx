import React, { useState, useCallback, useRef } from "react";

export const PlaybackContext = React.createContext();

export function PlaybackProvider({ children }) {
  const [isPlaying, setIsPlaying] = useState(false);
 const [speed, setSpeed] = useState(1); 
const [resetSignal, setResetSignal] = useState(0);
 
  const togglePlay = useCallback(() => setIsPlaying((p) => !p), []);
  //const reset = useCallback(() => setIsPlaying(false), []);
   const reset = useCallback(() => {
    setIsPlaying(false);
    // increment signal so consumers can react
    setResetSignal((s) => s + 1);
  }, []);

  return (
    <PlaybackContext.Provider value={{ isPlaying, togglePlay, reset , speed, setSpeed,resetSignal,}}>
      {children}
    </PlaybackContext.Provider>
  );
}
