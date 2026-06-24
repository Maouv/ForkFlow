import axios from "axios";

/// <reference types="vite/client" />

const STORAGE_KEY = "forkflow_auth";

/** Get stored Basic Auth header or null. */
export function getAuthHeader(): string | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) return `Basic ${raw}`;
  return null;
}

/** Store credentials (base64) and update axios default header. */
export function setAuth(user: string, pass: string): void {
  const encoded = btoa(`${user}:${pass}`);
  localStorage.setItem(STORAGE_KEY, encoded);
  client.defaults.headers.Authorization = `Basic ${encoded}`;
}

/** Clear stored credentials. */
export function clearAuth(): void {
  localStorage.removeItem(STORAGE_KEY);
  delete client.defaults.headers.Authorization;
}

/** Check if user is authenticated. */
export function isAuthenticated(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null;
}

// Init header from storage on module load
const _stored = localStorage.getItem(STORAGE_KEY);
const _envUser = import.meta.env.VITE_AUTH_USER ?? "admin";
const _envPass = import.meta.env.VITE_AUTH_PASS ?? "changeme";
const _header = _stored
  ? `Basic ${_stored}`
  : `Basic ${btoa(`${_envUser}:${_envPass}`)}`;

const client = axios.create({
  baseURL: "/api",
  headers: { Authorization: _header },
});

export default client;
