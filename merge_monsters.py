"""
Monster Merger Script
Converts monsters from /monsters/*.json to main monsters.json format
"""

import json
import os
from datetime import date

def convert_monster(monster, index):
    """Convert monster from source format to vault format"""
    
    # Format AC
    ac = monster.get('ac', 9)
    aac = monster.get('aac', 10)
    ac_str = f"{ac} [{aac}]"
    
    # Format attacks
    attacks_list = monster.get('attacks', [])
    attacks_parts = []
    for atk in attacks_list:
        count = atk.get('count', 1)
        name = atk.get('name', 'attack')
        damage = atk.get('damage', '1d6')
        special = atk.get('special', '')
        
        if count > 1:
            atk_str = f"{count} × {name} ({damage})"
        else:
            atk_str = f"1 × {name} ({damage})"
        
        if special:
            atk_str += f" + {special}"
        
        attacks_parts.append(atk_str)
    
    attacks_str = " or ".join(attacks_parts) if attacks_parts else "1 × attack (1d6)"
    
    # Format movement
    mv = monster.get('mv', {})
    base_mv = mv.get('base', 120) if isinstance(mv, dict) else 120
    enc_mv = mv.get('encounter', 40) if isinstance(mv, dict) else 40
    movement_str = f"{base_mv}' ({enc_mv}')"
    
    # Add special movement
    if isinstance(mv, dict):
        if mv.get('fly'):
            movement_str += f", fly {mv['fly']}' ({mv['fly']//3}')"
        if mv.get('burrow'):
            movement_str += f", burrow {mv['burrow']}'"
        if mv.get('swim'):
            movement_str += f", swim {mv['swim']}'"
    
    # Format saves
    saves = monster.get('saves', {})
    save_as = monster.get('save_as', monster.get('hd', '1'))
    if isinstance(saves, dict):
        saves_str = f"D{saves.get('D', 14)} W{saves.get('W', 15)} P{saves.get('P', 16)} B{saves.get('B', 17)} S{saves.get('S', 18)} ({save_as})"
    else:
        saves_str = f"{saves}"
    
    # Format THAC0
    thac0 = monster.get('thac0', 19)
    attack_bonus = monster.get('attack_bonus', 0)
    thac0_str = f"{thac0} [+{attack_bonus}]"
    
    # Format number appearing
    na = monster.get('number_appearing', {})
    if isinstance(na, dict):
        dungeon = na.get('dungeon', '1d6')
        lair = na.get('lair', '1d6')
        na_str = f"{dungeon} ({lair})"
    else:
        na_str = str(na)
    
    # Format special abilities
    special = monster.get('special', [])
    special_str = "\n".join([f"▶ {s}" for s in special]) if special else ""
    
    # Generate stat line
    hd = monster.get('hd', '1')
    hp = monster.get('hp_avg', 4)
    morale = monster.get('morale', 7)
    alignment = monster.get('alignment', 'Neutral')
    xp = monster.get('xp', 10)
    tt = monster.get('treasure_type', 'None')
    
    stat_line = f"AC {ac_str}, HD {hd} ({hp}hp), Att {attacks_str}, THAC0 {thac0_str}, MV {movement_str}, SV {saves_str}, ML {morale}, AL {alignment}, XP {xp}, NA {na_str}, TT {tt}"
    
    # Generate paste block
    name = monster.get('name', 'Unknown')
    description = monster.get('description', '')
    paste_block = f"**{name}**\n\n{description}\n\n{stat_line}"
    if special_str:
        paste_block += f"\n\n{special_str}"
    
    # Build converted monster
    return {
        "id": f"monster-{index:04d}",
        "name": name,
        "description": description,
        "ac": ac_str,
        "hd": str(hd),
        "hp": str(hp),
        "attacks": attacks_str,
        "thac0": thac0_str,
        "movement": movement_str,
        "saves": saves_str,
        "morale": str(morale),
        "alignment": alignment,
        "xp": str(xp),
        "number_appearing": na_str,
        "treasure_type": tt,
        "special_abilities": special_str,
        "stat_line": stat_line,
        "created_on": str(date.today()),
        "source": "OSE",
        "tags": monster.get('tags', []),
        "paste_block": paste_block
    }

def main():
    monsters_dir = os.path.join(os.path.dirname(__file__), 'monsters')
    output_file = os.path.join(os.path.dirname(__file__), 'monsters.json')
    
    # Load existing monsters
    existing = []
    if os.path.exists(output_file):
        with open(output_file, 'r', encoding='utf-8') as f:
            existing = json.load(f)
    
    # Get existing names to avoid duplicates
    existing_names = {m['name'].lower() for m in existing}
    print(f"Found {len(existing)} existing monsters")
    
    # Find next ID
    max_id = 0
    for m in existing:
        try:
            num = int(m['id'].split('-')[1])
            max_id = max(max_id, num)
        except:
            pass
    
    next_id = max_id + 1
    new_count = 0
    
    # Process all monster files
    for filename in sorted(os.listdir(monsters_dir)):
        if not filename.endswith('.json'):
            continue
        
        filepath = os.path.join(monsters_dir, filename)
        print(f"Processing {filename}...")
        
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        monsters = data.get('monsters', [])
        
        for monster in monsters:
            name = monster.get('name', '').lower()
            if name in existing_names:
                print(f"  Skipping {monster['name']} (already exists)")
                continue
            
            converted = convert_monster(monster, next_id)
            existing.append(converted)
            existing_names.add(name)
            next_id += 1
            new_count += 1
            print(f"  Added {monster['name']}")
    
    # Sort by name
    existing.sort(key=lambda m: m['name'].lower())
    
    # Save
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(existing, f, indent=4, ensure_ascii=False)
    
    print(f"\n✅ Done! Added {new_count} new monsters. Total: {len(existing)}")

if __name__ == '__main__':
    main()
