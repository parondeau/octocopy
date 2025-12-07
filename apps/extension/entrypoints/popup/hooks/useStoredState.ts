import { useEffect, useState } from 'react';

type StorageArea = {
  getValue: <T>(key: string) => Promise<T | undefined>;
  setValue: <T>(key: string, value: T) => Promise<void>;
};

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
      async setValue<T>(key: string, value: T) {
        await browserArea.set({ [key]: value });
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
      setValue<T>(key: string, value: T) {
        return new Promise<void>((resolve, reject) => {
          chromeArea.set({ [key]: value }, () => {
            const error = globalObj.chrome?.runtime?.lastError;
            if (error) {
              reject(error);
            } else {
              resolve();
            }
          });
        });
      },
    };
  }

  return null;
}

const storageArea = createStorageArea();

export function useStoredState<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(defaultValue);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    async function hydrate() {
      if (!storageArea) {
        setIsLoaded(true);
        return;
      }
      try {
        const storedValue = await storageArea.getValue<T>(key);
        if (!active) return;
        if (typeof storedValue !== 'undefined') {
          setValue(storedValue);
        } else {
          setValue(defaultValue);
        }
      } catch {
        if (!active) return;
      } finally {
        if (active) setIsLoaded(true);
      }
    }
    hydrate();
    return () => {
      active = false;
    };
  }, [key, defaultValue]);

  useEffect(() => {
    if (!isLoaded || !storageArea) return;
    storageArea.setValue(key, value).catch(() => {
      // Ignore storage write errors (quota, permissions, etc.)
    });
  }, [key, value, isLoaded]);

  return [value, setValue, isLoaded] as const;
}
