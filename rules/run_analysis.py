#!/usr/bin/env python3
"""
心斋 · 规则引擎 CLI 入口
供 Next.js API 路由调用

用法:
  python3 rules/run_analysis.py --year 1990 --month 6 --day 15 --hour 14 --minute 30 [--city 成都] [--longitude 104.07] [--gender male]

输出:
  JSON 格式的完整分析结果（含因果链）
"""

import sys
import os
import json
import argparse

# 添加项目根目录到路径
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

from rules import BaziAnalyzer
from rules.solar_time import SolarTimeEngine
from rules.bazi import BaziCalculator

def main():
    parser = argparse.ArgumentParser(description='心斋规则引擎')
    parser.add_argument('--year', type=int, required=True)
    parser.add_argument('--month', type=int, required=True)
    parser.add_argument('--day', type=int, required=True)
    parser.add_argument('--hour', type=int, default=12)
    parser.add_argument('--minute', type=int, default=0)
    parser.add_argument('--gender', type=str, default=None)
    parser.add_argument('--city', type=str, default=None)
    parser.add_argument('--longitude', type=float, default=None)
    parser.add_argument('--latitude', type=float, default=None)
    
    args = parser.parse_args()
    
    # 1. 计算真太阳时
    solar_engine = SolarTimeEngine()
    solar_result = solar_engine.calculate(
        year=args.year,
        month=args.month,
        day=args.day,
        hour=args.hour,
        minute=args.minute,
        longitude=args.longitude,
        latitude=args.latitude,
        city=args.city
    )
    
    # 使用真太阳时作为排盘时间
    solar_time = solar_result["solar_time"]
    time_accuracy = solar_result["time_accuracy"]
    
    # 2. 排盘（MVP: 使用简化算法，后续接入 lunar-python）
    # TODO: 接入农历库进行精确排盘
    # 目前使用 BaziCalculator 的示例数据
    calc = BaziCalculator()
    bazi = calc.calculate_bazi(
        year=solar_time.year,
        month=solar_time.month,
        day=solar_time.day,
        hour=solar_time.hour,
        minute=solar_time.minute,
        longitude=args.longitude,
        latitude=args.latitude
    )
    
    # 补充时间精度标记
    bazi["time_accuracy"] = time_accuracy
    
    # 3. 执行完整分析
    analyzer = BaziAnalyzer()
    analysis = analyzer.analyze(bazi)
    
    # 4. 序列化 datetime 对象
    solar_time_json = {
        "bj_time": solar_result["bj_time"].strftime("%Y-%m-%d %H:%M"),
        "solar_time": solar_result["solar_time"].strftime("%Y-%m-%d %H:%M"),
        "time_accuracy": time_accuracy,
        "longitude": solar_result.get("longitude"),
        "lng_correction_min": solar_result.get("lng_correction_min", 0),
        "eot_correction_min": solar_result.get("eot_correction_min", 0),
        "total_correction_min": solar_result.get("total_correction_min", 0),
        "reason": solar_result.get("reason", [])
    }
    
    # 时辰偏移信息
    if time_accuracy == "high":
        shift_info = solar_engine.get_time_shift_info(solar_result)
        solar_time_json["shift_info"] = shift_info
    
    # 5. 输出 JSON
    output = {
        "analysis": analysis,
        "solar_time": solar_time_json,
        "time_accuracy": time_accuracy
    }
    
    print(json.dumps(output, ensure_ascii=False))


if __name__ == "__main__":
    main()
