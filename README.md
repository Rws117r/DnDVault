# 🏰 D&D Vault

A Python CLI application for managing magic items, monsters, characters, shops, and quests for your Dolmenwood OSE campaign.

## 📊 Current Vault Contents

| Category | Count | Description |
|----------|-------|-------------|
| **Items** | 78 | Magic items, consumables, gear, pipes, brews |
| **Monsters** | 6 | OSE stat block format |
| **Characters** | 26 | Party members, NPCs, factions |
| **Shops** | 7 | Locations with inventories |
| **Quests** | 14 | Main quest, core quests, side quests |

---

## 🚀 Getting Started

```bash
python dnd_vault.py
```

### Main Menu Options
1. Add Item
2. Add Monster (OSE format)
3. Add Shop
4. Add Character
5. Browse Items
6. Browse Monsters
7. Browse Shops
8. Browse Characters
9. Search Items
10. Search Monsters
11. Browse Quests
12. Search Quests
13. Search Shops
14. Search Characters

---

## 📁 Data Files

| File | Purpose |
|------|---------|
| `items.json` | Magic items, consumables, adventuring gear |
| `monsters.json` | Monsters in OSE stat block format |
| `characters.json` | Party members, NPCs, factions |
| `shops.json` | Locations with inventories |
| `quests.json` | Quest tracking and objectives |

---

## 🎭 Party Members

| Name | Class | Key Item |
|------|-------|----------|
| **Beiric** | Half-elf Fighter | Cain's Pulpit, River Serpent Bowl pipe |
| **Ninuel** | Cleric | White Flame Mark, Lantern-Soul Pipe |
| **Enmog** | Gnome | Emberbloom Igniter (stolen!), Ivory Drinking Horn |

---

## 🗡️ Notable Magic Items

### Party Equipment
- **Cain's Pulpit** — Soul-extracting scepter (Beiric)
- **White Flame Mark of Saint Meiylu** — Purification mark (Ninuel)
- **Megwynne's Emberbloom Igniter** — Fire-sprite lighter, Hag detection (Enmog)
- **The River Serpent Bowl** — 5-power enchanted pipe (Beiric)
- **Ivory Drinking Horn** — +1 CHA after drinking (Enmog)

### Quest Items
- **Weeping Feather Core** — Core of Grief (extracted)
- **Ruby Amulet of Azelach** — Invokes the Debt-Binder
- **The Woodcutter's Poniard** — Ceremonial dagger (in Hag's Hut)

---

## 🏪 Shops & Locations

### Stump & Poniard Tavern
**Owner:** Jock Furngle  
**Features:**
- 8 growler brews (Black Goat Porter, Drowned Pony Stout, etc.)
- 9 oddments (Lantern Oil, Lucky Knots, etc.)
- Secret: Cutter's Lantern-Shield (if Jock likes you)

### Marrowbold's Smoke Shop
**Owner:** Megwynne Marrowbold  
**Features:**
- 15 enchanted pipes (100 gp each)
- Rare pipeleafs (Wandering Mossleaf, Wanton Wisp)
- Pipeleaf sampler (1d6 random effects)
- Beiric has special relationship (+2 reaction, free samples)

### Other Locations
- Church of St. Foggarty (Father Horsely)
- Flotsam Pools (Tekwell Onehorn)
- Bragwen Hoad's Hut (witch potions)
- Tower of Frost (Lady Misthraine)
- The Lunch Arch (spirit shrine)

---

## 📜 Quest Arcs

### Main Quest: The Five Cores of Suffering
The Hag wants all 5 Cores to breach a faerie gate.

| Core | Emotion | Status |
|------|---------|--------|
| Weeping Feather | Grief | ✅ Complete (Zoemina) |
| Burning Brand | Rage | ❌ Not Started |
| Hollow Mask | Fear | ❌ Not Started |
| Gilded Chain | Desire | ❌ Not Started |
| Fading Light | Hope | ❌ Not Started |

### ⏰ URGENT: The Ruby Contract
Enmog owes Azelach a soul within **one lunar cycle** or both he AND Ninuel join the Choir!

### Active Side Quests
- **The Hag's Bargain** — Pluck 3 raven feathers
- **The Stolen Poniard** — Return dagger to Jock
- **The Lantern-House Crypt** — Investigate for Father Horsely
- **Drive Out the Hag** — Complicated...

---

## 👹 Monsters (OSE Format)

| Monster | HD | AC | Special |
|---------|----|----|---------|
| Banshee | 7* | 0 [19] | Wail of death |
| Thoul | 3** | 6 [13] | Paralysis, regeneration |
| Funeral Choir Mourner | 2* | 5 [14] | Name chanting |
| Lantern-Bearer | 4* | 4 [15] | Riddles, fire vulnerable |
| Giant Leech | 2 | 7 [12] | Blood drain |
| Reedwalker | 1+1 | 6 [13] | Magpie thieves, serve Hag |

---

## 🎭 Key NPCs

### Antagonists
- **The Hag of Hag's Addle** — Main villain, wants the Cores
- **Azelach, the Debt-Binder** — Deity of cosmic debts
- **The Queen of Blackbirds** — Rival faerie power

### Allies & Contacts
- **Jock Furngle** — Stump & Poniard owner
- **Megwynne Marrowbold** — Smoke shop owner
- **Father Jymes Horsely** — Vicar of St. Foggarty
- **Thirlirgwe** — Zoemina's lover (Queen's mark)
- **Zoemina** — Former Grief Core host

### Factions
- **The Sawtooth Boys** — Teen bandits (Hex 1008)
- **Old Brackenhole Camp** — Smugglers (Hex 1208)
- **The Ragpickers** — Scavengers (Hex 1108)

---

## 🎒 OSE Adventuring Gear Reference

Quick price list for standard gear:

| Item | Price | Item | Price |
|------|-------|------|-------|
| Backpack | 5 gp | Rope (50') | 1 gp |
| Crowbar | 10 gp | Torches (6) | 1 gp |
| Grappling Hook | 25 gp | Lantern | 10 gp |
| Holy Water | 25 gp | Oil Flask | 2 gp |
| Iron Spikes (12) | 1 gp | Thieves' Tools | 25 gp |
| Rations (Iron, 7d) | 15 gp | Stakes & Mallet | 3 gp |

---

## 🔍 Search Tips

The CLI supports searching by:
- Name (partial match)
- Tags
- Category

Example searches:
- `pipe` — All pipes and pipeleaf
- `enmog` — All Enmog's items
- `ose` — OSE adventuring gear
- `faction` — All faction entries
- `hag` — Everything related to the Hag

---

## 📝 Data Structure Examples

### Item Format
```json
{
    "id": "item-0001",
    "name": "Item Name",
    "category": "Wondrous Item",
    "rarity": "Uncommon",
    "description": "Full description...",
    "rules": "Mechanical effects...",
    "tags": ["tag1", "tag2"],
    "paste_block": "Quick reference text"
}
```

### Monster Format (OSE)
```json
{
    "id": "monster-0001",
    "name": "Monster Name",
    "ac": "5 [14]",
    "hd": "3*",
    "hp": "13",
    "attacks": "1 × claw (1d6)",
    "thac0": "17 [+2]",
    "movement": "120' (40')",
    "saves": "D12 W13 P14 B15 S16 (3)",
    "morale": "9",
    "alignment": "Chaotic",
    "xp": "50",
    "special_abilities": "▶ Ability: Description..."
}
```

---

## 🎲 Session Notes Integration

This vault was built from actual play sessions in Dolmenwood. Key events captured:
- Extraction of the Grief Core from Zoemina
- The Ruby Contract with Azelach
- The Stolen Poniard quest
- Discovery of the Hag's Hut
- Gifts from Megwynne's Smoke Shop

---

## 📅 Created
December 2025

## 🎮 System
Old-School Essentials (OSE) / Dolmenwood
