# Gameplay controls and working examples

This is the authoritative player-control reference for Jade Harbor `v1.0.0`.

## Controls

| Input | Action |
|---|---|
| `W A S D` | Move |
| Mouse | Look |
| `Space` | Jump / swim up |
| `Shift` | Sprint |
| `C` / `Ctrl` | Crouch / fly down |
| Double `Space` / `G` | Toggle Creative flight |
| Left click | Mine / attack |
| Right click / `F` | Place / use / interact |
| `E` | Inventory |
| `1–9` / mouse wheel | Hotbar selection |
| `Q` | Drop selected item |
| `Esc` | Pause / close current panel |
| `F3` | Performance details |

Right-click workstations, merchants, beds, and doors. Hold `C`/`Ctrl` to place against an interactive block. Inventory and workstation panels do not pause the world; `Esc` opens the pause flow.

Filled buckets place into an empty neighboring cell. Empty buckets collect only level-zero source water/lava. Creative keeps the filled bucket when placing; Survival returns an empty bucket.

## Automatic kiln

Build in a safe courtyard. Y may be any safe height; the example below starts at Y=1. Hopper facing is configured through each hopper's right-click panel.

| Coordinate | Block / action |
|---|---|
| (0,4,0) | Chest containing iron ore |
| (0,3,0) | Hopper facing Down |
| (0,2,0) | Kiln |
| (−1,3,0) | Chest containing coal |
| (−1,2,0) | Hopper facing East, into kiln fuel slot |
| (0,1,0) | Hopper facing East |
| (1,1,0) | Output chest |

The top hopper feeds kiln input; the side hopper feeds fuel; the bottom hopper extracts only finished output. Transfers stop on full destinations or unloaded columns. Put an active switch or powered wire beside a hopper to pause it. Drops above a hopper are collected when there is room. Machinery is active within the configured simulation radius; there is no offline processing.

## Timer and gate

Place Festival timer → Qi wire → Jade lamp in a line. A newly placed timer is enabled and changes output once per second. Right-click it to stop/start. The simulation clock persists.

Replace the timer with a pressure plate and the lamp with a two-block courtyard door to create an entry gate. Step onto and off the plate; both door halves follow its signal. Wires carry 0–15 power with distance decay and use a bounded propagation queue.

## Inscriptions and apothecary

Mine coal/jade, collect kiln output, or defeat a spirit to earn XP. Craft an inscription table at a workbench. Tool/armor selection uses the nine hotbar slots. Each choice shows its actual cost and effect. Silk and Fortune cannot coexist. Repair uses two XP and one unit of the tool's material, or the armor's material.

A kettle needs one glass flask, one ingredient, bamboo heat, and water within four horizontal blocks and one vertical block. One bamboo gives 12 seconds of heat; each infusion needs six active seconds. Output stacks to 16; blocked output does not consume ingredients. Removing water pauses work. A recipe change resets progress. Pausing the game stops processing; closing the panel does not.

| Ingredient | Infusion / actual effect |
|---|---|
| Dumpling | Heal 6 health immediately, capped at 20 |
| Tea leaves | Speed: +25% walking speed for 60 active seconds |
| Jade shard | Regenerate 1 health every 2 seconds for 40 seconds |
| Basalt | Fire/lava immunity for 60 seconds |
| Gold ingot | +3 melee damage for 60 seconds |
| Blossom leaves | Night vision lighting for 90 seconds |
| Coal | Poison: 1 damage every 2 seconds for 15 seconds, never below 1 health |

Effects of the same type refresh duration and do not stack in strength. Death clears effects. Inventory and equipment retain inscriptions across chest moves, drops, and save/reload.
