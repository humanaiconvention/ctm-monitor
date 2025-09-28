export {};

declare global {
  interface Window {
    __APP_VERSION__?: {
      name: string;
      version: string;
      commit: string;
      fullCommit?: string;
      buildTime: string;
    };
  }
}
