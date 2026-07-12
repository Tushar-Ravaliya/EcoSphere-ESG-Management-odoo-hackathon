import { create } from 'zustand';

interface ESGConfig {
  evidenceRequirement: boolean;
  badgeAutoAward: boolean;
  autoEmissionCalculation: boolean;
}

interface SettingsState {
  config: ESGConfig;
  setToggle: (key: keyof ESGConfig, value: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set) => {
  const savedConfig = localStorage.getItem('ecosphere_settings');
  const defaultConfig: ESGConfig = {
    evidenceRequirement: true,
    badgeAutoAward: true,
    autoEmissionCalculation: true,
  };

  return {
    config: savedConfig ? JSON.parse(savedConfig) : defaultConfig,
    setToggle: (key, value) => {
      set((state) => {
        const newConfig = { ...state.config, [key]: value };
        localStorage.setItem('ecosphere_settings', JSON.stringify(newConfig));
        return { config: newConfig };
      });
    },
  };
});
