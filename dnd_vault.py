import json
import os
import datetime
import textwrap

ITEMS_PATH = "items.json"
MONSTERS_PATH = "monsters.json"
SHOPS_PATH = "shops.json"
CHARACTERS_PATH = "characters.json"
QUESTS_PATH = "quests.json"


# ---------- DB LAYER ----------

def load_list(path):
    if not os.path.exists(path):
        return []
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_list(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def load_items():
    return load_list(ITEMS_PATH)


def save_items(items):
    save_list(ITEMS_PATH, items)


def load_monsters():
    return load_list(MONSTERS_PATH)


def save_monsters(monsters):
    save_list(MONSTERS_PATH, monsters)


def load_shops():
    return load_list(SHOPS_PATH)


def save_shops(shops):
    save_list(SHOPS_PATH, shops)


def load_characters():
    return load_list(CHARACTERS_PATH)


def save_characters(characters):
    save_list(CHARACTERS_PATH, characters)


def load_quests():
    return load_list(QUESTS_PATH)


def save_quests(quests):
    save_list(QUESTS_PATH, quests)


def next_id(entries, prefix):
    if not entries:
        return f"{prefix}0001"
    nums = []
    for entry in entries:
        try:
            nums.append(int(entry["id"].split("-")[1]))
        except Exception:
            continue
    n = max(nums) + 1 if nums else 1
    return f"{prefix}{n:04d}"


def get_item_by_id(item_id):
    """Look up an item by its ID."""
    items = load_items()
    for item in items:
        if item.get("id") == item_id:
            return item
    return None


def get_character_by_shop(shop_id):
    """Find the character who owns a shop."""
    characters = load_characters()
    for char in characters:
        if char.get("shop_id") == shop_id:
            return char
    return None


def get_shop_by_id(shop_id):
    """Look up a shop by its ID."""
    shops = load_shops()
    for shop in shops:
        if shop.get("id") == shop_id:
            return shop
    return None


# ---------- HELPERS ----------

def today_str():
    return datetime.date.today().isoformat()


def multiline_input(prompt):
    print(prompt)
    print("(Finish by entering a single line with just `.`)")
    lines = []
    while True:
        line = input()
        if line.strip() == ".":
            break
        lines.append(line)
    return "\n".join(lines).strip()


def print_banner(title):
    print("\n" + "=" * 60)
    print(title)
    print("=" * 60 + "\n")


# ---------- ADD FUNCTIONS ----------

def add_item():
    print_banner("Add New Item")
    name = input("Item name: ").strip()
    if not name:
        print("Cancelled (no name).")
        return

    category = input("Category (e.g. Weapon, Ring, Potion): ").strip()
    rarity = input("Rarity (e.g. Common, Uncommon, Rare): ").strip()
    description = multiline_input("Description / flavor text:")
    rules = multiline_input("Rules / mechanical effects:")
    tags_raw = input("Tags (comma separated): ").strip()
    tags = [t.strip() for t in tags_raw.split(",") if t.strip()]

    paste_block = f"""**{name}**

*Description*:
{description}

*Effect*:
{rules}
"""
    items = load_items()
    entry = {
        "id": next_id(items, "item-"),
        "name": name,
        "category": category,
        "rarity": rarity,
        "description": description,
        "rules": rules,
        "created_on": today_str(),
        "source": "ChatGPT",
        "tags": tags,
        "paste_block": paste_block.strip()
    }

    items.append(entry)
    save_items(items)
    print("\nSaved item with ID:", entry["id"])
    print("\nPaste block preview:\n")
    print(entry["paste_block"])
    print("\n(Copy the above into ChatGPT when you need it.)")


def add_monster():
    print_banner("Add New Monster (OSE Format)")
    name = input("Monster name: ").strip()
    if not name:
        print("Cancelled (no name).")
        return

    description = multiline_input("Description / flavor text:")
    
    print("\n--- COMBAT STATS ---")
    ac = input("AC [AAC] (e.g. '0 [19]' or '5 [14]'): ").strip()
    hd = input("HD (e.g. '7*', '3', '½'): ").strip()
    hp = input("Average HP (e.g. '31'): ").strip()
    att = input("Attacks (e.g. '1 × touch (1d8) or 1 × wail (death)'): ").strip()
    thac0 = input("THAC0 [+bonus] (e.g. '13 [+6]'): ").strip()
    mv = input("Movement (e.g. '150' (50') or '120' (40') / 180' (60') flying'): ").strip()
    
    print("\n--- SAVING THROWS ---")
    print("Format: D# W# P# B# S# (HD#)")
    print("Example: D8 W9 P10 B10 S12 (7)")
    sv = input("Saves: ").strip()
    
    print("\n--- OTHER STATS ---")
    ml = input("Morale (2-12): ").strip()
    al = input("Alignment (Lawful/Neutral/Chaotic): ").strip()
    xp = input("XP Award: ").strip()
    na = input("Number Appearing (dungeon) (lair) (e.g. '1 (1)' or '1d6 (2d6)'): ").strip()
    tt = input("Treasure Type (e.g. 'D', 'None', 'V'): ").strip()
    
    print("\n--- SPECIAL ABILITIES ---")
    special_abilities = multiline_input("Special abilities (use ▶ for each, or just list them):")
    
    tags_raw = input("Tags (comma separated): ").strip()
    tags = [t.strip() for t in tags_raw.split(",") if t.strip()]

    # Build stat line
    stat_line = f"AC {ac}, HD {hd} ({hp}hp), Att {att}, THAC0 {thac0}, MV {mv}, SV {sv}, ML {ml}, AL {al}, XP {xp}, NA {na}, TT {tt}"
    
    # Build paste block
    paste_block = f"""**{name}**

{description}

{stat_line}

{special_abilities}
"""

    monsters = load_monsters()
    entry = {
        "id": next_id(monsters, "monster-"),
        "name": name,
        "description": description,
        "ac": ac,
        "hd": hd,
        "hp": hp,
        "attacks": att,
        "thac0": thac0,
        "movement": mv,
        "saves": sv,
        "morale": ml,
        "alignment": al,
        "xp": xp,
        "number_appearing": na,
        "treasure_type": tt,
        "special_abilities": special_abilities,
        "stat_line": stat_line,
        "created_on": today_str(),
        "source": "ChatGPT",
        "tags": tags,
        "paste_block": paste_block.strip()
    }

    monsters.append(entry)
    save_monsters(monsters)
    print("\nSaved monster with ID:", entry["id"])
    print("\nPaste block preview:\n")
    print(entry["paste_block"])
    print("\n(Select this text in your terminal and copy it into ChatGPT.)")


def add_shop():
    print_banner("Add New Shop / Location")
    name = input("Shop/Location name: ").strip()
    if not name:
        print("Cancelled (no name).")
        return

    owner = input("Owner/NPC name: ").strip()
    location = input("Location (e.g. Town, Waterfront, Forest): ").strip()
    shop_type = input("Type (e.g. Tavern, Shop, Church, Location): ").strip()
    description = multiline_input("Description:")
    tags_raw = input("Tags (comma separated): ").strip()
    tags = [t.strip() for t in tags_raw.split(",") if t.strip()]

    shops = load_shops()
    entry = {
        "id": next_id(shops, "shop-"),
        "name": name,
        "owner": owner,
        "location": location,
        "type": shop_type,
        "description": description,
        "inventory": [],
        "acquired_here": [],
        "stolen_from": [],
        "quest_items": [],
        "notes": "",
        "tags": tags,
        "created_on": today_str()
    }

    shops.append(entry)
    save_shops(shops)
    print("\nSaved shop with ID:", entry["id"])
    print(f"\nYou can now edit {SHOPS_PATH} to add inventory items.")


# ---------- SEARCH / VIEW ----------

def search_entries(entries, term):
    term = term.lower()
    results = []
    for e in entries:
        haystack = " ".join([
            e.get("name", ""),
            e.get("description", ""),
            e.get("rules", ""),
            e.get("stat_block", ""),
            e.get("owner", ""),
            e.get("location", ""),
            e.get("notes", ""),
            " ".join(e.get("tags", [])),
        ]).lower()
        if term in haystack:
            results.append(e)
    return results


def choose_from_results(results, show_type=None):
    if not results:
        print("No results.")
        return None

    print("\nMatches:")
    for idx, e in enumerate(results, start=1):
        if show_type == "shop":
            owner = e.get("owner", "?")
            print(f"[{idx}] {e.get('name')}  ({e.get('type', '?')}, Owner: {owner})")
        else:
            created = e.get("created_on", "?")
            print(f"[{idx}] {e.get('name')}  (ID: {e.get('id')}, {created})")

    while True:
        choice = input("\nSelect a number to view (or Enter to cancel): ").strip()
        if not choice:
            return None
        if not choice.isdigit():
            print("Enter a valid number.")
            continue
        i = int(choice)
        if 1 <= i <= len(results):
            return results[i - 1]
        print("Out of range.")


def search_items():
    print_banner("Search Items")
    term = input("Search term (name, tag, text): ").strip()
    if not term:
        print("Cancelled.")
        return

    items = load_items()
    results = search_entries(items, term)
    entry = choose_from_results(results)
    if not entry:
        return

    print_banner(f"Item: {entry['name']}")
    print("ID:", entry["id"])
    print("Category:", entry.get("category", ""))
    print("Rarity:", entry.get("rarity", ""))
    print("Created:", entry.get("created_on", ""))
    print("Tags:", ", ".join(entry.get("tags", [])))
    print("\nPaste block:\n")
    print(entry["paste_block"])
    print("\n(Select this text in your terminal and copy it into ChatGPT.)")


def search_monsters():
    print_banner("Search Monsters")
    term = input("Search term (name, tag, text): ").strip()
    if not term:
        print("Cancelled.")
        return

    monsters = load_monsters()
    results = search_entries(monsters, term)
    entry = choose_from_results(results)
    if not entry:
        return

    print_banner(f"👹 {entry['name']}")
    print("ID:", entry["id"])
    
    # Check if it's OSE format or old format
    if entry.get("ac"):
        # OSE format
        print(f"\n{entry.get('description', '')}\n")
        print("--- STATS ---")
        print(f"AC: {entry.get('ac', '?')}")
        print(f"HD: {entry.get('hd', '?')} ({entry.get('hp', '?')}hp)")
        print(f"Attacks: {entry.get('attacks', '?')}")
        print(f"THAC0: {entry.get('thac0', '?')}")
        print(f"Movement: {entry.get('movement', '?')}")
        print(f"Saves: {entry.get('saves', '?')}")
        print(f"Morale: {entry.get('morale', '?')}")
        print(f"Alignment: {entry.get('alignment', '?')}")
        print(f"XP: {entry.get('xp', '?')}")
        print(f"Number Appearing: {entry.get('number_appearing', '?')}")
        print(f"Treasure Type: {entry.get('treasure_type', '?')}")
        
        special = entry.get('special_abilities', '')
        if special:
            print("\n--- SPECIAL ABILITIES ---")
            print(special)
    else:
        # Old format fallback
        print("Role:", entry.get("role", ""))
        print("Level / HD:", entry.get("level_or_hd", ""))
    
    print("\nTags:", ", ".join(entry.get("tags", [])))
    print("\n--- PASTE BLOCK ---\n")
    print(entry["paste_block"])
    print("\n(Select this text in your terminal and copy it into ChatGPT.)")


def display_shop(shop):
    """Display full shop details."""
    print_banner(f"🏪 {shop['name']}")
    
    # Show owner with link to character if available
    owner_char = get_character_by_shop(shop.get('id'))
    if owner_char:
        print(f"Owner: {shop.get('owner', 'Unknown')} ({owner_char['id']})")
        print(f"       → {owner_char.get('race_class', '')}")
    else:
        print(f"Owner: {shop.get('owner', 'Unknown')}")
    
    print(f"Location: {shop.get('location', 'Unknown')}")
    print(f"Type: {shop.get('type', 'Unknown')}")
    print(f"Tags: {', '.join(shop.get('tags', []))}")
    print(f"\n{shop.get('description', '')}")
    
    # Show inventory
    inventory = shop.get("inventory", [])
    if inventory:
        print("\n--- FOR SALE ---")
        for item in inventory:
            if isinstance(item, dict):
                stock = f" [{item.get('stock', '')}]" if item.get('stock') else ""
                print(f"  • {item.get('name', '?')} — {item.get('price', '?')}{stock}")
            else:
                print(f"  • {item}")
    
    # Show acquired items (linked to vault)
    acquired = shop.get("acquired_here", [])
    if acquired:
        print("\n--- ACQUIRED HERE ---")
        for item_id in acquired:
            item = get_item_by_id(item_id)
            if item:
                print(f"  ✓ {item['name']} ({item_id})")
            else:
                print(f"  • {item_id}")
    
    # Show stolen items
    stolen = shop.get("stolen_from", [])
    if stolen:
        print("\n--- STOLEN FROM HERE ---")
        for item_id in stolen:
            item = get_item_by_id(item_id)
            if item:
                print(f"  🔓 {item['name']} ({item_id})")
            else:
                print(f"  • {item_id}")
    
    # Show quest items
    quest_items = shop.get("quest_items", [])
    if quest_items:
        print("\n--- QUEST ITEMS ---")
        for item in quest_items:
            print(f"  ⭐ {item}")
    
    # Show treasure present (if any)
    treasure = shop.get("treasure_present", [])
    if treasure:
        print("\n--- TREASURE PRESENT ---")
        for item in treasure:
            print(f"  💎 {item}")
    
    # Show notes
    notes = shop.get("notes", "")
    if notes:
        print(f"\n📝 Notes: {notes}")


def browse_shops():
    """List all shops and let user pick one to view."""
    print_banner("Browse Shops & Locations")
    shops = load_shops()
    
    if not shops:
        print("No shops in the vault yet.")
        return
    
    print("All Shops/Locations:\n")
    for idx, shop in enumerate(shops, start=1):
        owner = shop.get("owner", "?")
        shop_type = shop.get("type", "?")
        print(f"[{idx}] {shop.get('name')} — {shop_type} (Owner: {owner})")
    
    while True:
        choice = input("\nSelect a number to view (or Enter to cancel): ").strip()
        if not choice:
            return
        if not choice.isdigit():
            print("Enter a valid number.")
            continue
        i = int(choice)
        if 1 <= i <= len(shops):
            display_shop(shops[i - 1])
            return
        print("Out of range.")


def search_shops():
    """Search shops by name, owner, location, or tags."""
    print_banner("Search Shops")
    term = input("Search term (name, owner, location, tag): ").strip()
    if not term:
        print("Cancelled.")
        return

    shops = load_shops()
    results = search_entries(shops, term)
    entry = choose_from_results(results, show_type="shop")
    if not entry:
        return

    display_shop(entry)


# ---------- CHARACTER FUNCTIONS ----------

def display_character(char):
    """Display full character details."""
    char_type = char.get('type', 'Character')
    print_banner(f"🎭 {char['name']}")
    print(f"Type: {char_type}")
    print(f"Race/Class: {char.get('race_class', 'Unknown')}")
    print(f"Tags: {', '.join(char.get('tags', []))}")
    
    print(f"\n--- APPEARANCE ---")
    print(char.get('appearance', 'No description.'))
    
    print(f"\n--- PERSONALITY ---")
    print(char.get('personality', 'No description.'))
    
    print(f"\n--- MOTIVATIONS ---")
    print(char.get('motivations', 'Unknown.'))
    
    special = char.get('special_notes', '')
    if special:
        print(f"\n--- SPECIAL NOTES ---")
        print(special)
    
    # Show linked shop
    shop_id = char.get('shop_id')
    if shop_id:
        shop = get_shop_by_id(shop_id)
        if shop:
            print(f"\n🏪 Owns: {shop['name']} ({shop_id})")
        else:
            print(f"\n🏪 Shop: {shop_id}")
    
    # Show related items
    related = char.get('related_items', [])
    if related:
        print(f"\n--- RELATED ITEMS ---")
        for item_id in related:
            item = get_item_by_id(item_id)
            if item:
                print(f"  • {item['name']} ({item_id})")
            else:
                print(f"  • {item_id}")


def browse_characters():
    """List all characters and let user pick one to view."""
    print_banner("Browse Characters")
    characters = load_characters()
    
    if not characters:
        print("No characters in the vault yet.")
        return
    
    # Group by type
    by_type = {}
    for char in characters:
        t = char.get('type', 'Other')
        if t not in by_type:
            by_type[t] = []
        by_type[t].append(char)
    
    idx = 1
    char_list = []
    for char_type in sorted(by_type.keys()):
        print(f"\n--- {char_type.upper()} ---")
        for char in by_type[char_type]:
            print(f"[{idx}] {char.get('name')} — {char.get('race_class', '?')}")
            char_list.append(char)
            idx += 1
    
    while True:
        choice = input("\nSelect a number to view (or Enter to cancel): ").strip()
        if not choice:
            return
        if not choice.isdigit():
            print("Enter a valid number.")
            continue
        i = int(choice)
        if 1 <= i <= len(char_list):
            display_character(char_list[i - 1])
            return
        print("Out of range.")


def search_characters():
    """Search characters by name, type, or tags."""
    print_banner("Search Characters")
    term = input("Search term (name, type, race, tag): ").strip()
    if not term:
        print("Cancelled.")
        return

    characters = load_characters()
    # Add race_class to search
    results = []
    term_lower = term.lower()
    for c in characters:
        haystack = " ".join([
            c.get("name", ""),
            c.get("type", ""),
            c.get("race_class", ""),
            c.get("appearance", ""),
            c.get("personality", ""),
            c.get("special_notes", ""),
            " ".join(c.get("tags", [])),
        ]).lower()
        if term_lower in haystack:
            results.append(c)
    
    if not results:
        print("No results.")
        return
    
    print("\nMatches:")
    for idx, c in enumerate(results, start=1):
        print(f"[{idx}] {c.get('name')} — {c.get('type', '?')} ({c.get('race_class', '?')})")
    
    while True:
        choice = input("\nSelect a number to view (or Enter to cancel): ").strip()
        if not choice:
            return
        if not choice.isdigit():
            print("Enter a valid number.")
            continue
        i = int(choice)
        if 1 <= i <= len(results):
            display_character(results[i - 1])
            return
        print("Out of range.")


def add_character():
    print_banner("Add New Character")
    name = input("Character name: ").strip()
    if not name:
        print("Cancelled (no name).")
        return

    char_type = input("Type (Party Member, Major NPC, Quest NPC, Encampment NPC, etc.): ").strip()
    race_class = input("Race/Class: ").strip()
    appearance = multiline_input("Appearance:")
    personality = multiline_input("Personality:")
    motivations = multiline_input("Motivations:")
    special = multiline_input("Special notes:")
    tags_raw = input("Tags (comma separated): ").strip()
    tags = [t.strip() for t in tags_raw.split(",") if t.strip()]
    
    shop_id_input = input("Shop ID (if they own a shop, or leave blank): ").strip()
    shop_id = shop_id_input if shop_id_input else None

    characters = load_characters()
    entry = {
        "id": next_id(characters, "char-"),
        "name": name,
        "type": char_type,
        "race_class": race_class,
        "appearance": appearance,
        "personality": personality,
        "motivations": motivations,
        "special_notes": special,
        "shop_id": shop_id,
        "quest_ids": [],
        "related_items": [],
        "tags": tags,
        "created_on": today_str()
    }

    characters.append(entry)
    save_characters(characters)
    print("\nSaved character with ID:", entry["id"])


# ---------- QUEST FUNCTIONS ----------

def get_quest_by_id(quest_id):
    """Look up a quest by its ID."""
    quests = load_quests()
    for quest in quests:
        if quest.get("id") == quest_id:
            return quest
    return None


def get_character_by_id(char_id):
    """Look up a character by its ID."""
    characters = load_characters()
    for char in characters:
        if char.get("id") == char_id:
            return char
    return None


def display_quest(quest):
    """Display full quest details with all links."""
    status_icons = {
        "Complete": "✅",
        "In Progress": "🔶",
        "Not Started": "⬜"
    }
    status = quest.get('status', 'Unknown')
    icon = status_icons.get(status, "❓")
    
    print_banner(f"📜 {quest['name']}")
    print(f"Type: {quest.get('type', 'Quest')}")
    print(f"Status: {icon} {status}")
    
    # Show parent quest if this is a sub-quest
    parent_id = quest.get('parent_quest')
    if parent_id:
        parent = get_quest_by_id(parent_id)
        if parent:
            print(f"Part of: {parent['name']}")
    
    # Show emotion/theme for core quests
    emotion = quest.get('emotion')
    if emotion:
        print(f"Emotion: {emotion}")
    
    biome = quest.get('biome')
    if biome:
        print(f"Biome: {biome}")
    
    print(f"\n{quest.get('description', '')}")
    
    # Show objectives
    objectives = quest.get('objectives', [])
    if objectives:
        print("\n--- OBJECTIVES ---")
        for obj in objectives:
            if obj.get('status') == 'complete':
                print(f"  ✅ {obj.get('text', '?')}")
            elif obj.get('status') == 'in_progress':
                print(f"  🔶 {obj.get('text', '?')}")
            else:
                print(f"  ⬜ {obj.get('text', '?')}")
            if obj.get('notes'):
                print(f"      → {obj.get('notes')}")
    
    # Show mechanics (for core quests)
    mechanics = quest.get('mechanics')
    if mechanics:
        print("\n--- MECHANICS ---")
        if mechanics.get('extraction_method'):
            print(f"  Extraction: {mechanics['extraction_method']}")
        if mechanics.get('challenge'):
            print(f"  Challenge: {mechanics['challenge']}")
        roles = mechanics.get('party_roles', {})
        if roles:
            print("  Party Roles:")
            for char, role in roles.items():
                print(f"    • {char}: {role}")
    
    # Show related characters
    related_chars = quest.get('related_characters', [])
    if related_chars:
        print("\n--- RELATED CHARACTERS ---")
        for char_id in related_chars:
            char = get_character_by_id(char_id)
            if char:
                print(f"  🎭 {char['name']} — {char.get('type', '?')}")
            else:
                print(f"  • {char_id}")
    
    # Show host (for core quests)
    host_id = quest.get('host')
    if host_id:
        host = get_character_by_id(host_id)
        if host:
            print(f"\n💔 Host: {host['name']}")
    
    # Show current holder
    holder_id = quest.get('current_holder')
    if holder_id:
        holder = get_character_by_id(holder_id)
        if holder:
            print(f"💎 Held by: {holder['name']}")
    
    # Show related items
    related_items = quest.get('related_items', [])
    if related_items:
        print("\n--- RELATED ITEMS ---")
        for item_id in related_items:
            item = get_item_by_id(item_id)
            if item:
                print(f"  • {item['name']} ({item_id})")
            else:
                print(f"  • {item_id}")
    
    # Show core item
    core_item_id = quest.get('core_item')
    if core_item_id:
        core_item = get_item_by_id(core_item_id)
        if core_item:
            print(f"\n✨ Core Item: {core_item['name']}")
    
    # Show sub-quests
    sub_quests = quest.get('sub_quests', [])
    if sub_quests:
        print("\n--- SUB-QUESTS ---")
        for sq_id in sub_quests:
            sq = get_quest_by_id(sq_id)
            if sq:
                sq_status = sq.get('status', '?')
                sq_icon = status_icons.get(sq_status, "❓")
                print(f"  {sq_icon} {sq['name']}")
            else:
                print(f"  • {sq_id}")
    
    # Show stakes
    stakes = quest.get('stakes')
    if stakes:
        print(f"\n⚠️ Stakes: {stakes}")
    
    # Show aftermath
    aftermath = quest.get('aftermath')
    if aftermath:
        print(f"\n📝 Aftermath: {aftermath}")
    
    # Show themes
    themes = quest.get('themes', [])
    if themes:
        print(f"\nThemes: {', '.join(themes)}")


def browse_quests():
    """List all quests and let user pick one to view."""
    print_banner("Browse Quests")
    quests = load_quests()
    
    if not quests:
        print("No quests in the vault yet.")
        return
    
    # Group by type
    by_type = {}
    for quest in quests:
        t = quest.get('type', 'Other')
        if t not in by_type:
            by_type[t] = []
        by_type[t].append(quest)
    
    # Order: Main Quest first, then Core Quest, then others
    type_order = ['Main Quest', 'Core Quest', 'Side Quest', 'Antagonist Arc', 'Faction Arc']
    sorted_types = sorted(by_type.keys(), key=lambda x: type_order.index(x) if x in type_order else 99)
    
    idx = 1
    quest_list = []
    status_icons = {"Complete": "✅", "In Progress": "🔶", "Not Started": "⬜"}
    
    for quest_type in sorted_types:
        print(f"\n--- {quest_type.upper()} ---")
        for quest in by_type[quest_type]:
            status = quest.get('status', '?')
            icon = status_icons.get(status, "❓")
            print(f"[{idx}] {icon} {quest.get('name')}")
            quest_list.append(quest)
            idx += 1
    
    while True:
        choice = input("\nSelect a number to view (or Enter to cancel): ").strip()
        if not choice:
            return
        if not choice.isdigit():
            print("Enter a valid number.")
            continue
        i = int(choice)
        if 1 <= i <= len(quest_list):
            display_quest(quest_list[i - 1])
            return
        print("Out of range.")


def search_quests():
    """Search quests by name, type, or tags."""
    print_banner("Search Quests")
    term = input("Search term (name, type, emotion, tag): ").strip()
    if not term:
        print("Cancelled.")
        return

    quests = load_quests()
    results = []
    term_lower = term.lower()
    for q in quests:
        haystack = " ".join([
            q.get("name", ""),
            q.get("type", ""),
            q.get("description", ""),
            q.get("emotion", ""),
            q.get("biome", ""),
            " ".join(q.get("themes", [])),
            " ".join(q.get("tags", [])),
        ]).lower()
        if term_lower in haystack:
            results.append(q)
    
    if not results:
        print("No results.")
        return
    
    status_icons = {"Complete": "✅", "In Progress": "🔶", "Not Started": "⬜"}
    print("\nMatches:")
    for idx, q in enumerate(results, start=1):
        status = q.get('status', '?')
        icon = status_icons.get(status, "❓")
        print(f"[{idx}] {icon} {q.get('name')} — {q.get('type', '?')}")
    
    while True:
        choice = input("\nSelect a number to view (or Enter to cancel): ").strip()
        if not choice:
            return
        if not choice.isdigit():
            print("Enter a valid number.")
            continue
        i = int(choice)
        if 1 <= i <= len(results):
            display_quest(results[i - 1])
            return
        print("Out of range.")


def quest_overview():
    """Show a quick overview of quest progress."""
    print_banner("📜 Quest Overview")
    quests = load_quests()
    
    if not quests:
        print("No quests in the vault yet.")
        return
    
    # Count by status
    complete = sum(1 for q in quests if q.get('status') == 'Complete')
    in_progress = sum(1 for q in quests if q.get('status') == 'In Progress')
    not_started = sum(1 for q in quests if q.get('status') == 'Not Started')
    
    print(f"✅ Complete: {complete}")
    print(f"🔶 In Progress: {in_progress}")
    print(f"⬜ Not Started: {not_started}")
    
    # Show main quest progress
    main_quest = next((q for q in quests if q.get('type') == 'Main Quest'), None)
    if main_quest:
        print(f"\n--- MAIN QUEST ---")
        print(f"{main_quest['name']}")
        objectives = main_quest.get('objectives', [])
        done = sum(1 for o in objectives if o.get('status') == 'complete')
        print(f"Progress: {done}/{len(objectives)} objectives")
        
        # Show core status
        print("\n--- CORES ---")
        for sq_id in main_quest.get('sub_quests', []):
            sq = get_quest_by_id(sq_id)
            if sq and sq.get('type') == 'Core Quest':
                emotion = sq.get('emotion', '?')
                status = sq.get('status', '?')
                status_icons = {"Complete": "✅", "In Progress": "🔶", "Not Started": "⬜"}
                icon = status_icons.get(status, "❓")
                print(f"  {icon} {emotion}: {sq['name']}")


# ---------- MAIN MENU ----------

def main_menu():
    while True:
        print_banner("D&D Vault")
        print("--- Items & Monsters ---")
        print("1) Add item")
        print("2) Add monster")
        print("3) Search items")
        print("4) Search monsters")
        print("")
        print("--- Shops & Locations ---")
        print("5) Browse shops")
        print("6) Search shops")
        print("7) Add shop")
        print("")
        print("--- Characters & NPCs ---")
        print("8) Browse characters")
        print("9) Search characters")
        print("10) Add character")
        print("")
        print("--- Quests & Story ---")
        print("11) Quest overview")
        print("12) Browse quests")
        print("13) Search quests")
        print("")
        print("0) Quit")

        choice = input("\nChoose an option: ").strip()
        if choice == "1":
            add_item()
        elif choice == "2":
            add_monster()
        elif choice == "3":
            search_items()
        elif choice == "4":
            search_monsters()
        elif choice == "5":
            browse_shops()
        elif choice == "6":
            search_shops()
        elif choice == "7":
            add_shop()
        elif choice == "8":
            browse_characters()
        elif choice == "9":
            search_characters()
        elif choice == "10":
            add_character()
        elif choice == "11":
            quest_overview()
        elif choice == "12":
            browse_quests()
        elif choice == "13":
            search_quests()
        elif choice == "0":
            print("Bye.")
            break
        else:
            print("Invalid choice.")


if __name__ == "__main__":
    main_menu()
