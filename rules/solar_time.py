"""
心斋 · 真太阳时引擎 - 两级降级
版本: MVP 0.1
日期: 2026-05-20

设计原则:
- L1 缺省：不弹窗要定位，直接用北京时间排盘，标记 time_accuracy: "standard"
- L2 高精：用户主动输入城市/经纬度才计算均时差，标记 time_accuracy: "high"
- 用户无感：两级结果差异通常 < 1 时辰，不影响用户体验

算法:
  真太阳时 = 北京时间 + (120° - 本地经度) × 4min/° + 均时差(Equation of Time)

均时差(EoT)计算使用简化公式，精度 ±30秒，足够命理排盘使用。
"""

import math
from typing import Tuple, Optional, Dict
from datetime import datetime, timedelta

# ============ 城市经纬度数据库 ============

CITY_DB: Dict[str, Dict] = {
    # 直辖市
    "北京": {"lng": 116.4074, "lat": 39.9042, "province": "北京"},
    "上海": {"lng": 121.4737, "lat": 31.2304, "province": "上海"},
    "天津": {"lng": 117.1901, "lat": 39.1256, "province": "天津"},
    "重庆": {"lng": 106.5516, "lat": 29.5630, "province": "重庆"},
    # 省会城市
    "哈尔滨": {"lng": 126.6424, "lat": 45.7567, "province": "黑龙江"},
    "长春": {"lng": 125.3245, "lat": 43.8868, "province": "吉林"},
    "沈阳": {"lng": 123.4315, "lat": 41.8057, "province": "辽宁"},
    "呼和浩特": {"lng": 111.7510, "lat": 40.8424, "province": "内蒙古"},
    "石家庄": {"lng": 114.5149, "lat": 38.0428, "province": "河北"},
    "太原": {"lng": 112.5489, "lat": 37.8706, "province": "山西"},
    "济南": {"lng": 117.1205, "lat": 36.6510, "province": "山东"},
    "郑州": {"lng": 113.6254, "lat": 34.7466, "province": "河南"},
    "西安": {"lng": 108.9402, "lat": 34.3416, "province": "陕西"},
    "兰州": {"lng": 103.8343, "lat": 36.0611, "province": "甘肃"},
    "西宁": {"lng": 101.7782, "lat": 36.6171, "province": "青海"},
    "银川": {"lng": 106.2782, "lat": 38.4872, "province": "宁夏"},
    "乌鲁木齐": {"lng": 87.6177, "lat": 43.7928, "province": "新疆"},
    "合肥": {"lng": 117.2272, "lat": 31.8206, "province": "安徽"},
    "南京": {"lng": 118.7969, "lat": 32.0603, "province": "江苏"},
    "杭州": {"lng": 120.1551, "lat": 30.2741, "province": "浙江"},
    "南昌": {"lng": 115.8581, "lat": 28.6820, "province": "江西"},
    "武汉": {"lng": 114.3054, "lat": 30.5931, "province": "湖北"},
    "长沙": {"lng": 112.9388, "lat": 28.2282, "province": "湖南"},
    "成都": {"lng": 104.0665, "lat": 30.5728, "province": "四川"},
    "贵阳": {"lng": 106.6302, "lat": 26.6477, "province": "贵州"},
    "昆明": {"lng": 102.8329, "lat": 25.0389, "province": "云南"},
    "拉萨": {"lng": 91.1322, "lat": 29.6600, "province": "西藏"},
    "广州": {"lng": 113.2644, "lat": 23.1291, "province": "广东"},
    "南宁": {"lng": 108.3200, "lat": 22.8240, "province": "广西"},
    "海口": {"lng": 110.3500, "lat": 20.0200, "province": "海南"},
    "福州": {"lng": 119.2965, "lat": 26.0745, "province": "福建"},
    "台北": {"lng": 121.5654, "lat": 25.0330, "province": "台湾"},
    # 重要城市
    "深圳": {"lng": 114.0579, "lat": 22.5431, "province": "广东"},
    "苏州": {"lng": 120.5853, "lat": 31.2989, "province": "江苏"},
    "无锡": {"lng": 120.3119, "lat": 31.4912, "province": "江苏"},
    "宁波": {"lng": 121.5440, "lat": 29.8683, "province": "浙江"},
    "温州": {"lng": 120.6994, "lat": 28.0006, "province": "浙江"},
    "东莞": {"lng": 113.7518, "lat": 23.0209, "province": "广东"},
    "佛山": {"lng": 113.1218, "lat": 23.0219, "province": "广东"},
    "珠海": {"lng": 113.5528, "lat": 22.2559, "province": "广东"},
    "厦门": {"lng": 118.0894, "lat": 24.4798, "province": "福建"},
    "青岛": {"lng": 120.3826, "lat": 36.0671, "province": "山东"},
    "大连": {"lng": 121.6147, "lat": 38.9140, "province": "辽宁"},
    "烟台": {"lng": 121.3913, "lat": 37.5393, "province": "山东"},
    "徐州": {"lng": 117.1848, "lat": 34.2618, "province": "江苏"},
    "常州": {"lng": 119.9741, "lat": 31.8118, "province": "江苏"},
    "保定": {"lng": 115.4646, "lat": 38.8739, "province": "河北"},
    "唐山": {"lng": 118.1753, "lat": 39.6351, "province": "河北"},
    "洛阳": {"lng": 112.4539, "lat": 34.6197, "province": "河南"},
    "开封": {"lng": 114.3075, "lat": 34.7972, "province": "河南"},
    "桂林": {"lng": 110.2992, "lat": 25.2740, "province": "广西"},
    "丽江": {"lng": 100.2330, "lat": 26.8721, "province": "云南"},
    "大理": {"lng": 100.2250, "lat": 25.5889, "province": "云南"},
    "咸阳": {"lng": 108.7055, "lat": 34.3296, "province": "陕西"},
    "秦皇岛": {"lng": 119.5860, "lat": 39.9425, "province": "河北"},
    "扬州": {"lng": 119.4130, "lat": 32.3944, "province": "江苏"},
    "绍兴": {"lng": 120.5801, "lat": 30.0300, "province": "浙江"},
    "泉州": {"lng": 118.5894, "lat": 24.9089, "province": "福建"},
    "漳州": {"lng": 117.6471, "lat": 24.5131, "province": "福建"},
    "潍坊": {"lng": 119.1071, "lat": 36.7073, "province": "山东"},
    "中山": {"lng": 113.3929, "lat": 22.5176, "province": "广东"},
    "惠州": {"lng": 114.4120, "lat": 23.0794, "province": "广东"},
    "汕头": {"lng": 116.6814, "lat": 23.3540, "province": "广东"},
    # 港澳
    "香港": {"lng": 114.1694, "lat": 22.3193, "province": "香港"},
    "澳门": {"lng": 113.5439, "lat": 22.1987, "province": "澳门"},
    # 海外华人常用城市
    "新加坡": {"lng": 103.8198, "lat": 1.3521, "province": "新加坡"},
    "东京": {"lng": 139.6917, "lat": 35.6895, "province": "日本"},
    "首尔": {"lng": 126.9780, "lat": 37.5665, "province": "韩国"},
    "曼谷": {"lng": 100.5018, "lat": 13.7563, "province": "泰国"},
    "纽约": {"lng": -74.0060, "lat": 40.7128, "province": "美国"},
    "洛杉矶": {"lng": -118.2437, "lat": 34.0522, "province": "美国"},
    "旧金山": {"lng": -122.4194, "lat": 37.7749, "province": "美国"},
    "温哥华": {"lng": -123.1207, "lat": 49.2827, "province": "加拿大"},
    "悉尼": {"lng": 151.2093, "lat": -33.8688, "province": "澳大利亚"},
    "伦敦": {"lng": -0.1278, "lat": 51.5074, "province": "英国"},
    "巴黎": {"lng": 2.3522, "lat": 48.8566, "province": "法国"},
}


# ============ 均时差计算（Equation of Time） ============

def equation_of_time(day_of_year: int) -> float:
    """
    计算均时差（分钟）
    
    使用简化公式，精度 ±30秒，足够命理排盘使用
    
    Args:
        day_of_year: 一年中的第几天（1-365）
    
    Returns:
        均时差（分钟），可正可负
    
    参考:
        https://en.wikipedia.org/wiki/Equation_of_time
        简化公式来源：NOAA Solar Calculator
    """
    # 角度转弧度
    B = math.radians(360.0 / 365.0 * (day_of_year - 81))
    
    # 均时差（分钟）
    eot = 9.87 * math.sin(2 * B) - 7.53 * math.cos(B) - 1.5 * math.sin(B)
    
    return eot


def get_day_of_year(dt: datetime) -> int:
    """获取一年中的第几天"""
    return dt.timetuple().tm_yday


# ============ 真太阳时计算 ============

class SolarTimeEngine:
    """
    真太阳时引擎
    
    两级降级设计:
    - L1: 标准模式，直接使用北京时间，不做任何修正
    - L2: 高精模式，根据经度+均时差计算真太阳时
    """
    
    def __init__(self):
        self.city_db = CITY_DB
    
    def calculate(
        self,
        year: int,
        month: int,
        day: int,
        hour: int,
        minute: int,
        longitude: Optional[float] = None,
        latitude: Optional[float] = None,
        city: Optional[str] = None
    ) -> Dict:
        """
        计算真太阳时（主入口）
        
        Args:
            year/month/day/hour/minute: 北京时间
            longitude: 经度（可选，L2 模式）
            latitude: 纬度（可选，L2 模式）
            city: 城市名（可选，自动查经纬度）
        
        Returns:
            {
                "solar_time": datetime,        # 真太阳时
                "bj_time": datetime,           # 北京时间
                "time_accuracy": "standard"|"high",
                "longitude": float|None,       # 使用的经度
                "lng_correction_min": float,   # 经度修正（分钟）
                "eot_correction_min": float,   # 均时差修正（分钟）
                "total_correction_min": float, # 总修正（分钟）
                "reason": list                 # 因果链
            }
        """
        bj_time = datetime(year, month, day, hour, minute)
        reason_chain = []
        
        # L1 模式：无经度信息，直接返回北京时间
        if longitude is None and city is None:
            return {
                "solar_time": bj_time,
                "bj_time": bj_time,
                "time_accuracy": "standard",
                "longitude": None,
                "lng_correction_min": 0.0,
                "eot_correction_min": 0.0,
                "total_correction_min": 0.0,
                "reason": [
                    {
                        "step": 1,
                        "factor": "时间精度",
                        "evidence": "未提供经度/城市信息",
                        "logic": "L1 缺省模式，直接使用北京时间排盘",
                        "conclusion": "time_accuracy: standard，修正量 = 0 分钟"
                    }
                ]
            }
        
        # L2 模式：有经度或城市信息
        # 步骤 1：确定经度
        if longitude is None and city is not None:
            city_info = self.lookup_city(city)
            if city_info:
                longitude = city_info["lng"]
                latitude = city_info["lat"]
                step1 = {
                    "step": 1,
                    "factor": "城市查经度",
                    "evidence": f"城市: {city}",
                    "logic": f"查询城市数据库，获取经度 {longitude}°",
                    "conclusion": f"经度 = {longitude}°"
                }
            else:
                # 城市未找到，降级到 L1
                return {
                    "solar_time": bj_time,
                    "bj_time": bj_time,
                    "time_accuracy": "standard",
                    "longitude": None,
                    "lng_correction_min": 0.0,
                    "eot_correction_min": 0.0,
                    "total_correction_min": 0.0,
                    "reason": [
                        {
                            "step": 1,
                            "factor": "城市未找到",
                            "evidence": f"城市 '{city}' 不在数据库中",
                            "logic": "降级到 L1 标准模式",
                            "conclusion": "time_accuracy: standard，修正量 = 0 分钟"
                        }
                    ]
                }
        else:
            step1 = {
                "step": 1,
                "factor": "直接输入经度",
                "evidence": f"经度: {longitude}°",
                "logic": "用户直接提供经度",
                "conclusion": f"经度 = {longitude}°"
            }
        
        reason_chain.append(step1)
        
        # 步骤 2：计算经度修正
        # 北京时间 = UTC+8，对应东经 120°
        # 经度修正 = (120° - 本地经度) × 4 分钟/度
        lng_correction = (120.0 - longitude) * 4.0  # 分钟
        
        step2 = {
            "step": 2,
            "factor": "经度修正",
            "evidence": f"东经120° - 东经{longitude}° = {120.0 - longitude:.4f}°",
            "logic": f"每度差4分钟，修正 = {120.0 - longitude:.4f}° × 4 = {lng_correction:.2f} 分钟",
            "conclusion": f"经度修正 = {lng_correction:+.2f} 分钟"
        }
        reason_chain.append(step2)
        
        # 步骤 3：计算均时差
        day_of_year = get_day_of_year(bj_time)
        eot = equation_of_time(day_of_year)
        
        step3 = {
            "step": 3,
            "factor": "均时差",
            "evidence": f"一年中第 {day_of_year} 天",
            "logic": f"使用简化公式计算均时差 = {eot:.2f} 分钟",
            "conclusion": f"均时差修正 = {eot:+.2f} 分钟"
        }
        reason_chain.append(step3)
        
        # 步骤 4：计算总修正 + 真太阳时
        total_correction = lng_correction + eot  # 分钟
        solar_time = bj_time + timedelta(minutes=total_correction)
        
        step4 = {
            "step": 4,
            "factor": "总修正",
            "evidence": f"经度修正 {lng_correction:+.2f} + 均时差 {eot:+.2f} = {total_correction:+.2f} 分钟",
            "logic": f"真太阳时 = 北京时间 {bj_time.strftime('%H:%M')} + {total_correction:+.2f} 分钟",
            "conclusion": f"真太阳时 = {solar_time.strftime('%Y-%m-%d %H:%M')}（修正 {total_correction:+.2f} 分钟）"
        }
        reason_chain.append(step4)
        
        return {
            "solar_time": solar_time,
            "bj_time": bj_time,
            "time_accuracy": "high",
            "longitude": longitude,
            "lng_correction_min": round(lng_correction, 2),
            "eot_correction_min": round(eot, 2),
            "total_correction_min": round(total_correction, 2),
            "reason": reason_chain
        }
    
    def lookup_city(self, city_name: str) -> Optional[Dict]:
        """
        查找城市信息
        
        支持模糊匹配（包含关系）
        """
        # 精确匹配
        if city_name in self.city_db:
            return self.city_db[city_name]
        
        # 模糊匹配：去掉"市"字后匹配
        stripped = city_name.rstrip("市")
        if stripped in self.city_db:
            return self.city_db[stripped]
        
        # 模糊匹配：包含关系
        for name, info in self.city_db.items():
            if city_name in name or name in city_name:
                return info
        
        return None
    
    def get_time_shift_info(self, result: Dict) -> Dict:
        """
        获取时辰偏移信息（用于前端提示）
        
        Returns:
            {
                "shifted_hour": bool,       # 是否跨时辰
                "original_shichen": str,    # 原始时辰
                "adjusted_shichen": str,    # 修正后时辰
                "difference_min": float,    # 差异分钟数
                "message": str              # 用户提示信息
            }
        """
        from .bazi import DI_ZHI
        
        bj_hour = result["bj_time"].hour
        solar_hour = result["solar_time"].hour
        
        # 时辰计算：23点起子时，每2小时一个时辰
        def hour_to_shichen(h: int) -> str:
            idx = ((h + 1) // 2) % 12
            return DI_ZHI[idx] + "时"
        
        original = hour_to_shichen(bj_hour)
        adjusted = hour_to_shichen(solar_hour)
        total_min = result.get("total_correction_min", 0)
        
        shifted = original != adjusted
        
        if not shifted:
            message = f"真太阳时修正 {total_min:+.1f} 分钟，时辰不变（{adjusted}）"
        else:
            message = f"真太阳时修正 {total_min:+.1f} 分钟，时辰从 {original} 调整为 {adjusted}"
        
        return {
            "shifted_hour": shifted,
            "original_shichen": original,
            "adjusted_shichen": adjusted,
            "difference_min": total_min,
            "message": message
        }


# ============ 测试 ============

if __name__ == "__main__":
    print("✅ 真太阳时引擎加载成功")
    print("\n两级降级设计：")
    print("  L1 缺省：直接用北京时间，time_accuracy: standard")
    print("  L2 高精：经度修正 + 均时差，time_accuracy: high")
    
    engine = SolarTimeEngine()
    
    # 测试 1：L1 模式（无经度）
    print("\n--- 测试 1: L1 标准模式（无经度）---")
    result = engine.calculate(1990, 6, 15, 14, 30)
    print(f"  北京时间: {result['bj_time'].strftime('%Y-%m-%d %H:%M')}")
    print(f"  真太阳时: {result['solar_time'].strftime('%Y-%m-%d %H:%M')}")
    print(f"  精度: {result['time_accuracy']}")
    print(f"  修正: {result['total_correction_min']} 分钟")
    print(f"  因果链: {len(result['reason'])} 步")
    
    # 测试 2：L2 模式（城市名）
    print("\n--- 测试 2: L2 高精模式（城市：成都）---")
    result = engine.calculate(1990, 6, 15, 14, 30, city="成都")
    print(f"  北京时间: {result['bj_time'].strftime('%Y-%m-%d %H:%M')}")
    print(f"  真太阳时: {result['solar_time'].strftime('%Y-%m-%d %H:%M')}")
    print(f"  精度: {result['time_accuracy']}")
    print(f"  经度修正: {result['lng_correction_min']:+.2f} 分钟")
    print(f"  均时差: {result['eot_correction_min']:+.2f} 分钟")
    print(f"  总修正: {result['total_correction_min']:+.2f} 分钟")
    print(f"  因果链:")
    for step in result["reason"]:
        print(f"    步骤 {step['step']}: {step['factor']}")
        print(f"      证据: {step['evidence']}")
        print(f"      结论: {step['conclusion']}")
    
    # 测试 3：L2 模式（直接经度）- 乌鲁木齐
    print("\n--- 测试 3: L2 高精模式（乌鲁木齐，东经87.6°）---")
    result = engine.calculate(1990, 6, 15, 14, 30, city="乌鲁木齐")
    print(f"  北京时间: {result['bj_time'].strftime('%Y-%m-%d %H:%M')}")
    print(f"  真太阳时: {result['solar_time'].strftime('%Y-%m-%d %H:%M')}")
    print(f"  总修正: {result['total_correction_min']:+.2f} 分钟")
    
    # 时辰偏移检查
    shift_info = engine.get_time_shift_info(result)
    print(f"  时辰偏移: {shift_info['message']}")
    print(f"  是否跨时辰: {shift_info['shifted_hour']}")
    
    # 测试 4：城市查询
    print("\n--- 测试 4: 城市数据库查询 ---")
    for city in ["北京", "成都市", "深圳", "纽约", "不存在的城市"]:
        info = engine.lookup_city(city)
        if info:
            print(f"  ✅ {city}: 东经 {info['lng']}°, 北纬 {info['lat']}°")
        else:
            print(f"  ❌ {city}: 未找到")
    
    # 测试 5：均时差全年范围
    print("\n--- 测试 5: 均时差全年范围 ---")
    max_eot = 0
    min_eot = 0
    max_day = 1
    min_day = 1
    for d in range(1, 366):
        eot = equation_of_time(d)
        if eot > max_eot:
            max_eot = eot
            max_day = d
        if eot < min_eot:
            min_eot = eot
            min_day = d
    print(f"  最大正偏: +{max_eot:.2f} 分钟（第 {max_day} 天）")
    print(f"  最大负偏: {min_eot:.2f} 分钟（第 {min_day} 天）")
    print(f"  全年范围: {max_eot - min_eot:.2f} 分钟（约 {(max_eot - min_eot)/60:.1f} 小时）")
