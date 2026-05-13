declare module 'lunar-javascript' {
  export interface SolarDate {
    getLunar(): LunarDate;
  }

  export interface LunarDate {
    getEightChar(): EightChar;
  }

  export interface EightChar {
    getYear(): string;
    getMonth(): string;
    getDay(): string;
    getTime(): string;
    getYun(gender: 0 | 1, sect?: 1 | 2): Yun;
  }

  export interface Yun {
    getDaYun(count?: number): DaYun[];
  }

  export interface DaYun {
    getStartAge(): number;
    getGanZhi(): string;
  }

  export const Solar: {
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
