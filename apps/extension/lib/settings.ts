import type { Mode, PlatformSettings } from "../entrypoints/popup/types";

export type ExtensionSettings = {
  mode: Mode;
  platforms: PlatformSettings;
  token: string;
  includeBranchName: boolean;
};

const DEFAULT_MODE: Mode = "ui";
const DEFAULT_PLATFORMS: PlatformSettings = {
  github: true,
  graphite: false,
};
const DEFAULT_INCLUDE_BRANCH = false;

const STORAGE_KEYS = {
  mode: "octocopy-mode",
  platforms: "octocopy-platforms",
  token: "octocopy-token",
  includeBranchName: "octocopy-include-branch",
};

type StorageArea = {
  getValue: <T>(key: string) => Promise<T | undefined>;
};

export async function loadExtensionSettings(): Promise<ExtensionSettings> {
  const area = storageArea;
  if (!area) {
    return {
      mode: DEFAULT_MODE,
      platforms: DEFAULT_PLATFORMS,
      token: "",
      includeBranchName: DEFAULT_INCLUDE_BRANCH,
    };
  }

  const [mode, platforms, token, includeBranchName] = await Promise.all([
    readValue<Mode>(area, STORAGE_KEYS.mode),
    readValue<PlatformSettings>(area, STORAGE_KEYS.platforms),
    readValue<string>(area, STORAGE_KEYS.token),
    readValue<boolean>(area, STORAGE_KEYS.includeBranchName),
  ]);

  return {
    mode: isValidMode(mode) ? mode : DEFAULT_MODE,
    platforms: isValidPlatforms(platforms) ? platforms : DEFAULT_PLATFORMS,
    token: typeof token === "string" ? token : "",
    includeBranchName:
      typeof includeBranchName === "boolean"
        ? includeBranchName
        : DEFAULT_INCLUDE_BRANCH,
  };
}

async function readValue<T>(
  area: StorageArea,
  key: string
): Promise<T | undefined> {
  try {
    return await area.getValue<T>(key);
  } catch {
    return undefined;
  }
}

function createStorageArea(): StorageArea | null {
  const globalObj = globalThis as typeof globalThis & {
    chrome?: any;
    browser?: any;
  };

  const browserArea = globalObj.browser?.storage?.local;
  if (browserArea) {
    return {
      async getValue<T>(key: string) {
        const result = await browserArea.get(key);
        return result?.[key] as T | undefined;
      },
    };
  }

  const chromeArea = globalObj.chrome?.storage?.local;
  if (chromeArea) {
    return {
      getValue<T>(key: string) {
        return new Promise<T | undefined>((resolve, reject) => {
          chromeArea.get(key, (items: Record<string, unknown>) => {
            const error = globalObj.chrome?.runtime?.lastError;
            if (error) {
              reject(error);
            } else {
              resolve(items?.[key] as T | undefined);
            }
          });
        });
      },
    };
  }

  return null;
}

function isValidMode(value: unknown): value is Mode {
  return value === "app" || value === "token" || value === "ui";
}

function isValidPlatforms(value: unknown): value is PlatformSettings {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as PlatformSettings;
  return (
    typeof candidate.github === "boolean" &&
    typeof candidate.graphite === "boolean"
  );
}

const storageArea = createStorageArea();
