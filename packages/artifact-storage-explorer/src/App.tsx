import { StorageExplorerApp } from "@alistigo/explorer-components-react";
import type { JSX } from "react";

interface AppProps {
  prefix: string;
}

export function App({ prefix }: AppProps): JSX.Element {
  return <StorageExplorerApp prefix={prefix} />;
}
