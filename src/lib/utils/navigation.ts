import { goto } from "$app/navigation";
import { resolve } from "$app/paths";
import type { RouteId } from "$app/types";

export function navigate(href: RouteId, opts?: Parameters<typeof goto>[1]) {
  return goto(resolve(href), opts);
}
