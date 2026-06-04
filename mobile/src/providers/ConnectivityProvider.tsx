import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';

type ConnectivityContextValue = {
  /** False when the device has no usable internet. */
  isOnline: boolean;
  /** True until the first NetInfo event arrives. */
  isChecking: boolean;
};

const ConnectivityContext = createContext<ConnectivityContextValue>({
  isOnline: true,
  isChecking: true,
});

function isDeviceOnline(state: NetInfoState): boolean {
  if (state.isConnected === false) return false;
  if (state.isInternetReachable === false) return false;
  return true;
}

export function ConnectivityProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const apply = (state: NetInfoState) => {
      setIsOnline(isDeviceOnline(state));
      setIsChecking(false);
    };

    const unsub = NetInfo.addEventListener(apply);
    void NetInfo.fetch().then(apply);

    return () => unsub();
  }, []);

  return (
    <ConnectivityContext.Provider value={{ isOnline, isChecking }}>
      {children}
    </ConnectivityContext.Provider>
  );
}

export function useConnectivity(): ConnectivityContextValue {
  return useContext(ConnectivityContext);
}
