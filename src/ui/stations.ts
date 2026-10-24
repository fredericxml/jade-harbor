import type { Brewer } from "../game/brewing";
import { INFUSIONS } from "../game/brewing";
import type { Inventory } from "../game/inventory";
import { item } from "../game/items";
import {
  ENCHANTMENTS,
  compatible,
  enchantCost,
  enchantLevel,
  repairMaterial,
} from "../game/progression";
import type { Enchantment } from "../game/stack";
import { UI, esc, icon, slot } from "./ui";

export function toolStation(
  ui: UI,
  inv: Inventory,
  xp: number,
  screen: "enchant" | "anvil",
) {
  const selectedStack = inv.held;
  const selectedItem = selectedStack && item(selectedStack.id);
  const enchantmentSummary = Object.entries(selectedStack?.enchants ?? {})
    .map(
      ([key, level]) =>
        `${ENCHANTMENTS[key as Enchantment].name} ${level}`,
    )
    .join(" · ");

  const selected = `<div class="selected-tool">${selectedStack ? icon(selectedStack.id) : ""}<div><strong>${esc(selectedItem?.name ?? "Empty hand")}</strong><p>${selectedStack?.durability !== undefined ? `${selectedStack.durability} / ${selectedItem!.durability} durability` : "Select a tool or armor from your hotbar."}</p><small>${esc(enchantmentSummary)}</small></div></div>`;
  const choices = `<div class="section-label">SELECT A HOTBAR ITEM</div><div class="slots station-hotbar">${inv.slots
    .slice(0, 9)
    .map((stack, index) =>
      slot(stack, index, "station-select", {
        className: inv.selected === index ? "chosen" : undefined,
      }),
    )
    .join("")}</div>`;

  let body = "";
  if (screen === "enchant") {
    const availableEnchantments = (Object.keys(ENCHANTMENTS) as Enchantment[])
      .filter(
        (enchantment) =>
          selectedStack && compatible(selectedStack.id, enchantment),
      )
      .map((enchantment) => {
        const definition = ENCHANTMENTS[enchantment];
        const rank = enchantLevel(selectedStack, enchantment) + 1;
        const cost = enchantCost(rank);
        const maxed = rank > definition.max;
        const conflicts =
          (enchantment === "fortune" && enchantLevel(selectedStack, "silk")) ||
          (enchantment === "silk" && enchantLevel(selectedStack, "fortune"));
        const disabled =
          maxed ||
          Boolean(conflicts) ||
          xp < cost.xp ||
          inv.count(103) < cost.jade;
        const status = conflicts
          ? "Conflicts with current inscription"
          : maxed
            ? "Fully inscribed"
            : `${cost.xp} XP + ${cost.jade} jade shard${cost.jade > 1 ? "s" : ""}`;

        return `<button data-action="enchant" data-id="${enchantment}" ${disabled ? "disabled" : ""}><strong>${definition.name} ${maxed ? "· MAX" : rank}</strong><span>${definition.description}</span><small>${status}</small></button>`;
      })
      .join("");

    body = `<div class="enchant-list">${availableEnchantments || '<p class="form-note">Choose a tool or armor to see its available inscriptions. Obtain XP by mining coal and jade, collecting kiln output, or defeating spirits.</p>'}</div>`;
  } else {
    const material = selectedStack && repairMaterial(selectedStack.id);
    const canRepair = Boolean(
      selectedStack?.durability !== undefined &&
        selectedItem?.durability &&
        selectedStack.durability < selectedItem.durability &&
        material &&
        xp >= 2 &&
        inv.count(material),
    );
    body = `<p class="form-note">Restore 25% of maximum durability for 2 XP and one matching material. Inscriptions are preserved.</p><button class="primary full" data-action="repair" ${canRepair ? "" : "disabled"}>Repair ${esc(selectedItem?.name ?? "selected item")} <span>${esc(material ? item(material)?.name : "Choose a tool or armor")}</span></button>`;
  }

  ui.panel(
    screen,
    screen === "enchant"
      ? "Words that strengthen your tools."
      : "Give a trusted tool new life.",
    `Level ${Math.floor(Math.sqrt(xp / 8))} · ${xp} XP · ${inv.count(103)} jade shards`,
    selected + choices + body,
  );
}

export function brewerPanel(
  ui: UI,
  inv: Inventory,
  brewer: Brewer,
  water: boolean,
) {
  const slotLabels = ["Flask", "Ingredient", "Bamboo", "Infusion"];
  const stationSlots = brewer.slots
    .map(
      (stack, index) =>
        `<div>${slot(stack, index, "brew-slot")}<div class="station-slot-label">${slotLabels[index]}</div></div>`,
    )
    .join("");
  const recipes = Object.entries(INFUSIONS)
    .map(
      ([id, output]) =>
        `<p>${esc(item(Number(id))?.name)} → ${esc(item(output)?.name)}</p>`,
    )
    .join("");
  const cursor = inv.cursor
    ? `Holding ${esc(item(inv.cursor.id)?.name)} ×${inv.cursor.count}`
    : "";

  ui.panel(
    "brew",
    "From the apothecary.",
    "One glass flask + one ingredient · bamboo heat · water within four blocks",
    `<div class="station-slots">${stationSlots}</div><div class="station-progress"><div style="width:${(brewer.progress / 6) * 100}%"></div></div><p class="form-note">${water ? "Water available" : "Needs nearby water"} · ${Math.ceil(brewer.fuel)}s heat remaining · ${brewer.progress.toFixed(1)} / 6s brewed</p><details class="brew-recipes"><summary>Infusion recipes</summary>${recipes}<p>Drink with right-click. Bitter infusion causes poison. All recipes return an empty flask when drunk.</p></details><div class="section-label">YOUR INVENTORY <span>${cursor}</span></div><div class="slots">${inv.slots.map((stack, index) => slot(stack, index)).join("")}</div>`,
  );
}
