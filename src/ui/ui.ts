import {GRAPHICS_QUALITIES,GRAPHICS_PROFILES,graphicsQuality,type GraphicsQuality} from "../render/graphics";
import { ENCHANTMENTS } from "../game/progression";
import { ARMOR_SLOTS } from "../game/equipment";
import { ITEMS, item } from "../game/items";
import { RECIPES } from "../game/inventory";
import type { Inventory } from "../game/inventory";
import type { Enchantment, Stack } from "../game/stack";
import type { Mode, SaveSummary } from "../persistence/saves";

const BRAND_MARK_SVG = '<svg viewBox="0 0 24 32" width="22" height="30" aria-hidden="true"><path fill="currentColor" d="M7 1h10v3H7zM5 6h14l3 5v11l-4 4H6l-4-4V11zM7 28h10v2H7zM11 30h2v2h-2z"/><path d="M9 7v18m6-18V7" stroke="#f2dba8" stroke-width="1" fill="none"/></svg>';
const CONTEXT_SLOT_ACTIONS = new Set([
  "slot",
  "container-slot",
  "furnace-slot",
  "grid-slot",
  "brew-slot",
  "hopper-slot",
]);
const DRAGGABLE_SLOT_ACTIONS = new Set(["slot", "hotbar-select", "container-slot"]);
const INVENTORY_CATEGORIES = [
  "All",
  "Architecture",
  "Natural",
  "Timber",
  "Nature",
  "Decor",
  "Stations",
  "Workstations",
  "Farming",
  "Mechanisms",
  "Tools",
  "Equipment",
  "Brewing",
  "Food",
  "Materials",
  "Minerals",
] as const;
const CONTROL_HINTS = [
  ["W A S D", "Walk"],
  ["Mouse", "Look around"],
  ["Space", "Jump / swim up"],
  ["Shift", "Sprint"],
  ["C / Ctrl", "Crouch / fly down"],
  ["Double Space / G", "Toggle creative flight"],
  ["Left click", "Hold to mine / attack"],
  ["Right click / F", "Place / use / interact"],
  ["E", "Inventory & collection"],
  ["1–9 / Scroll", "Select hotbar slot"],
  ["Q", "Drop selected item"],
  ["F3", "Performance details"],
  ["Esc", "Toggle pause / close dialog"],
] as const;
export const esc = (s: unknown) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
/** Catalog icons use the same atlas tile as world blocks and distinct silhouettes for items. */
export const icon = (id: number) => {
  const d = item(id);
  if (!d) return "";
  const svg = (art: string) => `<svg viewBox="0 0 32 32" aria-hidden="true">${art}</svg>`;
  let art = "";
  if (d.tool) {
    const head = d.tool === "sword"
      ? '<path fill="var(--item)" d="M23 2l6 1-1 6-14 14-5-5z"/><path fill="#b29557" d="M6 17l10 10 3-3L9 14z"/>'
      : d.tool === "shovel" ? '<path fill="var(--item)" d="M19 3l10 10-8 8-9-9z"/>'
      : d.tool === "axe" ? '<path fill="var(--item)" d="M16 3l12 2-1 12-10-1-4-5z"/>'
      : d.tool === "hoe" ? '<path fill="var(--item)" d="M7 4h19v7h-6V8H7z"/>'
      : '<path fill="var(--item)" d="M4 7l5-4h16l5 5-2 8-4-7H10l-5 4z"/>';
    art = svg(`<path fill="#96704d" d="M20 9l4 4L8 30l-5-4z"/>${head}`);
  } else if (d.armorSlot) {
    const shapes: Record<string, string> = {
      helmet: '<path d="M5 17V12a11 11 0 0122 0v5l-4 1v8h-6v-8h-2v8H9v-8z"/><path fill="#fff7" d="M8 12h16v3H8z"/>',
      tunic: '<path d="M9 4l7 4 7-4 7 8-6 6-3-3v14H11V15l-3 3-6-6z"/><path fill="#fff7" d="M12 10h8v3h-8z"/>',
      greaves: '<path d="M7 3h18v10l-3 16h-6l-1-13-2 13H7L5 13z"/><path fill="#fff7" d="M8 7h14v3H8z"/>',
      boots: '<path d="M5 4h9v17l5 2v5H3v-7h2zm14 0h8v17l3 2v5H17v-6h2z"/><path fill="#fff7" d="M6 6h6v3H6z"/>',
    };
    art = svg(`<g fill="var(--item)">${shapes[d.armorSlot]}</g>`);
  } else if (id >= 160 && id <= 167) {
    art = svg('<path fill="#7a6648" d="M12 2h8v4h-8z"/><path fill="#b5d0c9" d="M11 6h10v7l6 7v9H5v-9l6-7z"/><path fill="var(--item)" d="M8 21h16v5H8z"/>');
  } else if (id >= 168 && id <= 170) {
    art = svg('<path fill="#b7c3bb" d="M5 11h22l-4 18H9z"/><path fill="none" stroke="#738d83" stroke-width="3" d="M9 12V6q7-8 14 0v6"/><path fill="var(--item)" d="M9 14h14l-2 11H11z"/>');
  } else if (d.block === undefined) {
    if (id === 104 || id === 107 || id === 109) {
      const seed = id === 104 ? '<path d="M9 27L23 5l3 2-14 22z"/>'
        : id === 107 ? '<path d="M14 29V9M14 18Q6 5 5 13q0 8 9 5M14 23q14-15 13-6-1 8-13 6" fill="none" stroke="var(--item)" stroke-width="4"/>'
        : '<path d="M15 28V9M14 13Q2 6 4 17q4 6 10-4M17 20q13-17 13-6-1 7-13 6"/>';
      art = svg(`<g fill="var(--item)">${seed}</g>`);
    } else if (id === 105 || id === 108 || id === 110 || id === 112) {
      if (id === 112) art = svg('<path fill="#e6ddbe" d="M5 8h20v16q0 6-10 6T5 24z"/><path fill="var(--item)" d="M7 12h16v11q0 4-8 4t-8-4z"/><path fill="none" stroke="#947956" stroke-width="3" d="M24 11q12-2 4 11h-4"/>');
      else if (id === 105) art = svg('<path fill="var(--item)" d="M3 21Q5 6 16 8q12-1 13 13Q16 33 3 21z"/><path fill="none" stroke="#ab9779" stroke-width="2" d="M8 19l2-4 3 3 3-5 3 5 3-3 2 4"/>');
      else if (id === 108) art = svg('<g fill="var(--item)"><ellipse cx="8" cy="14" rx="4" ry="8" transform="rotate(-20 8 14)"/><ellipse cx="17" cy="11" rx="4" ry="8" transform="rotate(15 17 11)"/><ellipse cx="23" cy="21" rx="4" ry="8" transform="rotate(35 23 21)"/></g>');
      else art = svg('<path fill="#a88a60" d="M3 17h26l-5 12H8z"/><path fill="#fff6de" d="M5 16q0-11 11-11t11 11z"/><path fill="var(--item)" d="M7 16q1-9 9-9t9 9z"/><path stroke="#b19e7e" stroke-width="1.5" d="M8 14h16"/>');
    } else {
      const ingot = id === 102 || id === 106;
      art = ingot ? svg('<path fill="var(--item)" d="M4 20l6-13h12l6 13-4 8H8z"/><path fill="#fff7" d="M10 9h12l-3 7H7z"/>')
        : id === 111 ? svg('<circle cx="16" cy="16" r="13" fill="var(--item)"/><circle cx="16" cy="16" r="9" fill="none" stroke="#e9dec0" stroke-width="2"/><path fill="#e9dec0" d="M16 7l5 9-5 9-5-9z"/>')
        : id === 101 ? svg('<path fill="#414947" d="M3 24L8 7l9 3 5-8 8 16-6 11H8z"/><path fill="#849087" d="M8 7l9 3-5 12z"/>')
        : svg('<path fill="var(--item)" d="M16 2l11 8 1 13-12 7L4 23 5 10z"/><path fill="#fff7" d="M16 2l-4 13 4 15 3-16z"/>');
    }
  }
  // Atlas tile mapping matches the voxel renderer: three tiles per block.
  // A distinct tile is used per block rather than one generic colored hexagon.
  const tile = (d.block ?? 0) * 3 + 1;
  const texture = d.block !== undefined;
  const extra = texture ? `;--atlas-x:${tile % 16};--atlas-y:${Math.floor(tile / 16)}` : "";
  return `<span class="item-icon ${texture ? "block-texture" : "tool"}" data-item-id="${id}" role="img" aria-label="${esc(d.name)}" style="--item:${d.color}${extra}">${art}</span>`;
};

type SlotOptions = {
  className?: string;
  ariaPressed?: boolean;
};

export const slot = (
  s: Stack | null,
  i: number,
  action = "slot",
  options: SlotOptions = {},
) => {
  const enchantments = s?.enchants
    ? Object.entries(s.enchants)
        .map(([key, level]) => `${ENCHANTMENTS[key as Enchantment].name} ${level}`)
        .join(", ")
    : "";
  const title = s
    ? esc(`${item(s.id)?.name}${enchantments ? ` · ${enchantments}` : ""}`)
    : "Empty slot";
  const className = `slot${options.className ? ` ${options.className}` : ""}`;
  const ariaPressed =
    options.ariaPressed === undefined
      ? ""
      : ` aria-pressed="${options.ariaPressed}"`;
  const durability =
    s?.durability === undefined
      ? ""
      : `<i class="durability" style="width:${(s.durability / (item(s.id)?.durability ?? 1)) * 80}%"></i>`;

  return `<button class="${className}" data-action="${action}" data-index="${i}" title="${title}" draggable="${Boolean(s)}"${ariaPressed}>${s ? icon(s.id) : ""}${s && s.count > 1 ? `<b>${s.count}</b>` : ""}${durability}</button>`;
};
export type Screen =
  | "menu"
  | "create"
  | "none"
  | "pause"
  | "inventory"
  | "craft"
  | "settings"
  | "controls"
  | "chest"
  | "furnace"
  | "hopper"
  | "enchant"
  | "brew"
  | "anvil"
  | "journal"
  | "trade"
  | "death";
export class UI {
  root: HTMLElement;
  overlay: HTMLElement;
  hud: HTMLElement;
  toastEl: HTMLElement;
  saveStatusEl: HTMLElement;
  screen: Screen = "menu";
  onAction?: (action: string, button: HTMLElement, event: MouseEvent) => void;
  onMove?: (fromAction: string, fromIndex: number, toAction: string, toIndex: number) => void;
  onChange?: (el: HTMLInputElement | HTMLSelectElement) => void;
  onSearch?: () => void;
  constructor(root: HTMLElement) {
    this.root = root;
    root.innerHTML = [
      '<canvas id="game" aria-label="Jade Harbor voxel world"></canvas>',
      '<div id="vignette"></div>',
      '<div id="hud" hidden></div>',
      '<div id="overlay"></div>',
      '<div id="toast" role="status"></div>',
      '<div id="save-status" aria-live="polite"></div>',
    ].join("");
    this.overlay = root.querySelector("#overlay")!;
    this.hud = root.querySelector("#hud")!;
    this.toastEl = root.querySelector("#toast")!;
    this.saveStatusEl = root.querySelector("#save-status")!;
    this.overlay.addEventListener("click", (e) => {
      const target = (e.target as HTMLElement).closest<HTMLElement>(
        "[data-action]",
      );
      if (target)
        this.onAction?.(target.dataset.action!, target, e as MouseEvent);
    });
    this.overlay.addEventListener("contextmenu", (e) => {
      const target = (e.target as HTMLElement).closest<HTMLElement>("[data-action]");
      const action = target?.dataset.action;
      if (!target || !action || !CONTEXT_SLOT_ACTIONS.has(action)) return;
      e.preventDefault();
      this.onAction?.(action, target, e as MouseEvent);
    });
    this.overlay.addEventListener("input", (e) => {
      const el = e.target as HTMLInputElement;
      if (el.id === "search") this.onSearch?.();
      else this.onChange?.(el);
    });
    this.overlay.addEventListener("change", (e) =>
      this.onChange?.(e.target as HTMLInputElement),
    );
    // Capture logical slot identities: inventory redraws detach DOM nodes.
    // Never fake drag/drop by dispatching two sequential slot clicks.
    let dragged: { action: string; index: number; screen: Screen } | null = null;
    const valid = (action: string) => DRAGGABLE_SLOT_ACTIONS.has(action);
    this.overlay.addEventListener("dragstart", (e) => {
      const source = (e.target as HTMLElement).closest<HTMLElement>("[data-index]");
      const action = source?.dataset.action ?? "";
      const index = Number(source?.dataset.index);
      if (!source || !valid(action) || !Number.isInteger(index) ||
          (this.screen !== "inventory" && this.screen !== "chest") ||
          source.getAttribute("draggable") !== "true") {
        dragged = null;
        e.preventDefault();
        return;
      }
      dragged = { action, index, screen: this.screen };
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", `${action}:${index}`);
      }
    });
    this.overlay.addEventListener("dragover", (e) => {
      const destination = (e.target as HTMLElement).closest<HTMLElement>("[data-index]");
      if (dragged && dragged.screen === this.screen && destination &&
          valid(destination.dataset.action ?? "")) {
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
      }
    });
    this.overlay.addEventListener("drop", (e) => {
      const source = dragged;
      dragged = null;
      const destination = (e.target as HTMLElement).closest<HTMLElement>("[data-index]");
      if (!source || source.screen !== this.screen || !destination ||
          !valid(destination.dataset.action ?? "")) return;
      const index = Number(destination.dataset.index);
      if (!Number.isInteger(index)) return;
      e.preventDefault();
      this.onMove?.(source.action, source.index, destination.dataset.action!, index);
    });
    this.overlay.addEventListener("dragend", () => { dragged = null; });
  }
  show(screen: Screen, html = "") {
    this.screen = screen;
    this.overlay.className =
      screen === "menu" || screen === "create"
        ? "home"
        : screen === "none"
          ? "hidden"
          : "modal-wrap";
    this.overlay.innerHTML = html;
    this.hud.hidden = ["menu", "create"].includes(screen);
  }
  toast(message: string) {
    this.toastEl.textContent = message;
    this.toastEl.classList.add("visible");
    setTimeout(() => this.toastEl.classList.remove("visible"), 3200);
  }
  saveStatus(message: string) {
    this.saveStatusEl.textContent = message;
  }
  worldProcessing(id: string, message: string | null) {
    const card = Array.from(
      this.overlay.querySelectorAll<HTMLElement>(".world-card"),
    ).find((node) => node.dataset.worldId === id);
    if (!card) return;
    const active = Boolean(message);
    card.classList.toggle("is-processing", active);
    card.setAttribute("aria-busy", active ? "true" : "false");
    card.querySelectorAll<HTMLButtonElement>("button").forEach((control) => {
      control.disabled = active;
    });
    const status = card.querySelector<HTMLElement>(".world-processing");
    const label = status?.querySelector<HTMLElement>(".world-processing-label");
    if (status) status.hidden = !active;
    if (label) label.textContent = message ?? "";
  }
  menu(saves: SaveSummary[]) {
    const worldList = saves.length
      ? [...saves]
          .sort((a, b) => b.updated - a.updated)
          .map((save) => {
            const id = esc(save.id);
            const updated = new Date(save.updated).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });
            return [
              `<div class="world-card" data-world-id="${id}" aria-busy="false">`,
              `<button class="world-open" data-action="load" data-id="${id}">`,
              `<span class="world-thumbnail">${BRAND_MARK_SVG}</span>`,
              `<span><strong>${esc(save.name)}</strong><small>${esc(save.mode)} · ${updated}</small></span>`,
              '<span class="arrow">↗</span>',
              "</button>",
              '<div class="world-tools">',
              '<div class="world-tool-bar world-tool-bar-main">',
              `<button data-action="rename" data-id="${id}">Rename</button>`,
              `<button data-action="export-world" data-id="${id}">Export</button>`,
              `<button data-action="duplicate" data-id="${id}">Duplicate</button>`,
              "</div>",
              '<div class="world-tool-bar world-tool-bar-danger">',
              `<button data-action="reset" data-id="${id}">Reset</button>`,
              `<button data-action="delete" data-id="${id}">Delete</button>`,
              "</div>",
              "</div>",
              (save.generator??0) >= 6 && (save.generator??0) < 10 ? `<button class="world-density-copy" data-action="dense-city-copy" data-id="${id}" title="Create an updated city in a separate save, keeping your edits and progress. Starts at Panda Plaza.">Create updated city copy</button>` : "",
              '<div class="world-processing" role="status" aria-live="polite" hidden>',
              '<span class="processing-spinner" aria-hidden="true"></span>',
              '<span class="world-processing-label"></span>',
              "</div>",
              "</div>",
            ].join("");
          })
          .join("")
      : '<div class="empty-world"><span>⌂</span><h3>Start with a blank horizon.</h3><p>Create a world, choose how you want to play, and shape it block by block.</p></div>';

    this.show(
      "menu",
      [
        `<header class="brand"><span class="brand-mark">${BRAND_MARK_SVG}</span><span>JADE HARBOR <small>A CHINATOWN VOXEL SANDBOX</small></span></header>`,
        '<div class="home-body">',
        '<section class="intro">',
        '<div class="eyebrow"><span></span> BUILD. EXPLORE. MAKE IT YOURS.</div>',
        '<h1>Build beyond.<br><em>Boundaries.</em></h1>',
        '<p>Explore a living Chinatown, carve into the mountains,<br class="wide"> or build something entirely your own.</p>',
        '<button class="primary large" data-action="new">Create your world <span>↗</span></button>',
        '<div class="home-links"><button data-action="controls">How to play</button><i></i><button data-action="settings">Settings</button><i></i><button data-action="import">Import world</button></div>',
        "</section>",
        '<section class="world-panel">',
        '<div class="world-panel-sticky">',
        `<div class="panel-heading"><span>YOUR WORLDS</span><span class="tiny">${saves.length.toString().padStart(2, "0")}</span></div>`,
        '<div class="local-note"><span class="status-dot"></span><span>Saved locally in this browser. Export a backup anytime.</span></div>',
        "</div>",
        `<div class="world-list">${worldList}</div>`,
        "</section>",
        "</div>",
        '<footer class="home-footer"><span>JADE HARBOR <i> / </i> MORTAL REALM</span><span>Built block by block.</span><span>JADE HARBOR · v2.0.1</span></footer>',
      ].join(""),
    );
  }

  create() {
    this.show(
      "create",
      [
        `<header class="brand"><span class="brand-mark">${BRAND_MARK_SVG}</span><span>JADE HARBOR</span></header>`,
        '<section class="create-panel">',
        '<button class="text-button" data-action="menu">← Your worlds</button>',
        '<div class="eyebrow">CREATE A WORLD</div>',
        '<h2>Choose your next world.</h2>',
        '<p>Use the same seed to revisit a landscape, or change it for a new one.</p>',
        '<label>World name<input id="world-name" maxlength="64" value="My Jade Harbor" placeholder="Name your world"></label>',
        '<label>World seed <span>Same seed, same landscape</span><input id="world-seed" maxlength="100" value="jade-harbor"></label>',
        '<label>How will you play?<select id="world-mode"><option value="creative">Creative — unlimited building & flight</option><option value="survival">Survival — gather, craft & stay alive</option><option value="adventure">Adventure — explore without editing blocks</option><option value="spectator">Spectator — fly freely through the world</option><option value="hardcore">Hardcore — survival with one life</option></select></label>',
        '<p class="form-note">Hardcore death permanently turns the world into spectator mode.</p>',
        '<button class="primary large full" data-action="create">Create & enter <span>↗</span></button>',
        "</section>",
      ].join(""),
    );
  }

  panel(screen: Screen, title: string, subtitle: string, body: string) {
    const goesBack = screen === "settings" || screen === "controls" || screen === "journal";
    const closeAction = goesBack ? "back" : "resume";
    const closeLabel = goesBack
      ? "Back to previous screen"
      : "Close dialog and return to world";
    const closeTitle = goesBack ? "Back (Esc)" : "Return to world (Esc)";
    const dialogClass = screen === "inventory" ? "dialog inventory-dialog" : "dialog";

    this.show(
      screen,
      [
        `<section class="${dialogClass}">`,
        '<div class="dialog-head"><div><div class="eyebrow">JADE HARBOR</div>',
        `<h2>${title}</h2><p>${subtitle}</p></div>`,
        `<button type="button" class="close" data-action="${closeAction}" aria-label="${closeLabel}" title="${closeTitle}">×</button>`,
        "</div>",
        body,
        "</section>",
      ].join(""),
    );
  }

  pause(name: string, mode: Mode, hardcoreEnded = false) {
    const modeControl =
      mode !== "hardcore" && !hardcoreEnded
        ? `<div class="mode-control"><label>Game mode<select id="change-mode">${[
            "creative",
            "survival",
            "adventure",
            "spectator",
          ]
            .map(
              (candidate) =>
                `<option ${candidate === mode ? "selected" : ""}>${candidate}</option>`,
            )
            .join("")}</select></label></div>`
        : "";
    const actions = [
      '<button class="primary" data-action="resume">Return to world <span>↗</span></button>',
      '<button data-action="save">Save world</button>',
      '<button data-action="journal">Travel journal</button>',
      '<button data-action="menu">Save & return home</button>',
      '<button data-action="export">Export backup</button>',
      '<button data-action="settings">Settings</button>',
      '<button data-action="controls">Controls</button>',
    ].join("");

    this.panel(
      "pause",
      "World paused.",
      `${esc(name)} · ${mode}`,
      `<div class="pause-grid">${actions}</div>${modeControl}`,
    );
  }

  inventory(inv: Inventory, creative: boolean, category = "All", query = "") {
    // Inventory redraws must not reset the independent catalog and dialog scrollbars.
    const previousDialog =
      this.screen === "inventory"
        ? this.overlay.querySelector<HTMLElement>(".inventory-scroll-area")
        : null;
    const previousCatalog =
      this.screen === "inventory"
        ? this.overlay.querySelector<HTMLElement>("#catalog")
        : null;
    const previousCategories =
      this.screen === "inventory"
        ? this.overlay.querySelector<HTMLElement>(".categories")
        : null;
    const dialogScroll = previousDialog?.scrollTop ?? 0;
    const catalogScroll = previousCatalog?.scrollTop ?? 0;
    const categoriesScroll = previousCategories?.scrollLeft ?? 0;

    const toolbar = `<div class="inventory-toolbar"><button class="pill active" data-action="inventory">${creative ? "Collection" : "Inventory"}</button><button class="pill" data-action="craft">Crafting book</button>${creative ? '<input id="search" placeholder="Find a block or item…" autocomplete="off">' : ""}</div>`;
    const creativeCatalog = creative
      ? [
          '<div class="categories">',
          INVENTORY_CATEGORIES.map(
            (name) =>
              `<button data-action="category" data-category="${name}" class="${name === category ? "active" : ""}">${name}</button>`,
          ).join(""),
          "</div>",
          `<div id="catalog" class="catalog">${this.catalog(category, query)}</div>`,
        ].join("")
      : "";
    const equipment = `<div class="equipment-row">${inv.equipment.slots
      .map(
        (stack, index) =>
          `<div>${slot(stack, index, "armor-slot")}<small>${ARMOR_SLOTS[index]}</small></div>`,
      )
      .join("")}<p>${inv.equipment.protection} / 20 protection<br><small>Reduces melee damage · wears with use</small></p></div>`;
    const satchelLabel = inv.cursor
      ? `Holding: ${esc(item(inv.cursor.id)?.name)} ×${inv.cursor.count}`
      : "36 slots";
    const satchel = `<div class="section-label">SATCHEL <span>${satchelLabel}</span></div><div class="slots">${inv.slots
      .slice(9)
      .map((stack, index) => slot(stack, index + 9))
      .join("")}</div>`;
    const heldName = esc(item(inv.held?.id ?? -1)?.name ?? "Empty");
    const hotbar = `<div class="inventory-hotbar-dock"><div class="section-label">HOTBAR <span>Selected: ${inv.selected + 1} · ${heldName} · Press 1–9</span></div><div class="slots hotbar-slots">${inv.slots
      .slice(0, 9)
      .map((stack, index) =>
        slot(stack, index, creative ? "hotbar-select" : "slot", {
          className: inv.selected === index ? "chosen" : undefined,
          ariaPressed: inv.selected === index,
        }),
      )
      .join("")}</div></div>`;

    this.panel(
      "inventory",
      creative ? "The builder’s collection." : "Your satchel.",
      creative
        ? "Choose a block to put it in your selected hotbar slot."
        : "Click to move · Right-click to split · Drag to move items",
      `<div class="inventory-scroll-area">${toolbar}${creativeCatalog}${equipment}${satchel}</div>${hotbar}`,
    );

    const search = this.overlay.querySelector<HTMLInputElement>("#search");
    if (search) search.value = query;
    const nextDialog =
      this.overlay.querySelector<HTMLElement>(".inventory-scroll-area");
    const nextCatalog = this.overlay.querySelector<HTMLElement>("#catalog");
    const nextCategories = this.overlay.querySelector<HTMLElement>(".categories");
    if (nextDialog) nextDialog.scrollTop = dialogScroll;
    if (nextCatalog) nextCatalog.scrollTop = catalogScroll;
    if (nextCategories) nextCategories.scrollLeft = categoriesScroll;
  }

  catalog(category: string, query: string) {
    const normalizedQuery = query.toLowerCase();
    return (
      ITEMS.filter(
        (entry) =>
          (category === "All" || entry.category === category) &&
          entry.name.toLowerCase().includes(normalizedQuery),
      )
        .map(
          (entry) =>
            `<button class="catalog-item" data-action="choose" data-id="${entry.id}" title="${esc(entry.name)}">${icon(entry.id)}<span>${esc(entry.name)}</span></button>`,
        )
        .join("") || '<p class="empty-search">No matching items.</p>'
    );
  }

  craft(
    inv: Inventory,
    nearBench: boolean,
    creative: boolean,
    grid: (Stack | null)[] = Array(9).fill(null),
    size = 2,
    output: [number, number] | null = null,
  ) {
    const gridSlots = grid
      .slice(0, size * size)
      .map((stack, index) => slot(stack, index, "grid-slot"))
      .join("");
    const outputEnabled = Boolean(output && (size === 2 || nearBench));
    const outputContent = output
      ? `${icon(output[0])}<small>×${output[1]}</small>`
      : "<small>Output</small>";
    const cursor = inv.cursor
      ? `Holding ${esc(item(inv.cursor.id)?.name)} ×${inv.cursor.count}`
      : "Click a slot to move items.";
    const recipes = RECIPES.map((recipe) => {
      const canCraft =
        (!recipe.station || nearBench) &&
        (creative || recipe.cost.every(([id, count]) => inv.count(id) >= count));
      const cost = recipe.cost
        .map(([id, count]) => `${count} ${item(id)?.name}`)
        .join(" + ");
      const stationNote = recipe.station && !nearBench ? " · Needs bench" : "";
      return `<button class="recipe" data-action="make" data-id="${recipe.id}" ${canCraft ? "" : "disabled"}>${icon(recipe.output[0])}<span><strong>${recipe.name} <em>×${recipe.output[1]}</em></strong><small>${cost}${stationNote}</small></span><span class="recipe-arrow">${canCraft ? "↗" : "—"}</span></button>`;
    }).join("");

    const body = [
      '<div class="inventory-toolbar"><button class="pill" data-action="inventory">Inventory</button><button class="pill active">Crafting book</button></div>',
      '<div class="manual-crafting">',
      `<div class="craft-grid craft-grid-${size}">${gridSlots}</div>`,
      "<span>→</span>",
      `<button class="craft-output" data-action="grid-output" ${outputEnabled ? "" : "disabled"}>${outputContent}</button>`,
      `<p>Arrange ingredients<br>or use a recipe below.<br><small>${cursor}</small></p>`,
      "</div>",
      `<div class="slots">${inv.slots.map((stack, index) => slot(stack, index)).join("")}</div>`,
      '<div class="section-label">RECIPE BOOK</div>',
      `<div class="recipe-list">${recipes}</div>`,
    ].join("");

    this.panel(
      "craft",
      "Make something useful.",
      nearBench
        ? "Crafting bench in range · all recipes available"
        : "Basic recipes · stand near a crafting bench for tools and stations",
      body,
    );
  }

  container(inv: Inventory, slots: (Stack | null)[], name = "Cedar chest") {
    const cursor = inv.cursor
      ? `Holding ${esc(item(inv.cursor.id)?.name)} ×${inv.cursor.count}`
      : "";
    this.panel(
      "chest",
      esc(name),
      "Click to move · Right-click to split · Shift-click to transfer",
      `<div class="slots">${slots.map((stack, index) => slot(stack, index, "container-slot")).join("")}</div><div class="section-label">YOUR INVENTORY <span>${cursor}</span></div><div class="slots">${inv.slots.map((stack, index) => slot(stack, index)).join("")}</div>`,
    );
  }

  settings(settings: {
    graphicsQuality?: GraphicsQuality;
    fov: number;
    sensitivity: number;
    distance: number;
    simulationDistance: number;
    volume: number;
  }) {
    this.panel(
      "settings",
      "Tune your experience.",
      "Changes apply immediately.",
      [
        '<div class="settings">',
        `<label>Graphics quality<select id="graphicsQuality">${GRAPHICS_QUALITIES.map(q=>`<option value="${q}"${q===graphicsQuality(settings.graphicsQuality)?" selected":""}>${GRAPHICS_PROFILES[q].label}</option>`).join("")}</select></label>`,
        '<p class="form-note">Low favors speed, Medium balances detail, and High preserves full detail. View distance sets scenery range. Simulation distance sets gameplay activity range.</p>',
        `<label>Field of view <output>${settings.fov}°</output><input id="fov" type="range" min="55" max="105" value="${settings.fov}"></label>`,
        `<label>View distance <output>${settings.distance} chunks</output><input id="distance" type="range" min="3" max="8" value="${settings.distance}"></label>`,
        `<label>Simulation distance <output>${settings.simulationDistance} chunks</output><input id="simulationDistance" type="range" min="2" max="6" value="${settings.simulationDistance}"></label>`,
        `<label>Mouse sensitivity <output>${settings.sensitivity}</output><input id="sensitivity" type="range" min="1" max="12" value="${settings.sensitivity}"></label>`,
        `<label>Sound volume <output>${settings.volume}%</output><input id="volume" type="range" min="0" max="100" value="${settings.volume}"></label>`,
        '<div class="settings-actions"><button data-action="fullscreen">Toggle fullscreen ↗</button><button data-action="reset-settings">Reset to defaults</button></div>',
        "</div>",
      ].join(""),
    );
  }

  controls() {
    const controls = CONTROL_HINTS.map(
      ([key, description]) => `<div><kbd>${key}</kbd><span>${description}</span></div>`,
    ).join("");
    this.panel(
      "controls",
      "Controls at a glance.",
      "Designed for desktop keyboard and mouse.",
      `<div class="control-grid">${controls}</div><p class="form-note">Workbenches, chests, kilns, beds and villagers use right-click. Hold Ctrl to place against an interactive block. Rice seeds plant on tilled soil; use a hoe on grass or earth first.</p><button class="primary full" data-action="resume">Back to game <span>↗</span></button>`,
    );
  }

  updateHUD(
    inv: Inventory,
    data: {
      name: string;
      mode: Mode;
      biome: string;
      x: number;
      y: number;
      z: number;
      time: string;
      target: string;
      health: number;
      hunger: number;
      xp: number;
      breath: number;
      effects: string;
      flying: boolean;
      progress: number;
      hitFlash: boolean;
      hitMessage: string;
      debug: string;
    },
  ) {
    const survivalStats = ["creative", "spectator"].includes(data.mode)
      ? ""
      : `<div class="survival-stats"><span class="health">♥ ${Math.ceil(data.health)} / 20</span><span>◇ ${inv.equipment.protection} armor · ✦ Lv ${Math.floor(Math.sqrt(data.xp / 8))} · ${data.xp} XP</span><span class="hunger">◒ ${Math.ceil(data.hunger)} / 20</span></div>`;
    const breath =
      data.breath < 10
        ? `<div class="effect-status">Air · ${Math.ceil(data.breath)} / 10</div>`
        : "";
    const effects = data.effects
      ? `<div class="effect-status">${esc(data.effects)}</div>`
      : "";
    const hotbar = inv.slots
      .slice(0, 9)
      .map(
        (stack, index) =>
          `<div class="hotbar-slot ${index === inv.selected ? "selected" : ""}"><small>${index + 1}</small>${stack ? icon(stack.id) : ""}${stack && data.mode !== "creative" ? `<b>${stack.count}</b>` : ""}</div>`,
      )
      .join("");
    const heldName = esc(inv.held ? item(inv.held.id)?.name : "Empty hand");

    this.hud.innerHTML = [
      '<div class="hud-top">',
      `<div class="location"><span class="mini-brand">${BRAND_MARK_SVG}</span><div><strong>${esc(data.biome)}</strong><small title="World position: X (east/west), Y (height), Z (north/south)">XYZ ${data.x} / ${data.y} / ${data.z}</small></div></div>`,
      `<div class="world-clock"><span>${data.time}</span><small>${data.mode.toUpperCase()}${data.flying ? " · FLIGHT" : ""}</small></div>`,
      "</div>",
      data.target ? `<div class="target-label">${esc(data.target)}</div>` : "",
      `<div class="crosshair${data.hitFlash ? " hit" : ""}"><i></i><b></b></div>`,
      data.hitMessage
        ? `<div class="combat-feedback" role="status">${esc(data.hitMessage)}</div>`
        : "",
      data.progress > 0
        ? `<div class="mining-track"><div style="width:${data.progress * 100}%"></div></div>`
        : "",
      '<div class="hud-bottom">',
      survivalStats,
      breath,
      effects,
      `<div class="held-name">${heldName}</div>`,
      `<div class="hotbar">${hotbar}</div>`,
      '<div class="hud-hints"><span><kbd>E</kbd> Inventory</span><span><kbd>LMB</kbd> Mine</span><span><kbd>RMB</kbd> Use / place</span><span><kbd>Esc</kbd> Pause</span></div>',
      "</div>",
      data.debug ? `<pre class="debug">${esc(data.debug)}</pre>` : "",
    ].join("");
  }
}
