import { useCallback, useState } from "react";

export function useLogs<T>() {
  const [logs, setLogs] = useState<T[]>([]);
  const clearLogs = useCallback(() => setLogs([]), []);
  return { logs, setLogs, clearLogs };
}
