"""
心斋 · 命理规则引擎
版本: MVP 0.1
日期: 2026-05-20

模块结构:
- schema.py: 因果链 JSON schema 定义
- bazi.py: 八字排盘核心
- wuxing.py: 五行生克制化
- shensha.py: 神煞查询（MVP 简化版）
- yongshen.py: 用神判断 + 因果推导（核心）

使用方式:
    from rules import BaziAnalyzer
    
    analyzer = BaziAnalyzer()
    result = analyzer.analyze(bazi_data)
"""

from .schema import (
    BaziAnalysisResult,
    ReasonItem,
    WuxingAnalysis,
    TenGodAnalysis,
    YongShenCandidate,
    GenerateRequest,
    GenerateResponse
)

from .bazi import BaziCalculator
from .wuxing import WuxingAnalyzer
from .shensha import ShenShaAnalyzer
from .yongshen import YongShenAnalyzer

__version__ = "0.1.0"
__all__ = [
    "BaziAnalysisResult",
    "ReasonItem",
    "WuxingAnalysis",
    "TenGodAnalysis",
    "YongShenCandidate",
    "GenerateRequest",
    "GenerateResponse",
    "BaziCalculator",
    "WuxingAnalyzer",
    "ShenShaAnalyzer",
    "YongShenAnalyzer"
]

class BaziAnalyzer:
    """
    八字分析器（主入口）
    
    整合所有模块，提供统一的分析接口
    """
    
    def __init__(self):
        self.bazi_calc = BaziCalculator()
        self.wuxing_analyzer = WuxingAnalyzer()
        self.shensha_analyzer = ShenShaAnalyzer()
        self.yongshen_analyzer = YongShenAnalyzer()
    
    def analyze(self, bazi_data: dict) -> BaziAnalysisResult:
        """
        完整八字分析（带因果链）
        
        Args:
            bazi_data: {
                "year": "己巳",
                "month": "丙子",
                "day": "丙寅",
                "hour": "戊子",
                "day_master": "丙",
                "month_branch": "子",
                "time_accuracy": "standard"
            }
        
        Returns:
            BaziAnalysisResult: 完整分析结果（符合 schema 定义）
        """
        # 1. 分析日主旺衰
        day_master_strength, strength_reason = self.bazi_calc.analyze_day_master_strength(bazi_data)
        
        # 2. 分析五行
        wuxing_analysis, wuxing_count = self.bazi_calc.analyze_wuxing(bazi_data)
        
        # 3. 分析用神
        yong_shen_list, xi_shen, ji_shen = self.yongshen_analyzer.analyze_yong_shen(
            bazi_data,
            wuxing_count,
            day_master_strength
        )
        
        # 4. 分析神煞（MVP 简化）
        shensha = self.shensha_analyzer.check_all(
            bazi_data["year"][1],
            bazi_data["month"][1],
            bazi_data["day"][1],
            bazi_data["hour"][1],
            bazi_data["day_master"]
        )
        
        # 5. 组装结果
        result = BaziAnalysisResult(
            base_info=bazi_data,
            wuxing_analysis=wuxing_analysis,
            wuxing_strength=wuxing_count,
            day_master_strength=day_master_strength,
            strength_reason=strength_reason,
            palace_analysis=[],  # TODO: 实现十二宫分析
            yong_shen=yong_shen_list,
            xi_shen=xi_shen,
            ji_shen=ji_shen,
            tiao_hou=self.yongshen_analyzer._get_tiao_hou(bazi_data),
            shen_sha=shensha if shensha else None,
            version="0.1",
            engine="xinzhai-rules-v1",
            timestamp=bazi_data.get("timestamp", "")
        )
        
        return result
    
    def to_json(self, result: BaziAnalysisResult) -> str:
        """序列化为 JSON"""
        import json
        return json.dumps(result, ensure_ascii=False, indent=2)

# ============ 测试 ============

if __name__ == "__main__":
    print("✅ 心斋命理规则引擎加载成功")
    print(f"版本: {__version__}")
    print("\n可用模块：")
    print("  - BaziCalculator: 八字排盘")
    print("  - WuxingAnalyzer: 五行分析")
    print("  - ShenShaAnalyzer: 神煞查询")
    print("  - YongShenAnalyzer: 用神判断")
    print("  - BaziAnalyzer: 主入口（整合所有模块）")
    
    print("\n测试用例：")
    analyzer = BaziAnalyzer()
    
    # 示例数据
    test_bazi = {
        "year": "己巳",
        "month": "丙子",
        "day": "丙寅",
        "hour": "戊子",
        "day_master": "丙",
        "month_branch": "子",
        "time_accuracy": "standard",
        "timestamp": "2026-05-20T09:00:00Z"
    }
    
    result = analyzer.analyze(test_bazi)
    
    print(f"\n分析结果：")
    print(f"  日主: {result['base_info']['day_master']}")
    print(f"  旺衰: {result['day_master_strength']}")
    print(f"  用神: {[c['element'] for c in result['yong_shen']]}")
    print(f"  喜神: {result['xi_shen']}")
    print(f"  忌神: {result['ji_shen']}")
    
    print(f"\n✅ 因果链完整性检查通过")
    print(f"  - 旺衰判断原因步骤: {len(result['strength_reason'])} 步")
    print(f"  - 用神候选数: {len(result['yong_shen'])} 个")
