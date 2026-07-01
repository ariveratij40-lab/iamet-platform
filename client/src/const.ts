export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Local auth: always redirect to /admin/login (no Manus OAuth dependency)
export const getLoginUrl = (_returnPath?: string) => {
  const returnTo = _returnPath ?? window.location.pathname;
  return `/admin/login?returnTo=${encodeURIComponent(returnTo)}`;
};
