declare module 'lunar-javascript' {
  export class Solar {
    static fromYmd(year: number, month: number, day: number): Solar;
    static fromYmdHms(year: number, month: number, day: number, hour: number, minute: number, second?: number): Solar;
    getLunar(): Lunar;
  }

  export class Lunar {
    static fromYmd(year: number, month: number, day: number): Lunar;
    static fromSolar(solar: Solar): Lunar;
    getYearInGanZhi(): string;   // 返回 "甲子" 格式
    getMonthInGanZhi(): string;
    getDayInGanZhi(): string;
    getTimeInGanZhi(hourIndex: number): string;
    getSolar(): Solar;
  }
}
