import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { generateMockClaim } from '../utils/mockData';

const ClaimsContext = createContext(null);

export const ClaimsProvider = ({ children }) => {
  const [recentClaims, setRecentClaims] = useState([]);
  const [liveCount, setLiveCount] = useState(0);
  const socketRef = useRef(null);

  useEffect(() => {
    // Initialize with mock data
    setRecentClaims(Array.from({ length: 8 }, (_, i) => generateMockClaim(i)));

    // Connect to backend socket
    try {
      socketRef.current = io({ path: '/socket.io/', transports: ['websocket', 'polling'] });

      socketRef.current.on('newClaim', (claim) => {
        setRecentClaims(prev => [claim, ...prev].slice(0, 20));
        setLiveCount(c => c + 1);
      });
    } catch {
      // No socket — use polling fallback with local mock
      const interval = setInterval(() => {
        const mock = generateMockClaim();
        setRecentClaims(prev => [mock, ...prev].slice(0, 20));
        setLiveCount(c => c + 1);
      }, 8000);
      return () => clearInterval(interval);
    }

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  const addClaim = (claim) => {
    setRecentClaims(prev => [claim, ...prev].slice(0, 20));
  };

  return (
    <ClaimsContext.Provider value={{ recentClaims, liveCount, addClaim }}>
      {children}
    </ClaimsContext.Provider>
  );
};

export const useClaims = () => useContext(ClaimsContext);
export default ClaimsContext;
