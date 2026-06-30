<script lang="ts" module>
  // Monochrome line-icon set for the back-office nav rails and chrome. One flat
  // stroke style (viewBox 24, stroke currentColor, width 2, round joins) matching
  // the existing ThemeToggle icons — replaces the emoji that read as inconsistent
  // in an admin/account context. Add a name here, reference it by `name`.
  export type IconName =
    | "activity"
    | "zap"
    | "file-text"
    | "server"
    | "list"
    | "mic"
    | "mic-off"
    | "settings"
    | "radio"
    | "folder"
    | "dashboard"
    | "bell"
    | "user"
    | "send"
    | "package"
    | "log-out"
    | "arrow-left"
    | "menu"
    | "x";

  const PATHS: Record<IconName, string> = {
    activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2" />',
    zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />',
    "file-text":
      '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M9 13h6M9 17h6" />',
    server:
      '<rect x="3" y="3" width="18" height="8" rx="1.5" /><rect x="3" y="13" width="18" height="8" rx="1.5" /><path d="M7 7h.01M7 17h.01" />',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />',
    mic: '<rect x="9" y="2" width="6" height="11" rx="3" /><path d="M5 10a7 7 0 0 0 14 0M12 17v4M8 21h8" />',
    "mic-off":
      '<path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V5a3 3 0 0 0-5.94-.6" /><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" /><path d="M12 19v4M8 23h8M2 2l20 20" />',
    settings:
      '<circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />',
    radio:
      '<circle cx="12" cy="12" r="2" /><path d="M16.24 7.76a6 6 0 0 1 0 8.49M7.76 16.24a6 6 0 0 1 0-8.49M19.07 4.93a10 10 0 0 1 0 14.14M4.93 19.07a10 10 0 0 1 0-14.14" />',
    folder:
      '<path d="M4 20a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2z" />',
    dashboard:
      '<rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" />',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />',
    user: '<circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" />',
    send: '<path d="M22 2 11 13M22 2 15 22l-4-9-9-4z" />',
    package:
      '<path d="M12 2 3 7v10l9 5 9-5V7z" /><path d="M3 7l9 5 9-5M12 12v10" />',
    "log-out":
      '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />',
    "arrow-left": '<path d="M19 12H5M12 19l-7-7 7-7" />',
    menu: '<path d="M3 6h18M3 12h18M3 18h18" />',
    x: '<path d="M18 6 6 18M6 6l12 12" />'
  };
</script>

<script lang="ts">
  let {
    name,
    size = 16,
    class: extraClass = ""
  }: { name: IconName; size?: number; class?: string } = $props();
</script>

<svg
  viewBox="0 0 24 24"
  width={size}
  height={size}
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
  class={extraClass}>
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html PATHS[name]}
</svg>
