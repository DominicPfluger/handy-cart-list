/** A stalled network/storage operation must not block access to device-local data. */
export function withTimeout<T>(operation: Promise<T>, milliseconds: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Read timed out")), milliseconds);
    operation.then(
      (value) => { clearTimeout(timer); resolve(value); },
      (error: unknown) => { clearTimeout(timer); reject(error); },
    );
  });
}

/** Fallbacks are never written back as a successful network result. */
export async function resilientRead<T>(options: {
  read: () => Promise<T>;
  timeout: number;
  fallback: () => T;
  onSuccess: (value: T) => void;
  onFailure: () => void;
}): Promise<T> {
  try {
    const value = await withTimeout(options.read(), options.timeout);
    options.onSuccess(value);
    return value;
  } catch {
    options.onFailure();
    return options.fallback();
  }
}