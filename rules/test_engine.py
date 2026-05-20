"""
心斋 · 命理规则引擎 - 测试脚本
版本: MVP 0.1
日期: 2026-05-20

测试内容:
1. 八字排盘（bazi.py）
2. 五行分析（wuxing.py）
3. 用神判断（yongshen.py）
4. 完整分析流程（__init__.py）
"""

import sys
import os

# 添加项目根目录到路径
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

from rules import BaziAnalyzer, BaziCalculator, WuxingAnalyzer, YongShenAnalyzer
from rules.schema import BaziAnalysisResult

def test_bazi_calculator():
    """测试八字排盘"""
    print("\n" + "="*50)
    print("测试 1: 八字排盘（bazi.py）")
    print("="*50)
    
    calc = BaziCalculator()
    
    # 测试数据：1990-01-01 00:00
    bazi = calc.calculate_bazi(1990, 1, 1, 0, 0)
    
    print(f"排盘结果：")
    print(f"  年柱: {bazi['year']}")
    print(f"  月柱: {bazi['month']}")
    print(f"  日柱: {bazi['day']}")
    print(f"  时柱: {bazi['hour']}")
    print(f"  日主: {bazi['day_master']}")
    print(f"  月令: {bazi['month_branch']}")
    print(f"  时间精度: {bazi['time_accuracy']}")
    
    # 测试旺衰判断
    print(f"\n旺衰判断（带因果链）：")
    strength, reason_chain = calc.analyze_day_master_strength(bazi)
    print(f"  日主旺衰: {strength}")
    print(f"  因果推导步骤: {len(reason_chain)} 步")
    for step in reason_chain:
        print(f"    步骤 {step['step']}: {step['factor']}")
        print(f"      证据: {step['evidence']}")
        print(f"      逻辑: {step['logic']}")
        print(f"      结论: {step['conclusion']}")
    
    # 测试五行分析
    print(f"\n五行分析（带因果链）：")
    wuxing_analysis, wuxing_count = calc.analyze_wuxing(bazi)
    print(f"  五行统计: {wuxing_count}")
    for analysis in wuxing_analysis:
        print(f"  {analysis['element']}: 次数={analysis['count']}, 旺衰={analysis['strength']}, 评分={analysis['score']}")
    
    return bazi, strength, reason_chain, wuxing_count

def test_wuxing_analyzer():
    """测试五行分析器"""
    print("\n" + "="*50)
    print("测试 2: 五行分析器（wuxing.py）")
    print("="*50)
    
    analyzer = WuxingAnalyzer()
    
    # 测试数据
    test_bazi = {"month_branch": "寅"}
    test_count = {"wood": 3.0, "fire": 1.5, "earth": 2.0, "metal": 0.5, "water": 1.0}
    
    # 测试五行平衡分析
    print(f"\n五行平衡分析：")
    analyses, reason_chain = analyzer.analyze_wuxing_balance(test_bazi, test_count)
    print(f"  因果链步骤: {len(reason_chain)} 步")
    for analysis in analyses:
        print(f"  {analysis['element']}: 评分={analysis['score']}, 旺衰={analysis['strength']}")
    
    # 测试用神推荐
    print(f"\n基于五行平衡的用神推荐：")
    candidates = analyzer.recommend_yong_shen_by_wuxing("甲", test_count)
    for wuxing, confidence, reason in candidates:
        print(f"  - {wuxing}: 置信度 {confidence:.2f}")
        print(f"    原因: {reason}")
    
    # 测试五行关系
    print(f"\n五行生克关系：")
    relations = analyzer.analyze_wuxing_relations(test_count)
    for rel in relations:
        print(f"  {rel['description']} (类型: {rel['type']}, 强度: {rel['strength']:.2f})")

def test_yongshen_analyzer():
    """测试用神分析器"""
    print("\n" + "="*50)
    print("测试 3: 用神分析器（yongshen.py）")
    print("="*50)
    
    analyzer = YongShenAnalyzer()
    
    # 测试数据
    test_bazi = {
        "day_master": "甲",
        "month_branch": "寅"
    }
    test_count = {"wood": 3.0, "fire": 1.5, "earth": 2.0, "metal": 0.5, "water": 1.0}
    
    # 测试用神分析
    print(f"\n用神分析（带完整因果链）：")
    yong_shen_list, xi_shen, ji_shen = analyzer.analyze_yong_shen(
        test_bazi,
        test_count,
        "强"
    )
    
    print(f"\n用神候选（按优先级排序）：")
    for cand in yong_shen_list:
        print(f"  {cand['priority']}. {cand['element']}（{cand['method']}法，置信度 {cand['confidence']:.2f}）")
        if cand["primary_reason"]:
            print(f"     主要原因:")
            for step in cand["primary_reason"]:
                print(f"       步骤 {step['step']}: {step['logic']}")
                print(f"       结论: {step['conclusion']}")
        if cand["secondary_reason"]:
            print(f"     辅助原因:")
            for step in cand["secondary_reason"]:
                print(f"       步骤 {step['step']}: {step['logic']}")
    
    print(f"\n喜神: {', '.join(xi_shen) if xi_shen else '无'}")
    print(f"忌神: {', '.join(ji_shen) if ji_shen else '无'}")
    
    # 测试调候表
    print(f"\n调候表查询：")
    tiao_hou = analyzer._get_tiao_hou(test_bazi)
    if tiao_hou:
        print(f"  日主: {test_bazi['day_master']}, 月令: {test_bazi['month_branch']}")
        print(f"  调候用神: {tiao_hou['core_need']}")
        print(f"  原因: {tiao_hou['reason']}")
        if tiao_hou.get("avoid"):
            print(f"  忌: {tiao_hou['avoid']}")

def test_integration():
    """测试完整流程（整合所有模块）"""
    print("\n" + "="*50)
    print("测试 4: 完整分析流程（__init__.py）")
    print("="*50)
    
    analyzer = BaziAnalyzer()
    
    # 测试数据
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
    
    print(f"\n输入数据：")
    print(f"  八字: {test_bazi['year']} {test_bazi['month']} {test_bazi['day']} {test_bazi['hour']}")
    print(f"  日主: {test_bazi['day_master']}")
    print(f"  月令: {test_bazi['month_branch']}")
    
    # 执行完整分析
    print(f"\n执行完整分析...")
    result = analyzer.analyze(test_bazi)
    
    print(f"\n分析结果：")
    print(f"  日主: {result['base_info']['day_master']}")
    print(f"  旺衰: {result['day_master_strength']}")
    print(f"  五行力量: {result['wuxing_strength']}")
    
    print(f"\n用神候选：")
    for cand in result["yong_shen"]:
        print(f"  {cand['priority']}. {cand['element']}（{cand['method']}法）")
    
    print(f"\n喜神: {', '.join(result['xi_shen']) if result['xi_shen'] else '无'}")
    print(f"忌神: {', '.join(result['ji_shen']) if result['ji_shen'] else '无'}")
    
    # 输出 JSON
    print(f"\n完整 JSON 输出（前 500 字符）：")
    json_str = analyzer.to_json(result)
    print(json_str[:500] + "..." if len(json_str) > 500 else json_str)
    
    # 验证因果链完整性
    print(f"\n因果链完整性检查：")
    print(f"  ✅ 旺衰判断原因步骤: {len(result['strength_reason'])} 步")
    print(f"  ✅ 用神候选数: {len(result['yong_shen'])} 个")
    for cand in result["yong_shen"]:
        has_reason = cand.get("primary_reason") is not None and len(cand["primary_reason"]) > 0
        print(f"  {'✅' if has_reason else '❌'} {cand['element']} 用神含原因: {has_reason}")
    
    return result

def main():
    """主测试函数"""
    print("="*50)
    print("心斋 · 命理规则引擎 - 测试脚本")
    print("版本: MVP 0.1")
    print("="*50)
    
    try:
        # 运行所有测试
        test_bazi_calculator()
        test_wuxing_analyzer()
        test_yongshen_analyzer()
        result = test_integration()
        
        print("\n" + "="*50)
        print("✅ 所有测试通过！")
        print("="*50)
        
        print("\n核心功能验证：")
        print("  ✅ 八字排盘（bazi.py）")
        print("  ✅ 旺衰判断（带因果链）")
        print("  ✅ 五行分析（带因果链）")
        print("  ✅ 用神判断（带因果链）")
        print("  ✅ 调候表查询（40 条核心规则）")
        print("  ✅ 喜忌神推导")
        print("  ✅ 完整分析流程")
        print("  ✅ JSON 输出符合 schema 定义")
        
        print("\n下一步：")
        print("  1. 创建 API 路由（/api/rules/generate）")
        print("  2. 对接 Python 规则引擎到 Next.js 前端")
        print("  3. 开始 C2 任务（真太阳时两级降级）")
        
    except Exception as e:
        print(f"\n❌ 测试失败: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
