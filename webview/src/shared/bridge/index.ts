import type { Bridge } from "./types";
import { createVSCodeBridge } from "./vscode-bridge";

export const bridge: Bridge = createVSCodeBridge();

/**
 * Execute a bridge request with progress indicator.
 * Sets operationInProgress=true immediately, resets on completion.
 */
export async function bridgeWithProgress(
  command: string,
  params?: Record<string, unknown>,
): Promise<unknown> {
  const { usePanelStore } = await import("../store/panel-store");
  usePanelStore.setState({ operationInProgress: true });
  try {
    return await bridge.request(command, params);
  } finally {
    usePanelStore.setState({ operationInProgress: false });
  }
}

export type {
  Bridge,
  EventMessage,
  RequestMessage,
  ResponseMessage,
} from "./types";
