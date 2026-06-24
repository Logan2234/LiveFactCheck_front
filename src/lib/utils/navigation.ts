import { goto } from "$app/navigation";
import { resolve } from "$app/paths";
import type { RouteId } from "$app/types";

// Route ids that take no params (no "[...]" segment), so they can be resolved
// with a single argument. Excludes dynamic routes like /admin/sessions/[id].
export type StaticRouteId = Exclude<RouteId, `${string}[${string}`>;

export function navigate(
  href: StaticRouteId,
  opts?: Parameters<typeof goto>[1]
) {
  return goto(resolve(href), opts);
}
