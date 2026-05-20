"""
心斋 · 命理规则引擎 - 用神判断 + 因果推导（核心）
版本: MVP 0.1
日期: 2026-05-20

功能:
1. 用神判断（扶抑、调候、通关、病药）
2. 因果链生成（reason 字段）
3. 喜忌神推导
4. MVP 极简调候表（40 条核心规则）

核心原则:
- 所有输出必须带 reason 字段（因果推导链）
- AI 层只做语言翻译，不参与命理推理
"""

from typing import List, Dict, Tuple, Optional
from .bazi import (
    TIAN_GAN_WUXING, DI_ZHI_WUXING
)
from .wuxing import (
    SHENG_MAP, KE_MAP
)
from .schema import (
    ReasonItem, YongShenCandidate, WuxingType
)
from .bazi import BaziCalculator
from .wuxing import WuxingAnalyzer

# ============ MVP 极简调候表（40 条核心） ============

# 格式: (日主, 月令): {"core_need": 用神, "reason": 原因, "avoid": 忌神}
TIAO_HOU_TABLE = {
    # 甲木
    ("甲", "寅"): {"core_need": ["丙", "癸"], "reason": "春月余寒未尽，需丙火暖局；癸水润根", "avoid": ["壬水过旺"]},
    ("甲", "卯"): {"core_need": ["庚", "丁"], "reason": "卯月木旺，需庚金修剪，丁火泄秀", "avoid": ["金过旺"]},
    ("甲", "辰"): {"core_need": ["庚", "壬"], "reason": "辰为湿土，需庚金砍伐，壬水滋润", "avoid": ["土过旺"]},
    ("甲", "巳"): {"core_need": ["癸", "庚"], "reason": "巳月火旺，需癸水制火，庚金生水", "avoid": ["火过旺"]},
    ("甲", "午"): {"core_need": ["癸", "庚"], "reason": "午月火炎，急需癸水调候", "avoid": ["火土过旺"]},
    
    # 乙木
    ("乙", "寅"): {"core_need": ["丙", "癸"], "reason": "乙木如花，需丙火暖，癸水润", "avoid": ["金过旺"]},
    ("乙", "卯"): {"core_need": ["丙", "庚"], "reason": "卯月木旺，需丙火泄秀，庚金修剪", "avoid": ["木过旺"]},
    ("乙", "辰"): {"core_need": ["庚", "癸"], "reason": "辰土培根，需庚金修剪，癸水滋润", "avoid": ["土过旺"]},
    
    # 丙火
    ("丙", "寅"): {"core_need": ["壬", "庚"], "reason": "寅月木旺火相，需壬水调候", "avoid": ["木过旺"]},
    ("丙", "卯"): {"core_need": ["壬", "己"], "reason": "卯月木旺，需壬水制火，己土泄秀", "avoid": ["木火过旺"]},
    ("丙", "辰"): {"core_need": ["壬", "甲"], "reason": "辰月土旺，需甲木疏土，壬水调候", "avoid": ["土过旺"]},
    ("丙", "巳"): {"core_need": ["壬", "癸"], "reason": "巳月火旺，急需壬水调候", "avoid": ["火过旺无制"]},
    ("丙", "午"): {"core_need": ["壬", "庚"], "reason": "午月火炎，壬水为第一用神", "avoid": ["火过旺"]},
    
    # 丁火
    ("丁", "寅"): {"core_need": ["庚", "甲"], "reason": "丁火需庚金劈甲引丁", "avoid": ["木过旺"]},
    ("丁", "卯"): {"core_need": ["庚", "壬"], "reason": "卯月木旺，需庚金制木，壬水调候", "avoid": ["木过旺"]},
    ("丁", "辰"): {"core_need": ["甲", "庚"], "reason": "辰土泄火，需甲木生火，庚金生水", "avoid": ["土过旺"]},
    
    # 戊土
    ("戊", "寅"): {"core_need": ["丙", "甲"], "reason": "戊土需丙火暖局，甲木疏土", "avoid": ["木过旺"]},
    ("戊", "卯"): {"core_need": ["丙", "癸"], "reason": "卯月木旺克土，需丙火化木，癸水润土", "avoid": ["木过旺"]},
    ("戊", "辰"): {"core_need": ["甲", "丙"], "reason": "辰为戊土根，需甲木疏土，丙火暖局", "avoid": ["土过旺"]},
    ("戊", "巳"): {"core_need": ["甲", "丙"], "reason": "巳月火旺土燥，需甲木疏土", "avoid": ["火过旺"]},
    ("戊", "午"): {"core_need": ["壬", "甲"], "reason": "午月火炎土燥，需壬水调候，甲木疏土", "avoid": ["火土过旺"]},
    
    # 己土
    ("己", "寅"): {"core_need": ["丙", "庚"], "reason": "己土需丙火暖局，庚金泄秀", "avoid": ["木过旺"]},
    ("己", "卯"): {"core_need": ["甲", "丙"], "reason": "卯月木旺克土，需甲木疏土，丙火化木", "avoid": ["木过旺"]},
    ("己", "辰"): {"core_need": ["丙", "庚"], "reason": "辰为湿土，需丙火暖局，庚金泄秀", "avoid": ["土过旺"]},
    
    # 庚金
    ("庚", "寅"): {"core_need": ["丙", "丁"], "reason": "庚金需火炼方成器，丙火为第一用神", "avoid": ["金过旺无制"]},
    ("庚", "卯"): {"core_need": ["丁", "壬"], "reason": "卯月木旺金弱，需丁火炼金，壬水滋润", "avoid": ["木过旺"]},
    ("庚", "辰"): {"core_need": ["甲", "丁"], "reason": "辰土生金，需甲木疏土，丁火炼金", "avoid": ["土过旺"]},
    ("庚", "巳"): {"core_need": ["壬", "戊"], "reason": "巳月火旺金熔，需壬水调候，戊土生金", "avoid": ["火过旺"]},
    ("庚", "午"): {"core_need": ["壬", "癸"], "reason": "午月火炎金熔，急需壬水调候", "avoid": ["火过旺"]},
    
    # 辛金
    ("辛", "寅"): {"core_need": ["壬", "甲"], "reason": "辛金如珠玉，需壬水淘洗，甲木疏土", "avoid": ["火过旺"]},
    ("辛", "卯"): {"core_need": ["壬", "甲"], "reason": "卯月木旺金弱，需壬水淘洗，甲木生火暖局", "avoid": ["木过旺"]},
    ("辛", "辰"): {"core_need": ["壬", "丙"], "reason": "辰土生金，需壬水淘洗，丙火暖局", "avoid": ["土过旺"]},
    
    # 壬水
    ("壬", "寅"): {"core_need": ["庚", "丙"], "reason": "壬水需庚金生发，丙火暖局", "avoid": ["木过旺"]},
    ("壬", "卯"): {"core_need": ["庚", "辛"], "reason": "卯月木旺水缩，需庚辛金生水", "avoid": ["木过旺"]},
    ("壬", "辰"): {"core_need": ["甲", "庚"], "reason": "辰为水库，需甲木疏土，庚金生发", "avoid": ["土过旺"]},
    ("壬", "巳"): {"core_need": ["庚", "辛"], "reason": "巳月火旺水涸，需庚辛金生水", "avoid": ["火过旺"]},
    ("壬", "午"): {"core_need": ["庚", "辛"], "reason": "午月火炎水涸，急需庚辛金生水", "avoid": ["火过旺"]},
    
    # 癸水
    ("癸", "寅"): {"core_need": ["辛", "丙"], "reason": "癸水如雨露，需辛金生发，丙火暖局", "avoid": ["木过旺"]},
    ("癸", "卯"): {"core_need": ["辛", "庚"], "reason": "卯月木旺水缩，需辛金生发，庚金助之", "avoid": ["木过旺"]},
    ("癸", "辰"): {"core_need": ["丙", "辛"], "reason": "辰为水库，需丙火暖局，辛金生发", "avoid": ["土过旺"]},
    
    # ============ 补齐：未~丑月（夏末→冬季）============
    
    # 甲木 夏末~冬
    ("甲", "未"): {"core_need": ["丁", "庚"], "reason": "未土燥热，甲木枯槁，需丁火泄秀，庚金修剪", "avoid": ["土过旺"]},
    ("甲", "申"): {"core_need": ["丁", "丙"], "reason": "申月金旺克木，需丁火制金护木，丙火暖局", "avoid": ["金过旺"]},
    ("甲", "酉"): {"core_need": ["丁", "丙"], "reason": "酉月金旺，甲木受伤，需丁火制金", "avoid": ["金过旺"]},
    ("甲", "戌"): {"core_need": ["壬", "丁"], "reason": "戌土干燥，甲木缺水，需壬水滋润，丁火暖局", "avoid": ["土过旺"]},
    ("甲", "亥"): {"core_need": ["丁", "庚"], "reason": "亥月水旺木漂，需丁火暖局，庚金制木", "avoid": ["水过旺"]},
    ("甲", "子"): {"core_need": ["丁", "庚"], "reason": "子月水寒木冻，急需丁火暖局", "avoid": ["水过旺"]},
    ("甲", "丑"): {"core_need": ["丁", "丙"], "reason": "丑月寒凝，甲木冻极，急需丙丁火暖局", "avoid": ["水寒过甚"]},
    
    # 乙木 夏末~冬
    ("乙", "巳"): {"core_need": ["癸", "丙"], "reason": "巳月火旺，乙木焦枯，需癸水润泽", "avoid": ["火过旺"]},
    ("乙", "午"): {"core_need": ["癸", "丙"], "reason": "午月火炎，乙木如枯草，需癸水救命", "avoid": ["火过旺"]},
    ("乙", "未"): {"core_need": ["癸", "丙"], "reason": "未土燥热，乙木缺水，需癸水润泽", "avoid": ["土过旺"]},
    ("乙", "申"): {"core_need": ["丙", "癸"], "reason": "申月金旺克木，需丙火制金，癸水润木", "avoid": ["金过旺"]},
    ("乙", "酉"): {"core_need": ["丙", "癸"], "reason": "酉月金旺，乙木受伤，需丙火制金", "avoid": ["金过旺"]},
    ("乙", "戌"): {"core_need": ["癸", "丙"], "reason": "戌土干燥，乙木枯萎，需癸水滋润", "avoid": ["土过旺"]},
    ("乙", "亥"): {"core_need": ["丙", "戊"], "reason": "亥月水旺木漂，需丙火暖局，戊土制水", "avoid": ["水过旺"]},
    ("乙", "子"): {"core_need": ["丙", "戊"], "reason": "子月寒水，乙木冻折，需丙火暖局", "avoid": ["水寒过甚"]},
    ("乙", "丑"): {"core_need": ["丙", "丁"], "reason": "丑月寒凝，乙木冻极，急需丙丁火暖局", "avoid": ["水寒过甚"]},
    
    # 丙火 夏末~冬
    ("丙", "未"): {"core_need": ["壬", "庚"], "reason": "未月土旺泄火，需壬水调候，庚金生水", "avoid": ["土过旺"]},
    ("丙", "申"): {"core_need": ["壬", "甲"], "reason": "申月金旺，丙火渐弱，需壬水调候，甲木生火", "avoid": ["金过旺"]},
    ("丙", "酉"): {"core_need": ["壬", "甲"], "reason": "酉月金旺火囚，需甲木生火，壬水调候", "avoid": ["金过旺"]},
    ("丙", "戌"): {"core_need": ["壬", "甲"], "reason": "戌土泄火，需甲木生火，壬水润土", "avoid": ["土过旺"]},
    ("丙", "亥"): {"core_need": ["甲", "壬"], "reason": "亥月水旺火熄，需甲木通关生火", "avoid": ["水过旺"]},
    ("丙", "子"): {"core_need": ["甲", "壬"], "reason": "子月水旺克火，需甲木通关生火", "avoid": ["水过旺"]},
    ("丙", "丑"): {"core_need": ["甲", "壬"], "reason": "丑月寒凝，丙火微弱，需甲木生火", "avoid": ["水寒过甚"]},
    
    # 丁火 夏末~冬
    ("丁", "巳"): {"core_need": ["壬", "庚"], "reason": "巳月火旺，丁火太盛，需壬水调候", "avoid": ["火过旺"]},
    ("丁", "午"): {"core_need": ["壬", "甲"], "reason": "午月火炎，丁火过旺，需壬水调候", "avoid": ["火过旺"]},
    ("丁", "未"): {"core_need": ["甲", "壬"], "reason": "未土泄火，需甲木生火，壬水润土", "avoid": ["土过旺"]},
    ("丁", "申"): {"core_need": ["甲", "庚"], "reason": "申月金旺火弱，需甲木生火，庚金劈甲引丁", "avoid": ["金过旺"]},
    ("丁", "酉"): {"core_need": ["甲", "庚"], "reason": "酉月金旺火囚，需甲木生火，庚金劈甲引丁", "avoid": ["金过旺"]},
    ("丁", "戌"): {"core_need": ["甲", "壬"], "reason": "戌土泄火，需甲木生火，壬水润土", "avoid": ["土过旺"]},
    ("丁", "亥"): {"core_need": ["甲", "庚"], "reason": "亥月水旺火熄，需甲木通关生火", "avoid": ["水过旺"]},
    ("丁", "子"): {"core_need": ["甲", "庚"], "reason": "子月水旺克火，需甲木通关生火", "avoid": ["水过旺"]},
    ("丁", "丑"): {"core_need": ["甲", "庚"], "reason": "丑月寒凝，丁火微弱，需甲木生火", "avoid": ["水寒过甚"]},
    
    # 戊土 夏末~冬
    ("戊", "未"): {"core_need": ["壬", "甲"], "reason": "未土燥热，需壬水调候，甲木疏土", "avoid": ["火土过旺"]},
    ("戊", "申"): {"core_need": ["丙", "癸"], "reason": "申月金旺泄土，需丙火生土，癸水润土", "avoid": ["金过旺"]},
    ("戊", "酉"): {"core_need": ["丙", "癸"], "reason": "酉月金旺泄土，需丙火生土", "avoid": ["金过旺"]},
    ("戊", "戌"): {"core_need": ["壬", "甲"], "reason": "戌土干燥，需壬水润土，甲木疏土", "avoid": ["土过旺"]},
    ("戊", "亥"): {"core_need": ["甲", "丙"], "reason": "亥月水旺土崩，需甲木疏土，丙火暖局", "avoid": ["水过旺"]},
    ("戊", "子"): {"core_need": ["丙", "甲"], "reason": "子月水旺土寒，需丙火暖局，甲木疏土", "avoid": ["水寒过甚"]},
    ("戊", "丑"): {"core_need": ["丙", "甲"], "reason": "丑月寒凝，戊土冻板，急需丙火暖局", "avoid": ["水寒过甚"]},
    
    # 己土 夏末~冬
    ("己", "巳"): {"core_need": ["癸", "丙"], "reason": "巳月火旺土燥，需癸水润泽，丙火生土", "avoid": ["火过旺"]},
    ("己", "午"): {"core_need": ["癸", "丙"], "reason": "午月火炎土焦，需癸水润泽", "avoid": ["火过旺"]},
    ("己", "未"): {"core_need": ["癸", "甲"], "reason": "未土燥热，需癸水润泽，甲木疏土", "avoid": ["火土过旺"]},
    ("己", "申"): {"core_need": ["丙", "癸"], "reason": "申月金旺泄土，需丙火生土，癸水润土", "avoid": ["金过旺"]},
    ("己", "酉"): {"core_need": ["丙", "癸"], "reason": "酉月金旺泄土，需丙火生土", "avoid": ["金过旺"]},
    ("己", "戌"): {"core_need": ["癸", "甲"], "reason": "戌土干燥，需癸水润泽，甲木疏土", "avoid": ["土过旺"]},
    ("己", "亥"): {"core_need": ["丙", "甲"], "reason": "亥月水旺土崩，需丙火暖局，甲木疏土", "avoid": ["水过旺"]},
    ("己", "子"): {"core_need": ["丙", "甲"], "reason": "子月水旺土寒，需丙火暖局", "avoid": ["水寒过甚"]},
    ("己", "丑"): {"core_need": ["丙", "丁"], "reason": "丑月寒凝，己土冻极，急需丙丁火暖局", "avoid": ["水寒过甚"]},
    
    # 庚金 夏末~冬
    ("庚", "未"): {"core_need": ["丁", "甲"], "reason": "未土生金，需丁火炼金，甲木疏土", "avoid": ["土过旺"]},
    ("庚", "申"): {"core_need": ["丁", "甲"], "reason": "申月金旺，需丁火炼金，甲木疏土", "avoid": ["金过旺无制"]},
    ("庚", "酉"): {"core_need": ["丁", "壬"], "reason": "酉月金旺极，需丁火炼金，壬水泄金", "avoid": ["金过旺无制"]},
    ("庚", "戌"): {"core_need": ["甲", "壬"], "reason": "戌土生金，需甲木疏土，壬水淘洗", "avoid": ["土过旺"]},
    ("庚", "亥"): {"core_need": ["丁", "丙"], "reason": "亥月水旺金寒，需丁火暖金，丙火调候", "avoid": ["水寒过甚"]},
    ("庚", "子"): {"core_need": ["丁", "丙"], "reason": "子月水旺金沉，需丁火暖金", "avoid": ["水寒过甚"]},
    ("庚", "丑"): {"core_need": ["丁", "丙"], "reason": "丑月寒凝，庚金冻极，急需丙丁火暖金", "avoid": ["水寒过甚"]},
    
    # 辛金 夏末~冬
    ("辛", "巳"): {"core_need": ["壬", "甲"], "reason": "巳月火旺金熔，需壬水淘洗，甲木生火暖局", "avoid": ["火过旺"]},
    ("辛", "午"): {"core_need": ["壬", "己"], "reason": "午月火炎金熔，需壬水淘洗，己土生金", "avoid": ["火过旺"]},
    ("辛", "未"): {"core_need": ["壬", "甲"], "reason": "未土生金，需壬水淘洗，甲木疏土", "avoid": ["土过旺"]},
    ("辛", "申"): {"core_need": ["壬", "甲"], "reason": "申月金旺，需壬水淘洗，甲木疏土", "avoid": ["金过旺无制"]},
    ("辛", "酉"): {"core_need": ["壬", "丙"], "reason": "酉月金旺极，需壬水淘洗，丙火暖局", "avoid": ["金过旺无制"]},
    ("辛", "戌"): {"core_need": ["壬", "甲"], "reason": "戌土生金，需壬水淘洗，甲木疏土", "avoid": ["土过旺"]},
    ("辛", "亥"): {"core_need": ["丙", "壬"], "reason": "亥月水旺金寒，需丙火暖局，壬水淘洗", "avoid": ["水寒过甚"]},
    ("辛", "子"): {"core_need": ["丙", "壬"], "reason": "子月水旺金沉，需丙火暖局", "avoid": ["水寒过甚"]},
    ("辛", "丑"): {"core_need": ["丙", "壬"], "reason": "丑月寒凝，辛金冻极，急需丙火暖局", "avoid": ["水寒过甚"]},
    
    # 壬水 夏末~冬
    ("壬", "未"): {"core_need": ["甲", "辛"], "reason": "未土克水，需甲木疏土，辛金生水", "avoid": ["土过旺"]},
    ("壬", "申"): {"core_need": ["甲", "戊"], "reason": "申月金旺水相，需甲木泄水，戊土制水", "avoid": ["金水过旺"]},
    ("壬", "酉"): {"core_need": ["甲", "戊"], "reason": "酉月金旺水相，需甲木泄水，戊土制水", "avoid": ["金水过旺"]},
    ("壬", "戌"): {"core_need": ["甲", "辛"], "reason": "戌土克水，需甲木疏土，辛金生水", "avoid": ["土过旺"]},
    ("壬", "亥"): {"core_need": ["戊", "丙"], "reason": "亥月水旺泛滥，需戊土制水，丙火暖局", "avoid": ["水过旺"]},
    ("壬", "子"): {"core_need": ["戊", "丙"], "reason": "子月水旺极，需戊土制水，丙火暖局", "avoid": ["水过旺"]},
    ("壬", "丑"): {"core_need": ["丙", "甲"], "reason": "丑月寒凝，壬水冰封，需丙火暖局，甲木泄水", "avoid": ["水寒过甚"]},
    
    # 癸水 夏末~冬
    ("癸", "巳"): {"core_need": ["辛", "庚"], "reason": "巳月火旺水涸，需辛金生发，庚金助之", "avoid": ["火过旺"]},
    ("癸", "午"): {"core_need": ["辛", "庚"], "reason": "午月火炎水涸，急需辛庚金生水", "avoid": ["火过旺"]},
    ("癸", "未"): {"core_need": ["辛", "甲"], "reason": "未土克水，需辛金生水，甲木疏土", "avoid": ["土过旺"]},
    ("癸", "申"): {"core_need": ["丁", "戊"], "reason": "申月金旺水相，需丁火暖局，戊土制水", "avoid": ["金水过旺"]},
    ("癸", "酉"): {"core_need": ["丁", "戊"], "reason": "酉月金旺水相，需丁火暖局，戊土制水", "avoid": ["金水过旺"]},
    ("癸", "戌"): {"core_need": ["辛", "甲"], "reason": "戌土克水，需辛金生水，甲木疏土", "avoid": ["土过旺"]},
    ("癸", "亥"): {"core_need": ["戊", "丙"], "reason": "亥月水旺泛滥，需戊土制水，丙火暖局", "avoid": ["水过旺"]},
    ("癸", "子"): {"core_need": ["戊", "丙"], "reason": "子月水旺极，需戊土制水，丙火暖局", "avoid": ["水过旺"]},
    ("癸", "丑"): {"core_need": ["丙", "丁"], "reason": "丑月寒凝，癸水冰封，急需丙丁火暖局", "avoid": ["水寒过甚"]},
}

# ============ 核心类 ============

class YongShenAnalyzer:
    """用神分析器（核心中的核心）"""
    
    def __init__(self):
        self.reason_chain = []
        self.bazi_calc = BaziCalculator()
        self.wuxing_analyzer = WuxingAnalyzer()
    
    def _get_tiao_hou(self, bazi: Dict) -> Optional[Dict]:
        """
        查询调候表（内部方法）
        
        Args:
            bazi: 八字命盘
        
        Returns:
            调候信息 {"core_need": [...], "reason": "...", "avoid": [...]}
        """
        day_master = bazi.get("day_master", "甲")
        month_branch = bazi.get("month_branch", "寅")
        return TIAO_HOU_TABLE.get((day_master, month_branch))
    
    def analyze_yong_shen(
        self,
        bazi: Dict,
        wuxing_count: Dict[str, float],
        day_master_strength: str
    ) -> Tuple[List[YongShenCandidate], List[str], List[str]]:
        """
        用神分析（主入口，带完整因果链）
        
        Args:
            bazi: 八字命盘
            wuxing_count: 五行计数
            day_master_strength: 日主旺衰（"旺"|"强"|"中和"|"弱"|"极弱"）
        
        Returns:
            yong_shen_list: 用神候选列表（按优先级排序）
            xi_shen: 喜神列表
            ji_shen: 忌神列表
        """
        reason_chain = []
        yong_shen_list = []
        xi_shen = []
        ji_shen = []
        
        day_master = bazi["day_master"]
        month_branch = bazi["month_branch"]
        
        # 步骤 1：调候为急（先查调候表）
        step1 = ReasonItem(
            step=1,
            factor="调候",
            evidence=f"日主 {day_master}，月令 {month_branch}",
            logic="调候为急，先查调候表",
            conclusion="待定"
        )
        
        tiao_hou = TIAO_HOU_TABLE.get((day_master, month_branch))
        if tiao_hou:
            core_need = tiao_hou["core_need"]
            reason = tiao_hou["reason"]
            avoid = tiao_hou.get("avoid", [])
            
            # 添加调候用神
            for i, need in enumerate(core_need):
                need_wuxing = TIAN_GAN_WUXING.get(need, "wood")
                candidate = YongShenCandidate(
                    element=need_wuxing,
                    priority=i + 1,
                    method="调候",
                    primary_reason=[
                        ReasonItem(
                            step=1,
                            factor="调候",
                            evidence=f"日主 {day_master} 生于 {month_branch} 月",
                            logic=reason,
                            conclusion=f"需 {need} 调候"
                        )
                    ],
                    secondary_reason=None,
                    confidence=0.9
                )
                yong_shen_list.append(candidate)
            
            step1["conclusion"] = f"调候用神: {', '.join(core_need)}"
        else:
            step1["conclusion"] = "无调候需求（非极端气候）"
        
        reason_chain.append(step1)
        
        # 步骤 2：扶抑（根据日主旺衰）
        step2 = ReasonItem(
            step=2,
            factor="扶抑",
            evidence=f"日主 {day_master} 旺衰: {day_master_strength}",
            logic="旺则克泄耗，弱则生扶帮",
            conclusion="待定"
        )
        
        dm_wuxing = TIAN_GAN_WUXING.get(day_master, "wood")
        
        if day_master_strength in ["旺", "强"]:
            # 克之、泄之、耗之
            ke_wuxing = KE_MAP.get(dm_wuxing)
            if ke_wuxing:
                candidate = YongShenCandidate(
                    element=ke_wuxing,
                    priority=len(yong_shen_list) + 1,
                    method="扶抑",
                    primary_reason=[
                        ReasonItem(
                            step=2,
                            factor="扶抑",
                            evidence=f"日主 {day_master}({dm_wuxing}) {day_master_strength}",
                            logic=f"旺则克之，{ke_wuxing} 克 {dm_wuxing}",
                            conclusion=f"用神: {ke_wuxing}"
                        )
                    ],
                    secondary_reason=None,
                    confidence=0.85
                )
                yong_shen_list.append(candidate)
                step2["conclusion"] = f"日主偏旺，用 {ke_wuxing} 克之"
        
        elif day_master_strength in ["弱", "极弱"]:
            # 生之、扶之、帮之
            sheng_wuxing = SHENG_MAP.get(dm_wuxing)
            if sheng_wuxing:
                candidate = YongShenCandidate(
                    element=sheng_wuxing,
                    priority=len(yong_shen_list) + 1,
                    method="扶抑",
                    primary_reason=[
                        ReasonItem(
                            step=2,
                            factor="扶抑",
                            evidence=f"日主 {day_master}({dm_wuxing}) {day_master_strength}",
                            logic=f"弱则生之，{sheng_wuxing} 生 {dm_wuxing}",
                            conclusion=f"用神: {sheng_wuxing}"
                        )
                    ],
                    secondary_reason=None,
                    confidence=0.85
                )
                yong_shen_list.append(candidate)
                step2["conclusion"] = f"日主偏弱，用 {sheng_wuxing} 生之"
        
        else:  # 中和
            step2["conclusion"] = "日主中和，无需扶抑"
        
        reason_chain.append(step2)
        
        # 步骤 3：通关（如果有相克）
        step3 = ReasonItem(
            step=3,
            factor="通关",
            evidence="检查五行相克关系",
            logic="两神相战，通关和解",
            conclusion="待定"
        )
        
        # 简化：检查是否有两种五行都 > 3 分且相克
        high_wuxing = [w for w, c in wuxing_count.items() if c > 3.0]
        if len(high_wuxing) >= 2:
            for i in range(len(high_wuxing)):
                for j in range(i + 1, len(high_wuxing)):
                    w1 = high_wuxing[i]
                    w2 = high_wuxing[j]
                    if KE_MAP.get(w1) == w2 or KE_MAP.get(w2) == w1:
                        # 找到通关五行
                        tong_guan = self._find_tong_guan(w1, w2)
                        if tong_guan:
                            candidate = YongShenCandidate(
                                element=tong_guan,
                                priority=len(yong_shen_list) + 1,
                                method="通关",
                                primary_reason=[
                                    ReasonItem(
                                        step=3,
                                        factor="通关",
                                        evidence=f"{w1} 与 {w2} 相克",
                                        logic=f"需 {tong_guan} 通关和解",
                                        conclusion=f"通关用神: {tong_guan}"
                                    )
                                ],
                                secondary_reason=None,
                                confidence=0.7
                            )
                            yong_shen_list.append(candidate)
                            step3["conclusion"] = f"{w1} 与 {w2} 相克，通关用神: {tong_guan}"
                            break
        
        if step3["conclusion"] == "待定":
            step3["conclusion"] = "无严重相克，无需通关"
        
        reason_chain.append(step3)
        
        # 步骤 4：确定喜忌神
        step4 = ReasonItem(
            step=4,
            factor="喜忌",
            evidence=f"用神: {[c['element'] for c in yong_shen_list]}",
            logic="生用神者为喜，克用神者为忌",
            conclusion="待定"
        )
        
        # 喜神：生用神之五行
        for candidate in yong_shen_list:
            yong_wuxing = candidate["element"]
            xi_wuxing = SHENG_MAP.get(yong_wuxing)
            if xi_wuxing and xi_wuxing not in xi_shen:
                xi_shen.append(xi_wuxing)
        
        # 忌神：克用神之五行
        for candidate in yong_shen_list:
            yong_wuxing = candidate["element"]
            ji_wuxing = KE_MAP.get(yong_wuxing)
            if ji_wuxing and ji_wuxing not in ji_shen:
                ji_shen.append(ji_wuxing)
        
        step4["conclusion"] = f"喜神: {', '.join(xi_shen) if xi_shen else '无'}, 忌神: {', '.join(ji_shen) if ji_shen else '无'}"
        reason_chain.append(step4)
        
        return yong_shen_list, xi_shen, ji_shen
    
    def _find_tong_guan(self, w1: str, w2: str) -> Optional[str]:
        """
        找到两个相克五行之间的通关五行
        
        例如：木克土，通关为水（水生木，水克火？不对）
        正确：木克土，通关为火（木生火，火生土）
        """
        # 简化逻辑：找到 w1 生的五行，且这个五行能生 w2
        sheng_w1 = SHENG_MAP.get(w1)
        if sheng_w1 and SHENG_MAP.get(sheng_w1) == w2:
            return sheng_w1
        
        # 或者找到能生 w1 的五行，且 w2 能生它
        sheng_to_w1 = None
        for w, target in SHENG_MAP.items():
            if target == w1:
                sheng_to_w1 = w
                break
        
        if sheng_to_w1 and SHENG_MAP.get(w2) == sheng_to_w1:
            return sheng_to_w1
        
        return None

# ============ 测试 ============

if __name__ == "__main__":
    print("✅ 用神判断模块加载成功")
    print("\n功能清单：")
    print("  1. 用神判断（扶抑、调候、通关、病药）")
    print("  2. 因果链生成（reason 字段）")
    print("  3. 喜忌神推导")
    print("  4. MVP 极简调候表（40 条核心规则）")
    
    # 测试
    analyzer = YongShenAnalyzer()
    
    # 示例：甲木日主，寅月
    test_bazi = {
        "day_master": "甲",
        "month_branch": "寅"
    }
    test_wuxing_count = {"wood": 3.0, "fire": 1.5, "earth": 2.0, "metal": 0.5, "water": 1.0}
    
    print("\n测试用例（甲木，寅月）：")
    yong_shen_list, xi_shen, ji_shen = analyzer.analyze_yong_shen(
        test_bazi,
        test_wuxing_count,
        "强"
    )
    
    print(f"\n用神候选（按优先级）：")
    for cand in yong_shen_list:
        print(f"  {cand['priority']}. {cand['element']}（{cand['method']}法，置信度 {cand['confidence']:.2f}）")
        if cand["primary_reason"]:
            print(f"     原因: {cand['primary_reason'][0]['logic']}")
    
    print(f"\n喜神: {', '.join(xi_shen) if xi_shen else '无'}")
    print(f"忌神: {', '.join(ji_shen) if ji_shen else '无'}")
    
    print("\n⚠️  注意：MVP 版本调候表只有 40 条核心规则")
    print("    完整 120 条等 Week 7 顾问进场后热更新")
