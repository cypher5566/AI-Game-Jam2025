"""
匯入技能資料到 Supabase

使用方式:
    python scripts/import_skills.py

前置條件:
    1. 已在 Supabase 執行 migrations/002_skills_table.sql
    2. CSV 檔案位於 data/pokemon_moves.csv
    3. .env 已正確配置 Supabase 連線資訊
"""

import csv
import os
import sys
from pathlib import Path

# 加入 app 目錄到 path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database import get_service_db
from app.config import settings


# 屬性對照表（中文 → 英文）
TYPE_MAP = {
    '一般': 'normal',
    '火': 'fire',
    '水': 'water',
    '草': 'grass',
    '電': 'electric',
    '冰': 'ice',
    '格鬥': 'fighting',
    '毒': 'poison',
    '地面': 'ground',
    '飛行': 'flying',
    '超能力': 'psychic',
    '蟲': 'bug',
    '岩石': 'rock',
    '幽靈': 'ghost',
    '龍': 'dragon',
    '惡': 'dark',
    '鋼': 'steel',
    '妖精': 'fairy'
}


def parse_power(power_str):
    """解析威力值"""
    try:
        if power_str in ['—', '-', '', 'None', None]:
            return 0
        return int(power_str)
    except (ValueError, TypeError):
        return 0


def parse_int(value):
    """解析整數"""
    try:
        if value in ['—', '-', '', 'None', None]:
            return 0
        return int(value)
    except (ValueError, TypeError):
        return 0


def import_skills():
    """匯入技能資料"""
    csv_path = 'data/Pokemon-skillsets.csv'

    if not os.path.exists(csv_path):
        print(f"❌ 找不到 CSV 檔案: {csv_path}")
        print("請確認 CSV 檔案已放置在 data/ 資料夾中")
        return

    print(f"📖 讀取 CSV: {csv_path}")

    # 讀取 CSV
    skills_data = []
    used_numbers = set()
    next_available_number = 10000  # 為無效編號的技能從 10000 開始分配

    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # 轉換資料
            type_zh = row.get('屬性', '')
            type_en = TYPE_MAP.get(type_zh, 'normal')

            # 解析技能編號
            skill_num = parse_int(row.get('編號'))

            # 如果編號為 0 或已使用，分配新編號
            if skill_num == 0 or skill_num in used_numbers:
                skill_num = next_available_number
                next_available_number += 1

            used_numbers.add(skill_num)

            skill = {
                'skill_number': skill_num,
                'name_zh': row.get('中文名', ''),
                'name_ja': row.get('日文名', ''),
                'name_en': row.get('英文名', ''),
                'type': type_en,
                'type_zh': type_zh,
                'category': row.get('分類', ''),
                'power': parse_power(row.get('威力')),
                'accuracy': parse_int(row.get('命中')) or 100,
                'pp': parse_int(row.get('ＰＰ') or row.get('PP')),
                'description': row.get('說明', '')
            }

            skills_data.append(skill)

    print(f"✅ 讀取到 {len(skills_data)} 個技能")

    # 連接 Supabase
    print("🔗 連接 Supabase...")
    db = get_service_db()

    # 清空現有資料
    print("🗑️  清空現有技能資料...")
    db.table('skills').delete().neq('id', 0).execute()

    # 批次插入（每次 100 個）
    batch_size = 100
    total_inserted = 0

    for i in range(0, len(skills_data), batch_size):
        batch = skills_data[i:i+batch_size]

        try:
            result = db.table('skills').insert(batch).execute()
            total_inserted += len(batch)
            print(f"✅ 已匯入 {total_inserted}/{len(skills_data)} 個技能")
        except Exception as e:
            print(f"❌ 批次 {i//batch_size + 1} 匯入失敗: {e}")
            # 繼續下一批

    print(f"\n🎉 匯入完成！總共匯入 {total_inserted} 個技能")

    # 驗證
    count_result = db.table('skills').select('id', count='exact').execute()
    db_count = count_result.count if hasattr(count_result, 'count') else len(count_result.data)
    print(f"📊 資料庫中現有技能數量: {db_count}")

    # 顯示各屬性技能數量
    print("\n📈 各屬性技能分布:")
    for type_en, type_zh in TYPE_MAP.items():
        type_skills = [s for s in skills_data if s['type'] == type_zh]
        if type_skills:
            # 只統計有威力的技能（攻擊技能）
            attack_skills = [s for s in type_skills if s['power'] > 0]
            print(f"  {type_zh} ({type_en}): {len(attack_skills)} 個攻擊技能 / {len(type_skills)} 個總技能")


if __name__ == '__main__':
    print("=" * 60)
    print("🎮 GenPoke - 技能資料匯入工具")
    print("=" * 60)
    print()

    try:
        import_skills()
    except Exception as e:
        print(f"\n❌ 匯入失敗: {e}")
        import traceback
        traceback.print_exc()

    print("\n" + "=" * 60)
