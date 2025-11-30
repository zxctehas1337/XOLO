import { invoke } from '@tauri-apps/api/core';

export interface CefBrowserInfo {
  id: string;
  url: string;
  title: string;
  is_loading: boolean;
  can_go_back: boolean;
  can_go_forward: boolean;
}

export class CefAPI {
  private static initialized = false;

  static async initialize(): Promise<void> {
    if (this.initialized) return;
    await invoke('cef_initialize');
    this.initialized = true;
  }

  static async createBrowser(id: string, url: string): Promise<void> {
    await this.initialize();
    await invoke('cef_create_browser', { id, url });
  }

  static async getBrowser(id: string): Promise<CefBrowserInfo | null> {
    return await invoke('cef_get_browser', { id });
  }

  static async getAllBrowsers(): Promise<CefBrowserInfo[]> {
    return await invoke('cef_get_all_browsers');
  }

  static async closeBrowser(id: string): Promise<void> {
    await invoke('cef_close_browser', { id });
  }

  static async navigate(id: string, url: string): Promise<void> {
    await invoke('cef_navigate', { id, url });
  }

  static async goBack(id: string): Promise<void> {
    await invoke('cef_go_back', { id });
  }

  static async goForward(id: string): Promise<void> {
    await invoke('cef_go_forward', { id });
  }

  static async reload(id: string): Promise<void> {
    await invoke('cef_reload', { id });
  }

  static async stop(id: string): Promise<void> {
    await invoke('cef_stop', { id });
  }

  static async executeJavaScript(id: string, code: string): Promise<void> {
    await invoke('cef_execute_javascript', { id, code });
  }

  static async setZoomLevel(id: string, level: number): Promise<void> {
    await invoke('cef_set_zoom_level', { id, level });
  }

  static async getZoomLevel(id: string): Promise<number> {
    return await invoke('cef_get_zoom_level', { id });
  }
}
