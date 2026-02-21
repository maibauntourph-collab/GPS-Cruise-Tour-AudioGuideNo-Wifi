export let env: any = typeof process !== "undefined" ? process.env : {};

export function setEnv(newEnv: any) {
    env = newEnv;
}

export function getEnv(key: string): string | undefined {
    return env[key];
}
