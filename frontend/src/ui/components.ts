import { lang } from "../lang/lang";

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  opts?: {
    className?: string;
    text?: string;
    attrs?: Record<string, string>;
  },
  children?: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);

  if (opts?.className) node.className = opts.className;
  if (opts?.text !== undefined) node.textContent = opts.text;

  if (opts?.attrs) {
    for (const [k, v] of Object.entries(opts.attrs)) {
      node.setAttribute(k, v);
    }
  }

  if (children) {
    for (const c of children) {
      node.append(c);
    }
  }

  return node;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MiB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GiB`;
}

export function showToast(
  message: string,
  kind: "info" | "warn" | "error" = "info",
  ms = 3200
): void {
  let host = document.getElementById("toastHost");

  if (!host) {
    host = el("div", { attrs: { id: "toastHost" } });
    document.body.append(host);
  }

  const t = el("div", {
    className: `toast toast-${kind}`,
    text: message,
  });

  host.append(t);
  setTimeout(() => t.remove(), ms);
}

function tooltipNode(): HTMLDivElement {
  let tip = document.getElementById("globalTooltip") as HTMLDivElement | null;

  if (!tip) {
    tip = el("div", { attrs: { id: "globalTooltip" } });
    document.body.append(tip);
  }

  return tip;
}

export function bindTooltip(target: HTMLElement, getText: () => string): void {
  let timer: ReturnType<typeof setTimeout> | undefined;

  target.addEventListener("mouseenter", (e) => {
    timer = setTimeout(() => {
      const tip = tooltipNode();
      tip.textContent = getText();
      tip.style.display = "block";

      const x = Math.min((e as MouseEvent).clientX + 14, window.innerWidth - 360);
      const y = Math.min((e as MouseEvent).clientY + 16, window.innerHeight - 120);

      tip.style.left = `${x}px`;
      tip.style.top = `${y}px`;
    }, 1000);
  });

  target.addEventListener("mouseleave", () => {
    clearTimeout(timer);
    tooltipNode().style.display = "none";
  });
}

export interface ChoiceOption {
  labelKey: string;
  value: string;
  danger?: boolean;
}

export interface ChoiceResult {
  value: string;
  checked: boolean;
}

export function showChoiceModal(opts: {
  titleKey: string;
  messageKey: string;
  options: ChoiceOption[];
  checkboxKey?: string;
}): Promise<ChoiceResult | null> {
  return new Promise((resolve) => {
    const overlay = el("div", { className: "modalOverlay" });
    const card = el("div", { className: "modalCard" });

    card.append(el("h3", { className: "modalTitle", text: lang(opts.titleKey) }));
    card.append(el("p", { className: "modalMessage", text: lang(opts.messageKey) }));

    let checkbox: HTMLInputElement | null = null;

    if (opts.checkboxKey) {
      const row = el("label", { className: "modalCheckbox" });
      checkbox = el("input", { attrs: { type: "checkbox" } });
      row.append(checkbox, el("span", { text: lang(opts.checkboxKey) }));
      card.append(row);
    }

    const btnRow = el("div", { className: "modalButtons" });

    const cleanup = (): void => {
      window.removeEventListener("keydown", onEsc, true);
      overlay.remove();
    };

    const onEsc = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        cleanup();
        resolve(null);
      }
    };

    window.addEventListener("keydown", onEsc, true);

    const cancelBtn = el("button", {
      className: "btn",
      text: lang("common.cancel"),
    });

    cancelBtn.addEventListener("click", () => {
      cleanup();
      resolve(null);
    });

    btnRow.append(cancelBtn);

    for (const opt of opts.options) {
      const b = el("button", {
        className: opt.danger ? "btn btnDanger" : "btn btnPrimary",
        text: lang(opt.labelKey),
      });

      b.addEventListener("click", () => {
        cleanup();
        resolve({
          value: opt.value,
          checked: checkbox?.checked ?? false,
        });
      });

      btnRow.append(b);
    }

    card.append(btnRow);
    overlay.append(card);

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        cleanup();
        resolve(null);
      }
    });

    document.body.append(overlay);
  });
}

export async function showConfirm(
  titleKey: string,
  messageKey: string,
  danger = false
): Promise<boolean> {
  const result = await showChoiceModal({
    titleKey,
    messageKey,
    options: [{ labelKey: "common.confirm", value: "yes", danger }],
  });

  return result?.value === "yes";
}

export async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    showToast(lang("toast.copied"));
  } catch {
    showToast(lang("error.clipboardUnavailable"), "error");
  }
}
