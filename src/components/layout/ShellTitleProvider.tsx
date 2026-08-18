import { useMemo, useState, type ReactNode } from 'react';
import { ShellTitleContext } from './shellTitle';

export function ShellTitleProvider({ children }: { children: ReactNode }) {
  const [title, setTitle] = useState<string | null>(null);
  const value = useMemo(() => ({ title, setTitle }), [title]);
  return <ShellTitleContext.Provider value={value}>{children}</ShellTitleContext.Provider>;
}
