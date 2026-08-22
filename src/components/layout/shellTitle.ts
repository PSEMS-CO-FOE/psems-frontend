import { createContext, useContext, useEffect } from 'react';

export interface ShellTitleValue {
  title: string | null;
  setTitle: (title: string | null) => void;
}

export const ShellTitleContext = createContext<ShellTitleValue | null>(null);

export function useShellTitle(): string | null {
  return useContext(ShellTitleContext)?.title ?? null;
}

/** Lets the routed page name itself in the top bar. `PageHeader` calls this, so
 *  most pages get it without doing anything; pass null to opt out. */
export function useSetShellTitle(title: string | null) {
  const setTitle = useContext(ShellTitleContext)?.setTitle;

  useEffect(() => {
    if (!setTitle) return;
    setTitle(title);
    return () => setTitle(null);
  }, [setTitle, title]);
}
