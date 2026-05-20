"""
心斋 · 命理规则引擎 - 神煞查询（MVP 简化版）
版本: MVP 0.1
日期: 2026-05-20

功能:
1. 常用神煞查询（桃花、驿马、华盖、天乙贵人等）
2. 神煞含义解释
3. MVP 只实现 5 个核心神煞，后续热更新

注意:
- 神煞在 MVP 阶段非核心功能
- Week 7 顾问进场后再完善
"""

from typing import List, Dict, Optional
from .bazi import TIAN_GAN, DI_ZHI, TIAN_GAN_WUXING, DI_ZHI_WUXING

# ============ 神煞数据 ============

# 桃花（咸池）
# 规则：寅午戌见卯，亥卯未见子，申子辰见酉，巳酉丑见午
TAO_HUA_MAP = {
    "寅": "卯", "午": "卯", "戌": "卯",
    "亥": "子", "卯": "子", "未": "子",
    "申": "酉", "子": "酉", "辰": "酉",
    "巳": "午", "酉": "午", "丑": "午"
}

# 驿马
# 规则：寅午戌马在申，亥卯未马在巳，申子辰马在寅，巳酉丑马在亥
YI_MA_MAP = {
    "寅": "申", "午": "申", "戌": "申",
    "亥": "巳", "卯": "巳", "未": "巳",
    "申": "寅", "子": "寅", "辰": "寅",
    "巳": "亥", "酉": "亥", "丑": "亥"
}

# 华盖
# 规则：寅午戌见戌，亥卯未见未，申子辰见辰，巳酉丑见丑
HUA_GAI_MAP = {
    "寅": "戌", "午": "戌", "戌": "戌",
    "亥": "未", "卯": "未", "未": "未",
    "申": "辰", "子": "辰", "辰": "辰",
    "巳": "丑", "酉": "丑", "丑": "丑"
}

# 天乙贵人
# 规则：甲戊庚牛羊，乙己鼠猴乡，丙丁猪鸡位，壬癸兔蛇藏，六辛逢马虎
TIAN_YI_GUI_REN = {
    "甲": ["丑", "未"],
    "戊": ["丑", "未"],
    "庚": ["丑", "未"],
    "乙": ["子", "申"],
    "己": ["子", "申"],
    "丙": ["亥", "酉"],
    "丁": ["亥", "酉"],
    "壬": ["卯", "巳"],
    "癸": ["卯", "巳"],
    "辛": ["寅", "午"]
}

# 文昌贵人
# 规则：甲见巳，乙见午，丙戊见申，丁己见酉，庚见亥，辛见子，壬见寅，癸见卯
WEN_CHANG = {
    "甲": "巳", "乙": "午", "丙": "申", "丁": "酉",
    "戊": "申", "己": "酉", "庚": "亥", "辛": "子",
    "壬": "寅", "癸": "卯"
}

# 神煞含义解释
SHEN_SHA_DESC = {
    "桃花": {
        "good": "人缘好，异性缘强，外貌出众",
        "bad": "感情复杂，易有烂桃花"
    },
    "驿马": {
        "good": "走动多，适合外地发展，行动力强",
        "bad": "漂泊不定，静不下来"
    },
    "华盖": {
        "good": "聪明好学，艺术天赋，孤独美",
        "bad": "性格孤僻，不合群"
    },
    "天乙贵人": {
        "good": "有贵人相助，逢凶化吉",
        "bad": "无明显负面影响"
    },
    "文昌": {
        "good": "聪明好学，文采出众，适合学术",
        "bad": "无明显负面影响"
    }
}

# ============ 核心类 ============

class ShenShaAnalyzer:
    """神煞分析器（MVP 简化版）"""
    
    def __init__(self):
        self.shensha_list = []
    
    def check_all(
        self,
        year_zhi: str,
        month_zhi: str,
        day_zhi: str,
        hour_zhi: str,
        day_master: str
    ) -> List[Dict]:
        """
        检查所有神煞（MVP 版只检查 5 个核心）
        
        Args:
            year_zhi: 年支
            month_zhi: 月支
            day_zhi: 日支
            hour_zhi: 时支
            day_master: 日主天干
        
        Returns:
            results: [{"name": "桃花", "position": "年柱", "description": "..."}, ...]
        """
        results = []
        zhi_list = [year_zhi, month_zhi, day_zhi, hour_zhi]
        position_names = ["年柱", "月柱", "日柱", "时柱"]
        
        # 1. 检查桃花
        for i, zhi in enumerate(zhi_list):
            tao_hua_zhi = TAO_HUA_MAP.get(zhi)
            if tao_hua_zhi and tao_hua_zhi in zhi_list:
                results.append({
                    "name": "桃花",
                    "position": position_names[i],
                    "branch": tao_hua_zhi,
                    "description": SHEN_SHA_DESC["桃花"]["good"],
                    "warning": SHEN_SHA_DESC["桃花"]["bad"]
                })
        
        # 2. 检查驿马
        for i, zhi in enumerate(zhi_list):
            yi_ma_zhi = YI_MA_MAP.get(zhi)
            if yi_ma_zhi and yi_ma_zhi in zhi_list:
                results.append({
                    "name": "驿马",
                    "position": position_names[i],
                    "branch": yi_ma_zhi,
                    "description": SHEN_SHA_DESC["驿马"]["good"],
                    "warning": SHEN_SHA_DESC["驿马"]["bad"]
                })
        
        # 3. 检查华盖
        for i, zhi in enumerate(zhi_list):
            hua_gai_zhi = HUA_GAI_MAP.get(zhi)
            if hua_gai_zhi and hua_gai_zhi in zhi_list:
                results.append({
                    "name": "华盖",
                    "position": position_names[i],
                    "branch": hua_gai_zhi,
                    "description": SHEN_SHA_DESC["华盖"]["good"],
                    "warning": SHEN_SHA_DESC["华盖"]["bad"]
                })
        
        # 4. 检查天乙贵人
        gui_ren_zhi_list = TIAN_YI_GUI_REN.get(day_master, [])
        for i, zhi in enumerate(zhi_list):
            if zhi in gui_ren_zhi_list:
                results.append({
                    "name": "天乙贵人",
                    "position": position_names[i],
                    "branch": zhi,
                    "description": SHEN_SHA_DESC["天乙贵人"]["good"],
                    "warning": None
                })
        
        # 5. 检查文昌
        wen_chang_zhi = WEN_CHANG.get(day_master)
        if wen_chang_zhi and wen_chang_zhi in zhi_list:
            idx = zhi_list.index(wen_chang_zhi)
            results.append({
                "name": "文昌",
                "position": position_names[idx],
                "branch": wen_chang_zhi,
                "description": SHEN_SHA_DESC["文昌"]["good"],
                "warning": None
            })
        
        return results
    
    def to_reason_chain(self, shensha_list: List[Dict]) -> List[Dict]:
        """
        将神煞结果转换为因果链格式（用于统一输出）
        
        MVP 简化：神煞暂不接入因果链，只返回结果
        Week 7 后再完善
        """
        return []

# ============ 测试 ============

if __name__ == "__main__":
    print("✅ 神煞查询模块加载成功")
    print("\nMVP 版支持的神煞（5 个）：")
    print("  1. 桃花（咸池）- 人缘异性缘")
    print("  2. 驿马 - 走动迁移")
    print("  3. 华盖 - 艺术天赋")
    print("  4. 天乙贵人 - 贵人相助")
    print("  5. 文昌 - 学业文采")
    
    # 测试
    analyzer = ShenShaAnalyzer()
    # 示例：甲木日主，年支寅，月支午，日支戌，时支申
    results = analyzer.check_all("寅", "午", "戌", "申", "甲")
    
    print("\n测试用例（甲木，寅午戌申）：")
    if results:
        for r in results:
            print(f"  - {r['name']} 在 {r['position']}（{r['branch']}）")
            print(f"    含义: {r['description']}")
    else:
        print("  未查出神煞")
    
    print("\n⚠️  注意：神煞功能在 MVP 阶段非核心")
    print("    Week 7 顾问进场后再完善")
