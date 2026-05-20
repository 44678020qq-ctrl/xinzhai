"""
心斋 · 命理规则引擎 - 八字排盘核心
版本: MVP 0.1
日期: 2026-05-20

功能:
1. 天干地支基础数据
2. 公历 → 八字排盘
3. 日主旺衰判断（带因果链）
4. 五行分析（带因果链）
"""

from typing import List, Dict, Tuple, Optional
from datetime import datetime, timedelta
import json

# ============ 基础数据 ============

# 天干
TIAN_GAN = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"]
TIAN_GAN_WUXING = {
    "甲": "wood", "乙": "wood",
    "丙": "fire", "丁": "fire",
    "戊": "earth", "己": "earth",
    "庚": "metal", "辛": "metal",
    "壬": "water", "癸": "water"
}

# 地支
DI_ZHI = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"]
DI_ZHI_WUXING = {
    "子": "water", "丑": "earth", "寅": "wood", "卯": "wood",
    "辰": "earth", "巳": "fire", "午": "fire", "未": "earth",
    "申": "metal", "酉": "metal", "戌": "earth", "亥": "water"
}
DI_ZHI_CANG_GAN = {
    "子": [("癸", "water")],
    "丑": [("己", "earth"), ("癸", "water"), ("辛", "metal")],
    "寅": [("甲", "wood"), ("丙", "fire"), ("戊", "earth")],
    "卯": [("乙", "wood")],
    "辰": [("戊", "earth"), ("乙", "wood"), ("癸", "water")],
    "巳": [("丙", "fire"), ("庚", "metal"), ("戊", "earth")],
    "午": [("丁", "fire"), ("己", "earth")],
    "未": [("己", "earth"), ("丁", "fire"), ("乙", "wood")],
    "申": [("庚", "metal"), ("壬", "water"), ("戊", "earth")],
    "酉": [("辛", "metal")],
    "戌": [("戊", "earth"), ("辛", "metal"), ("丁", "fire")],
    "亥": [("壬", "water"), ("甲", "wood")]
}

# 十神对应表（日主五行 → 其他五行）
TEN_GOD_MAP = {
    "wood": {
        "wood": ["比肩", "劫财"],
        "fire": ["食神", "伤官"],
        "earth": ["正财", "偏财"],
        "metal": ["正官", "七杀"],
        "water": ["正印", "偏印"]
    },
    "fire": {
        "wood": ["正印", "偏印"],
        "fire": ["比肩", "劫财"],
        "earth": ["食神", "伤官"],
        "metal": ["正财", "偏财"],
        "water": ["正官", "七杀"]
    },
    "earth": {
        "wood": ["正官", "七杀"],
        "fire": ["正印", "偏印"],
        "earth": ["比肩", "劫财"],
        "metal": ["食神", "伤官"],
        "water": ["正财", "偏财"]
    },
    "metal": {
        "wood": ["正财", "偏财"],
        "fire": ["正官", "七杀"],
        "earth": ["正印", "偏印"],
        "metal": ["比肩", "劫财"],
        "water": ["食神", "伤官"]
    },
    "water": {
        "wood": ["伤官", "食神"],
        "fire": ["正财", "偏财"],
        "earth": ["正官", "七杀"],
        "metal": ["正印", "偏印"],
        "water": ["比肩", "劫财"]
    }
}

# 月令旺相休囚死
MONTH_STRENGTH = {
    "寅": {"wood": "旺", "fire": "相", "water": "休", "metal": "囚", "earth": "死"},
    "卯": {"wood": "旺", "fire": "相", "water": "休", "metal": "囚", "earth": "死"},
    "辰": {"wood": "相", "fire": "旺", "water": "休", "metal": "死", "earth": "囚"},
    "巳": {"wood": "休", "fire": "旺", "water": "囚", "metal": "死", "earth": "相"},
    "午": {"wood": "休", "fire": "旺", "water": "囚", "metal": "死", "earth": "相"},
    "未": {"wood": "囚", "fire": "旺", "water": "死", "metal": "相", "earth": "休"},
    "申": {"wood": "死", "fire": "囚", "water": "相", "metal": "旺", "earth": "休"},
    "酉": {"wood": "死", "fire": "囚", "water": "相", "metal": "旺", "earth": "休"},
    "戌": {"wood": "囚", "fire": "相", "water": "死", "metal": "旺", "earth": "休"},
    "亥": {"wood": "相", "fire": "死", "water": "旺", "metal": "休", "earth": "囚"},
    "子": {"wood": "相", "fire": "死", "water": "旺", "metal": "休", "earth": "囚"},
    "丑": {"wood": "囚", "fire": "死", "water": "旺", "metal": "相", "earth": "休"}
}

# ============ 工具函数 ============

def get_ten_god(day_master: str, other_gan: str) -> str:
    """
    计算十神关系
    day_master: 日主天干（如 "甲"）
    other_gan: 其他天干（如 "丙"）
    return: 十神名称（如 "食神"）
    """
    dm_wuxing = TIAN_GAN_WUXING[day_master]
    og_wuxing = TIAN_GAN_WUXING[other_gan]
    
    # 判断阴阳（索引奇偶）
    dm_yin = TIAN_GAN.index(day_master) % 2 == 0  # 甲丙戊庚壬为阳
    og_yin = TIAN_GAN.index(other_gan) % 2 == 0
    
    # 同性为偏，异性为正
    is_same_yin = dm_yin == og_yin
    
    gods = TEN_GOD_MAP[dm_wuxing][og_wuxing]
    return gods[1] if is_same_yin else gods[0]

def get_wuxing_strength(wuxing: str, month_branch: str) -> str:
    """根据月令判断五行旺衰"""
    return MONTH_STRENGTH.get(month_branch, {}).get(wuxing, "休")

# ============ 排盘核心 ============

class BaziCalculator:
    """八字计算器（MVP 简化版）"""
    
    def __init__(self):
        self.reason_chain = []  # 因果链记录
    
    def calculate_bazi(
        self,
        year: int,
        month: int,
        day: int,
        hour: int,
        minute: int = 0,
        longitude: Optional[float] = None,
        latitude: Optional[float] = None
    ) -> Dict:
        """
        计算八字（公历 → 农历 → 八字）
        
        注意：MVP 版本使用简化算法，直接调用 lunar-javascript 的 Python 绑定
        或直接使用预计算查找表
        
        实际生产环境应该：
        1. 调用 lunar-python 库（如果有）
        2. 或使用预计算的 1900-2100 年八字查找表
        3. 或调用 Node.js 微服务（lunar-javascript）
        """
        # TODO: 实际排盘需要农历库支持
        # 这里先返回示例数据结构
        
        # 示例：假设输入 1990-01-01 00:00
        # 实际应该调用农历库计算
        
        result = {
            "year": "己巳",  # 年柱
            "month": "丙子",  # 月柱
            "day": "丙寅",    # 日柱
            "hour": "戊子",   # 时柱
            "day_master": "丙",  # 日主
            "month_branch": "子",  # 月令
            "time_accuracy": "standard"  # standard/high
        }
        
        return result
    
    def analyze_day_master_strength(
        self,
        bazi: Dict
    ) -> Tuple[str, List[Dict]]:
        """
        分析日主旺衰（带因果链）
        
        return:
            strength: "旺" | "强" | "中和" | "弱" | "极弱"
            reason_chain: 因果推导链
        """
        reason_chain = []
        score = 0
        
        # 步骤 1：检查月令
        step1 = {
            "step": 1,
            "factor": "月令",
            "evidence": f"月令为 {bazi['month_branch']}",
            "logic": f"检查日主 {bazi['day_master']} 在月令 {bazi['month_branch']} 的状态",
            "conclusion": "待定"
        }
        
        dm_wuxing = TIAN_GAN_WUXING[bazi['day_master']]
        month_strength = get_wuxing_strength(dm_wuxing, bazi['month_branch'])
        
        if month_strength in ["旺", "相"]:
            score += 30
            step1["conclusion"] = f"得令 +30 分（{dm_wuxing}在{ bazi['month_branch']}月为{month_strength}）"
        elif month_strength == "休":
            score += 10
            step1["conclusion"] = f"得令 +10 分（{dm_wuxing}在{ bazi['month_branch']}月为休）"
        else:
            score -= 20
            step1["conclusion"] = f"失令 -20 分（{dm_wuxing}在{ bazi['month_branch']}月为{month_strength}）"
        
        reason_chain.append(step1)
        
        # 步骤 2：检查得地（日支、月支、时支）
        step2 = {
            "step": 2,
            "factor": "得地",
            "evidence": f"日支 {bazi['day'][1]}, 时支 {bazi['hour'][1]}",
            "logic": "检查地支中是否有日主之根（同五行或印星）",
            "conclusion": "待定"
        }
        
        branches = [bazi['day'][1], bazi['hour'][1]]  # 简化：只检查日支和时支
        for branch in branches:
            branch_wuxing = DI_ZHI_WUXING[branch]
            if branch_wuxing == dm_wuxing:
                score += 20
                step2["conclusion"] += f"{branch}为根 +20分；"
            elif branch_wuxing == self._get_yin_xing(dm_wuxing):
                score += 10
                step2["conclusion"] += f"{branch}为印 +10分；"
        
        if step2["conclusion"] == "待定":
            step2["conclusion"] = "不得地 0 分"
        
        reason_chain.append(step2)
        
        # 步骤 3：检查得势（其他天干）
        step3 = {
            "step": 3,
            "factor": "得势",
            "evidence": f"年干 {bazi['year'][0]}, 月干 {bazi['month'][0]}",
            "logic": "检查天干中是否有比劫或印星",
            "conclusion": "待定"
        }
        
        other_gans = [bazi['year'][0], bazi['month'][0]]
        for gan in other_gans:
            gan_wuxing = TIAN_GAN_WUXING[gan]
            if gan == bazi['day_master']:
                score += 10
                step3["conclusion"] += f"{gan}为比肩 +10分；"
            elif gan_wuxing == dm_wuxing:
                score += 8
                step3["conclusion"] += f"{gan}为比劫 +8分；"
            elif gan_wuxing == self._get_yin_xing(dm_wuxing):
                score += 5
                step3["conclusion"] += f"{gan}为印星 +5分；"
        
        if step3["conclusion"] == "待定":
            step3["conclusion"] = "不得势 0 分"
        
        reason_chain.append(step3)
        
        # 步骤 4：综合评分
        step4 = {
            "step": 4,
            "factor": "综合评分",
            "evidence": f"总分 = {score} 分",
            "logic": "旺 > 60分, 强 40-60分, 中和 30-40分, 弱 10-30分, 极弱 < 10分",
            "conclusion": "待定"
        }
        
        if score > 60:
            strength = "旺"
        elif score > 40:
            strength = "强"
        elif score > 30:
            strength = "中和"
        elif score > 10:
            strength = "弱"
        else:
            strength = "极弱"
        
        step4["conclusion"] = f"总分 {score} 分 → 日主{strength}"
        reason_chain.append(step4)
        
        return strength, reason_chain
    
    def _get_yin_xing(self, wuxing: str) -> str:
        """获取某五行的印星五行"""
        mapping = {
            "wood": "water",
            "fire": "wood",
            "earth": "fire",
            "metal": "earth",
            "water": "metal"
        }
        return mapping[wuxing]
    
    def analyze_wuxing(
        self,
        bazi: Dict
    ) -> Tuple[List[Dict], Dict[str, int]]:
        """
        分析五行分布（带因果链）
        
        return:
            wuxing_analysis: 每个五行的详细分析
            wuxing_strength: 五行力量评分 {wood: 85, fire: 60, ...}
        """
        wuxing_count = {"wood": 0, "fire": 0, "earth": 0, "metal": 0, "water": 0}
        wuxing_analysis = []
        reason_chain = []
        
        # 统计天干
        gans = [bazi['year'][0], bazi['month'][0], bazi['day'][0], bazi['hour'][0]]
        for gan in gans:
            wuxing = TIAN_GAN_WUXING[gan]
            wuxing_count[wuxing] += 1
        
        # 统计地支 + 藏干
        zhis = [bazi['year'][1], bazi['month'][1], bazi['day'][1], bazi['hour'][1]]
        for zhi in zhis:
            wuxing = DI_ZHI_WUXING[zhi]
            wuxing_count[wuxing] += 1
            
            # 藏干（减半计算）
            for cang_gan, _ in DI_ZHI_CANG_GAN[zhi]:
                cang_wuxing = TIAN_GAN_WUXING[cang_gan]
                wuxing_count[cang_wuxing] += 0.5
        
        # 生成分析
        for wuxing, count in wuxing_count.items():
            step = {
                "step": len(reason_chain) + 1,
                "factor": "五行统计",
                "evidence": f"{wuxing} 出现 {count} 次",
                "logic": "天干算1分，地支算1分，藏干算0.5分",
                "conclusion": f"{wuxing} 力量评分 {int(count * 20)} 分"
            }
            reason_chain.append(step)
            
            wuxing_analysis.append({
                "element": wuxing,
                "count": count,
                "strength": get_wuxing_strength(wuxing, bazi['month_branch']),
                "reason": reason_chain.copy(),
                "score": int(count * 20)
            })
        
        return wuxing_analysis, wuxing_count

# ============ 测试 ============

if __name__ == "__main__":
    print("✅ 八字排盘核心模块加载成功")
    print("\n功能清单：")
    print("  1. 天干地支基础数据")
    print("  2. 十神计算（get_ten_god）")
    print("  3. 旺衰判断（analyze_day_master_strength）- 带因果链")
    print("  4. 五行分析（analyze_wuxing）- 带因果链")
    print("\n⚠️  注意：MVP 版本排盘功能需接入农历库")
    print("   建议方案：")
    print("   - 方案A：使用 lunar-python 库")
    print("   - 方案B：预计算 1900-2100 年查找表")
    print("   - 方案C：调用 Node.js 微服务（lunar-javascript）")
