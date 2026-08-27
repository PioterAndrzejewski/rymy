const KEY = 'rymy.settings.v1';

export type Settings = {
  masterVolume: number;
  clickVolume: number;
  clickEnabled: boolean;
  tempoMode: 'pitch-preserving' | 'raw';
  language: 'pl';
};

export const defaultSettings: Settings = {
  masterVolume: 1,
  clickVolume: 0.5,
  clickEnabled: false,
  tempoMode: 'pitch-preserving',
  language: 'pl',
};

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultSettings;
    return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(s: Settings): void {
  localStorage.setItem(KEY, JSON.stringify(s));
}
