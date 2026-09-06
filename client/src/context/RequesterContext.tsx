import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export interface SelectedRequester {
  id: number;
  name: string;
}

interface RequesterContextValue {
  requester: SelectedRequester | null;
  // False until the initial sessionStorage read completes, so RouteGuard
  // never redirects on a false "not selected yet" flash before we've checked.
  isLoaded: boolean;
  selectRequester: (requester: SelectedRequester) => void;
  clearRequester: () => void;
}

const STORAGE_KEY = "toktickit.selectedRequester";

const RequesterContext = createContext<RequesterContextValue | undefined>(undefined);

export function RequesterProvider({ children }: { children: ReactNode }) {
  const [requester, setRequester] = useState<SelectedRequester | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setRequester(JSON.parse(stored));
      } catch {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoaded(true);
  }, []);

  function selectRequester(next: SelectedRequester) {
    setRequester(next);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  function clearRequester() {
    setRequester(null);
    sessionStorage.removeItem(STORAGE_KEY);
  }

  return (
    <RequesterContext.Provider value={{ requester, isLoaded, selectRequester, clearRequester }}>
      {children}
    </RequesterContext.Provider>
  );
}

export function useRequester(): RequesterContextValue {
  const ctx = useContext(RequesterContext);
  if (!ctx) throw new Error("useRequester must be used within a RequesterProvider");
  return ctx;
}