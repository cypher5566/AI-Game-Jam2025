#!/usr/bin/env python3
"""
檢查 Nano Banana AI 是否真的在生成圖片
"""
import sys
import json
import base64
from PIL import Image
import io

def check_generation(upload_id):
    import urllib.request

    # 獲取處理結果
    url = f"http://localhost:8000/api/v1/pokemon/process/{upload_id}"
    with urllib.request.urlopen(url) as response:
        data = json.loads(response.read())

    if data['status'] != 'completed':
        print(f"Status: {data['status']}")
        return

    # 提取前後兩張圖片
    front_b64 = data['data']['front_image'].split(',')[1]
    back_b64 = data['data']['back_image'].split(',')[1]

    # 解碼
    front_bytes = base64.b64decode(front_b64)
    back_bytes = base64.b64decode(back_b64)

    # 儲存到檔案
    with open('/tmp/front_test.png', 'wb') as f:
        f.write(front_bytes)
    with open('/tmp/back_test.png', 'wb') as f:
        f.write(back_bytes)

    # 載入圖片
    front_img = Image.open(io.BytesIO(front_bytes))
    back_img = Image.open(io.BytesIO(back_bytes))

    # 檢查是否為鏡像
    front_flipped = front_img.transpose(Image.Transpose.FLIP_LEFT_RIGHT)

    # 比較像素
    is_mirror = list(front_flipped.getdata()) == list(back_img.getdata())

    print("="*60)
    print("Nano Banana AI 生成測試結果")
    print("="*60)
    print(f"Status: {data['status']}")
    print(f"Type: {data['data']['type']} ({data['data']['type_chinese']})")
    print(f"Front size: {front_img.size}")
    print(f"Back size: {back_img.size}")
    print(f"Front file size: {len(front_bytes)} bytes")
    print(f"Back file size: {len(back_bytes)} bytes")
    print("-"*60)
    print(f"Is Mirror (Fallback): {is_mirror}")
    print(f"Is AI Generated: {not is_mirror}")
    print("="*60)

    if is_mirror:
        print("\n⚠️  結論：使用 Fallback 機制（鏡像翻轉）")
        print("   Nano Banana 沒有生成圖片，可能原因：")
        print("   1. Billing 尚未生效（需要等待）")
        print("   2. API 配額問題")
        print("   3. API key 權限問題")
    else:
        print("\n✅ 結論：使用 AI 生成（Nano Banana 運作正常！）")
        print(f"   費用：約 $0.039 美金")

    print(f"\n圖片已儲存到：")
    print(f"  - /tmp/front_test.png")
    print(f"  - /tmp/back_test.png")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        upload_id = sys.argv[1]
    else:
        # 從檔案讀取
        with open('/tmp/upload_id.txt') as f:
            upload_id = f.read().strip()

    check_generation(upload_id)
