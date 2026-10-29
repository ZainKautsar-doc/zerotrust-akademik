import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('zt_token') || null);
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('zt_refresh') || null);
  
  // Zero Trust Context States
  const [activeDeviceId, setActiveDeviceId] = useState(localStorage.getItem('zt_device') || 'DEV-ADMIN-01');
  const [simulatedHour, setSimulatedHour] = useState('10'); // Default jam kerja 10:00 AM

  useEffect(() => {
    const savedUser = localStorage.getItem('zt_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {}
    }
  }, []);

  const loginUser = (userData, accessToken, refreshTkn, deviceId) => {
    setUser(userData);
    setToken(accessToken);
    setRefreshToken(refreshTkn);
    setActiveDeviceId(deviceId);

    localStorage.setItem('zt_user', JSON.stringify(userData));
    localStorage.setItem('zt_token', accessToken);
    localStorage.setItem('zt_refresh', refreshTkn);
    localStorage.setItem('zt_device', deviceId);
  };

  const logoutUser = async () => {
    if (refreshToken) {
      try {
        await fetch('http://127.0.0.1:3000/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken })
        });
      } catch (err) {}
    }
    setUser(null);
    setToken(null);
    setRefreshToken(null);
    localStorage.removeItem('zt_user');
    localStorage.removeItem('zt_token');
    localStorage.removeItem('zt_refresh');
  };

  const setDevice = (devId) => {
    setActiveDeviceId(devId);
    localStorage.setItem('zt_device', devId);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      refreshToken,
      activeDeviceId,
      setDevice,
      simulatedHour,
      setSimulatedHour,
      loginUser,
      logoutUser,
      authContextHeaders: {
        token,
        deviceId: activeDeviceId,
        simulatedHour
      }
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
