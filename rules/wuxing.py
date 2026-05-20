"""
心斋 · 命理规则引擎 - 五行生克制化
版本: MVP 0.1
日期: 2026-05-20

功能:
1. 五行相生相克判断
2. 五行力量评分
3. 五行缺失分析
4. 用神候选推荐（基于五行平衡）
"""

from typing import List, Dict, Tuple
from .bazi import (
    TIAN_GAN_WUXING, DI_ZHI_WUXING, DI_ZHI_CANG_GAN
)
from .schema import (
    WuxingAnalysis, ReasonItem, WuxingType
)

# ============ 五行生克关系 ============

# 相生：木生火、火生土、土生金、金生水、水生木
SHENG_MAP = {
    "wood": "fire",
    "fire": "earth",
    "earth": "metal",
    "metal": "water",
    "water": "wood"
}

# 相克：木克土、土克水、水克火、火克金、金克木
KE_MAP = {
    "wood": "earth",
    "earth": "water",
    "water": "fire",
    "fire": "metal",
    "metal": "wood"
}

# 五行颜色（中式低饱和）
WUXING_COLORS = {
    "wood": "#7a9a6d",  # 木-绿
    "fire": "#c4956a",  # 火-橙
    "earth": "#a89880",  # 土-棕
    "metal": "#b8a090",  # 金-灰
    "water": "#6b8ca0"   # 水-蓝
}

# 五行对应脏腑（简化）
WUXING_ORGANS = {
    "wood": "肝胆",
    "fire": "心小肠",
    "earth": "脾胃",
    "metal": "肺大肠",
    "water": "肾膀胱"
}

# ============ 核心类 ============

class WuxingAnalyzer:
    """五行分析器"""
    
    def __init__(self):
        self.reason_chain = []
    
    def analyze_wuxing_balance(
        self,
        bazi: Dict,
        wuxing_count: Dict[str, float]
    ) -> Tuple[List[WuxingAnalysis], List[ReasonItem]]:
        """
        分析五行平衡（带因果链）
        
        Args:
            bazi: 八字命盘
            wuxing_count: 五行计数 {wood: 2.5, fire: 1.0, ...}
        
        Returns:
            analyses: 每个五行的详细分析
            reason_chain: 因果推导链
        """
        analyses = []
        reason_chain = []
        
        # 步骤 1：计算每个五行的力量评分
        step1 = ReasonItem(
            step=1,
            factor="五行统计",
            evidence=f"天干+地支+藏干统计",
            logic="天干算1分，地支算1分，藏干算0.5分",
            conclusion="统计完成"
        )
        
        max_count = max(wuxing_count.values()) if wuxing_count.values() else 1
        
        for wuxing, count in wuxing_count.items():
            # 计算力量评分（0-100）
            score = int((count / max_count) * 100) if max_count > 0 else 0
            
            # 判断旺衰
            month_branch = bazi.get("month_branch", "寅")
            from .bazi import get_wuxing_strength
            strength = get_wuxing_strength(wuxing, month_branch)
            
            analysis = WuxingAnalysis(
                element=wuxing,
                count=count,
                strength=strength,
                reason=[step1],
                score=score
            )
            analyses.append(analysis)
        
        reason_chain.append(step1)
        
        # 步骤 2：分析五行生克关系
        step2 = ReasonItem(
            step=2,
            factor="五行生克",
            evidence="检查五行之间的相生相克关系",
            logic="生我为印，我生为食伤，克我为官杀，我克为财",
            conclusion="分析完成"
        )
        
        # 找出最强和最弱的五行
        sorted_wuxing = sorted(wuxing_count.items(), key=lambda x: x[1], reverse=True)
        strongest = sorted_wuxing[0][0] if sorted_wuxing else "wood"
        weakest = sorted_wuxing[-1][0] if sorted_wuxing else "water"
        
        step2["conclusion"] = f"最强: {strongest} ({wuxing_count[strongest]}分), 最弱: {weakest} ({wuxing_count[weakest]}分)"
        reason_chain.append(step2)
        
        return analyses, reason_chain
    
    def recommend_yong_shen_by_wuxing(
        self,
        day_master: str,
        wuxing_count: Dict[str, float]
    ) -> List[Tuple[str, float, str]]:
        """
        基于五行平衡推荐用神候选
        
        Args:
            day_master: 日主天干（如 "甲"）
            wuxing_count: 五行计数
        
        Returns:
            candidates: [(五行, 置信度, 原因), ...]
        """
        candidates = []
        
        # 获取日主五行
        from .bazi import TIAN_GAN_WUXING
        dm_wuxing = TIAN_GAN_WUXING.get(day_master, "wood")
        
        # 规则 1：如果某个五行过旺（>3分），克之
        for wuxing, count in wuxing_count.items():
            if count > 3.0:
                ke_wuxing = KE_MAP.get(wuxing)
                if ke_wuxing:
                    confidence = min(0.9, count / 5.0)
                    reason = f"{wuxing}过旺({count}分)，需{ke_wuxing}克制"
                    candidates.append((ke_wuxing, confidence, reason))
        
        # 规则 2：如果某个五行过弱（<1分），补之
        for wuxing, count in wuxing_count.items():
            if count < 1.0:
                confidence = min(0.8, 1.0 - count)
                reason = f"{wuxing}过弱({count}分)，需补充"
                candidates.append((wuxing, confidence, reason))
        
        # 规则 3：日主弱者，生扶之
        dm_count = wuxing_count.get(dm_wuxing, 0)
        if dm_count < 2.0:
            # 生我者为印
            sheng_wo = SHENG_MAP.get(dm_wuxing)
            if sheng_wo:
                confidence = min(0.85, (2.0 - dm_count) / 2.0)
                reason = f"日主{dm_wuxing}偏弱({dm_count}分)，需{sheng_wo}生扶"
                candidates.append((sheng_wo, confidence, reason))
        
        # 去重并按置信度排序
        seen = set()
        unique_candidates = []
        for cand in candidates:
            if cand[0] not in seen:
                seen.add(cand[0])
                unique_candidates.append(cand)
        
        unique_candidates.sort(key=lambda x: x[1], reverse=True)
        
        return unique_candidates
    
    def analyze_wuxing_relations(
        self,
        wuxing_count: Dict[str, float]
    ) -> List[Dict]:
        """
        分析五行之间的生克关系（用于 AI 解读）
        
        Returns:
            relations: [{"from": "wood", "to": "fire", "type": "sheng", "strength": 0.8}, ...]
        """
        relations = []
        
        for wuxing, count in wuxing_count.items():
            # 相生关系
            sheng_to = SHENG_MAP.get(wuxing)
            if sheng_to and sheng_to in wuxing_count:
                strength = min(1.0, count / 3.0)
                relations.append({
                    "from": wuxing,
                    "to": sheng_to,
                    "type": "sheng",
                    "strength": strength,
                    "description": f"{wuxing}生{sheng_to}"
                })
            
            # 相克关系
            ke_to = KE_MAP.get(wuxing)
            if ke_to and ke_to in wuxing_count:
                strength = min(1.0, count / 3.0)
                relations.append({
                    "from": wuxing,
                    "to": ke_to,
                    "type": "ke",
                    "strength": strength,
                    "description": f"{wuxing}克{ke_to}"
                })
        
        return relations

# ============ 测试 ============

if __name__ == "__main__":
    print("✅ 五行生克模块加载成功")
    print("\n功能清单：")
    print("  1. 五行相生相克判断")
    print("  2. 五行力量评分")
    print("  3. 五行缺失分析")
    print("  4. 用神候选推荐（基于五行平衡）")
    
    # 测试
    analyzer = WuxingAnalyzer()
    
    # 示例：甲木日主，五行分布
    test_bazi = {"month_branch": "寅"}
    test_count = {"wood": 3.0, "fire": 1.5, "earth": 2.0, "metal": 0.5, "water": 1.0}
    
    print("\n测试用例：")
    print(f"  日主: 甲木")
    print(f"  五行分布: {test_count}")
    
    candidates = analyzer.recommend_yong_shen_by_wuxing("甲", test_count)
    print(f"\n用神候选（基于五行平衡）:")
    for wuxing, confidence, reason in candidates:
        print(f"  - {wuxing}: 置信度 {confidence:.2f}, 原因: {reason}")
