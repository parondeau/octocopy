export type Mode = 'app' | 'token' | 'ui';

export type OnboardingStep = {
  id: string;
  label: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
};

export type PlatformSettings = {
  github: boolean;
  graphite: boolean;
};
