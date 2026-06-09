<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";

  type Variant = "primary" | "secondary" | "danger";
  type Size = "xs" | "sm" | "md";

  let {
    variant = "primary",
    size = "md",
    title,
    type = "button",
    disabled = false,
    children,
    onclick,
    class: extraClass = "",
    ...rest
  }: {
    variant?: Variant;
    size?: Size;
    title?: string;
    type?: HTMLButtonAttributes["type"];
    disabled?: boolean;
    children: Snippet;
    onclick?: HTMLButtonAttributes["onclick"];
    class?: string;
  } = $props();

  const base =
    "cursor-pointer rounded-lg font-semibold transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-40";

  const variantClass: Record<Variant, string> = {
    primary: "bg-[linear-gradient(135deg,#5a5ad0,#7a4ad0)] text-white enabled:hover:opacity-90",
    secondary:
      "border border-edge bg-surface text-slate-300 enabled:hover:bg-surface-raised enabled:hover:text-fg",
    danger:
      "border border-red-900/40 bg-transparent text-red-300 enabled:hover:border-red-900 enabled:hover:bg-red-500/12"
  };

  const sizeClass: Record<Size, string> = {
    xs: "px-2 py-1.5 text-xs",
    sm: "px-3.5 py-2 text-sm",
    md: "px-4 py-2.5 text-sm"
  };
</script>

<button
  class="{base} {variantClass[variant]} {sizeClass[size]} {extraClass}"
  {onclick}
  {title}
  {type}
  {disabled}
  {...rest}>
  {@render children()}
</button>
