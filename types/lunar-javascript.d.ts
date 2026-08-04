declare module 'lunar-javascript' {
  export interface SolarDate {
    getLunar(): LunarDate;
    getYear(): number;
    getMonth(): number;
    getDay(): number;
    getHour(): number;
    getMinute(): number;
    getSecond(): number;
    toYmd(): string;
    toYmdHms(): string;
  }

  export interface LunarDate {
    getEightChar(): EightChar;
    toString(): string;
    getYearInGanZhi(): string;
    getYearInGanZhiExact(): string;
    getMonthInGanZhi(): string;
    getMonthInGanZhiExact(): string;
    getDayInGanZhi(): string;
    getDayInGanZhiExact(): string;
    getPrevJie(wholeDay?: boolean): JieQi;
    getNextJie(wholeDay?: boolean): JieQi;
    getShengxiao(): string;
    getChongDesc(): string;
    getSha(): string;
    getDayYi(sect?: 1 | 2): string[];
    getDayJi(sect?: 1 | 2): string[];
    getDayJiShen(): string[];
    getXiu(): string;
    getXiuLuck(): string;
    getPengZuGan(): string;
    getPengZuZhi(): string;
  }

  export interface EightChar {
    getYear(): string;
    getMonth(): string;
    getDay(): string;
    getTime(): string;
    getYun(gender: 0 | 1, sect?: 1 | 2): Yun;
  }

  export interface Yun {
    getStartSolar(): SolarDate;
    getDaYun(count?: number): DaYun[];
  }

  export interface DaYun {
    getIndex(): number;
    getStartYear(): number;
    getEndYear(): number;
    getStartAge(): number;
    getGanZhi(): string;
  }

  export interface JieQi {
    getName(): string;
    getSolar(): SolarDate;
  }

  export const Solar: {
    fromYmd(year: number, month: number, day: number): SolarDate;
    fromYmdHms(
      year: number,
      month: number,
      day: number,
      hour: number,
      minute: number,
      second: number,
    ): SolarDate;
  };
}
