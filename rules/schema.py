"""
心斋 · 命理规则引擎 - 因果链 JSON Schema 定义
版本: MVP 0.1
日期: 2026-05-20

设计原则:
1. 所有规则输出必须带 reason 字段（因果推导链）
2. AI 层只做语言翻译，不参与命理推理
3. 数据结构支持两级精度（L1缺省/L2高精）
"""

from typing import TypedDict, List, Optional, Literal
from datetime import datetime

# ============ 基础类型 ============

WuxingType = Literal["wood", "fire", "earth", "metal", "water"]
TianGanType = Literal["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"]
DiZhiType = Literal[
    "子", "丑", "寅", "卯", "辰", "巳",
    "午", "未", "申", "酉", "戌", "亥"
]
TenGodType = Literal[
    "正印", "偏印", "正官", "七杀", "正财", "偏财",
    "食神", "伤官", "比肩", "劫财"
]
StrengthType = Literal["旺", "相", "休", "囚", "死"]
YongShenType = Literal["扶抑", "调候", "通关", "病药"]

TimeAccuracyType = Literal["standard", "high"]

# ============ 因果链核心 Schema ============

class ReasonItem(TypedDict):
    """单个因果推导步骤"""
    step: int  # 推导步骤序号
    factor: str  # 影响因子（如 "月令", "得地", "得势"）
    evidence: str  # 证据（如 "寅月木旺"）
    logic: str  # 逻辑推理（如 "日主甲木生于寅月，得令"）
    conclusion: str  # 本步骤结论（如 "日主偏旺"）

class WuxingAnalysis(TypedDict):
    """五行分析（含因果链）"""
    element: WuxingType  # 五行
    count: int  # 出现次数
    strength: StrengthType  # 旺衰状态
    reason: List[ReasonItem]  # 因果推导链
    score: int  # 力量评分 (0-100)

class TenGodAnalysis(TypedDict):
    """十神分析（含因果链）"""
    position: Literal["年柱", "月柱", "日柱", "时柱", "藏干"]  # 位置
    gan_zhi: str  # 干支（如 "甲寅"）
    ten_god: TenGodType  # 十神
    qi_weight: float  # 气数权重 (0.0-1.0)
    reason: List[ReasonItem]  # 因果推导链
    description: str  # 简短描述

class YongShenCandidate(TypedDict):
    """用神候选（含因果链）"""
    element: WuxingType  # 用神五行
    priority: int  # 优先级 (1-3)
    method: YongShenType  # 取法（扶抑/调候/通关/病药）
    primary_reason: List[ReasonItem]  # 主要原因（因果链）
    secondary_reason: Optional[List[ReasonItem]]  # 辅助原因
    confidence: float  # 置信度 (0.0-1.0)

class BaziChart(TypedDict):
    """八字命盘基础信息"""
    year: str  # 年柱（如 "甲寅"）
    month: str  # 月柱
    day: str  # 日柱
    hour: str  # 时柱
    day_master: TianGanType  # 日主
    month_branch: DiZhiType  # 月令
    time_accuracy: TimeAccuracyType  # 时间精度（standard/high）

class PalaceAnalysis(TypedDict):
    """十二宫分析（含藏干因果链）"""
    palace_name: str  # 宫位名（如 "命宫", "夫妻宫"）
    branch: DiZhiType  # 地支
    hidden_stems: List[TenGodAnalysis]  # 藏干十神分析（含 reason）
    main_qi: str  # 主气（如 "甲木正印"）
    score: int  # 宫位评分 (0-100)
    reason: List[ReasonItem]  # 因果推导链

# ============ 完整输出 Schema ============

class BaziAnalysisResult(TypedDict):
    """八字完整分析结果（规则引擎输出）"""
    
    # 基础信息
    base_info: BaziChart
    
    # 五行分析
    wuxing_analysis: List[WuxingAnalysis]
    wuxing_strength: dict[WuxingType, int]  # 五行力量分布 {wood: 85, fire: 60, ...}
    
    # 日主旺衰
    day_master_strength: Literal["旺", "强", "中和", "弱", "极弱"]
    strength_reason: List[ReasonItem]  # 旺衰判断因果链
    
    # 十二宫分析
    palace_analysis: List[PalaceAnalysis]
    
    # 用神分析
    yong_shen: List[YongShenCandidate]  # 用神候选列表（按优先级排序）
    xi_shen: List[WuxingType]  # 喜神
    ji_shen: List[WuxingType]  # 忌神
    
    # 调候分析（仅适用于特定日主+月令组合）
    tiao_hou: Optional[dict]  # {need: "丙火", reason: [...], avoid: "壬水"}
    
    # 神煞（简化版，MVP 暂不实现）
    shen_sha: Optional[List[dict]]  # Week 7 后热更新
    
    # 元数据
    version: str  # Schema 版本（如 "0.1"）
    engine: str  # 引擎名称（如 "xinzhai-rules-v1"）
    timestamp: str  # ISO 8601 时间戳

# ============ API 请求/响应 Schema ============

class GenerateRequest(TypedDict):
    """/api/rules/generate 请求体"""
    year: int
    month: int
    day: int
    hour: int
    minute: int
    gender: Literal["male", "female"]
    longitude: Optional[float]  # 经度（L2 高精模式）
    latitude: Optional[float]  # 纬度（L2 高精模式）
    city: Optional[str]  # 城市名（用于显示）

class GenerateResponse(TypedDict):
    """/api/rules/generate 响应体"""
    success: bool
    data: Optional[BaziAnalysisResult]
    error: Optional[str]
    time_accuracy: TimeAccuracyType  # 返回实际使用的时间精度

# ============ 示例：完整的因果链 JSON ============

EXAMPLE_REASON_CHAIN = {
    "day_master_strength": "强",
    "strength_reason": [
        {
            "step": 1,
            "factor": "月令",
            "evidence": "寅月（农历正月）",
            "logic": "寅月木旺，日主甲木得令",
            "conclusion": "得令 +30 分"
        },
        {
            "step": 2,
            "factor": "得地",
            "evidence": "日支子水，时支寅木",
            "logic": "子水生木，寅木为根，日主得地",
            "conclusion": "得地 +20 分"
        },
        {
            "step": 3,
            "factor": "得势",
            "evidence": "年干甲木比肩",
            "logic": "年干甲木助身，日主得势",
            "conclusion": "得势 +10 分"
        },
        {
            "step": 4,
            "factor": "综合评分",
            "evidence": "得令+得地+得势 = 60分",
            "logic": "总分 > 50 分，日主偏旺",
            "conclusion": "日主强"
        }
    ],
    "yong_shen": [
        {
            "element": "金",
            "priority": 1,
            "method": "扶抑",
            "primary_reason": [
                {
                    "step": 1,
                    "factor": "日主偏旺",
                    "evidence": "甲木偏旺（60分）",
                    "logic": "旺则克之、泄之、耗之",
                    "conclusion": "首选克木之金"
                }
            ],
            "secondary_reason": [
                {
                    "step": 2,
                    "factor": "调候兼顾",
                    "evidence": "寅月寒气未退",
                    "logic": "用金同时需兼顾调候（火）",
                    "conclusion": "金为用神，火为喜神"
                }
            ],
            "confidence": 0.85
        }
    ]
}

# ============ 工具函数 ============

def validate_reason_chain(data: BaziAnalysisResult) -> bool:
    """
    验证因果链完整性
    规则：
    1. 所有 reason 字段必须非空
    2. reason 中每个 step 必须连续
    3. 最终 conclusion 必须与父字段值一致
    """
    # TODO: 实现验证逻辑
    pass

def to_json(result: BaziAnalysisResult) -> str:
    """序列化为 JSON（带中文）"""
    import json
    return json.dumps(result, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    # 测试：打印 schema 定义
    import json
    print("✅ 因果链 JSON Schema 定义完成")
    print("\n核心类型：")
    print("  - BaziAnalysisResult: 完整分析结果")
    print("  - ReasonItem: 因果推导步骤")
    print("  - WuxingAnalysis: 五行分析（含 reason）")
    print("  - TenGodAnalysis: 十神分析（含 reason）")
    print("  - YongShenCandidate: 用神候选（含 reason）")
    print("\n示例因果链已定义：EXAMPLE_REASON_CHAIN")
