import * as d3 from "d3";

type CustomFormat = "squiggle-default" | undefined;

// see lib/d3/index.ts
export const defaultTickFormatSpecifier: CustomFormat = "squiggle-default";

function isCustomFormat(
  specifier: string | undefined
): specifier is CustomFormat {
  return specifier === "squiggle-default" || specifier === undefined;
}

function squiggleDefaultFormat() {
  const locale = d3.formatLocale({
    decimal: ".",
    thousands: ",",
    grouping: [3],
    currency: ["$", ""],
    minus: "-",
  });
  const siFormat = locale.format(".9~s");
  const expFormat = locale.format(".9~e");
  const fixedFormat = locale.format(".9~f");

  return (d: d3.NumberValue) => {
    const abs = Math.abs(Number(d));
    if (abs === 0) {
      return fixedFormat(d);
    } else if (abs < 0.00001) {
      return expFormat(d);
    } else if (abs < 1e6) {
      return fixedFormat(d);
    } else if (abs < 1e9) {
      return siFormat(d);
    } else if (abs < 1e12) {
      return fixedFormat(Number(d) / 1e9) + "B";
    } else if (abs < 1e15) {
      return siFormat(d);
    } else {
      return expFormat(d);
    }
  };
}

function tickFormatWithCustom(
  start: number,
  stop: number,
  count: number,
  specifier: string | undefined
): ReturnType<typeof d3.tickFormat> {
  if (isCustomFormat(specifier)) {
    return squiggleDefaultFormat();
  }
  return d3.tickFormat(start, stop, count, specifier);
}

type ScaleLinear = d3.ScaleLinear<number, number, never>;
type ScaleLogarithmic = d3.ScaleLogarithmic<number, number, never>;
type ScaleSymLog = d3.ScaleSymLog<number, number, never>;
type ScalePower = d3.ScalePower<number, number, never>;

function patchLinearishTickFormat<
  T extends ScaleLinear | ScaleSymLog | ScalePower,
>(scale: T): T {
  // copy-pasted from https://github.com/d3/d3-scale/blob/83555bd759c7314420bd4240642beda5e258db9e/src/linear.js#L14
  scale.tickFormat = (count, specifier) => {
    const d = scale.domain();
    return tickFormatWithCustom(d[0], d[d.length - 1], count ?? 10, specifier);
  };

  return scale;
}

function patchSymlogTickFormat(scale: ScaleSymLog): ScaleSymLog {
  return patchLinearishTickFormat(scale);
}

function patchLogarithmicTickFormat(scale: ScaleLogarithmic): ScaleLogarithmic {
  const logScaleTickFormat = scale.tickFormat;
  scale.tickFormat = (count, specifier) => {
    return logScaleTickFormat(
      count,
      isCustomFormat(specifier)
        ? // Log scale tickFormat method supports functions, but @types/d3 is not aware of that:
          // https://github.com/d3/d3-scale/blob/83555bd759c7314420bd4240642beda5e258db9e/src/log.js#L109
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (squiggleDefaultFormat() as any)
        : specifier
    );
  };
  return scale;
}

// Original d3.scale* should never be used; they won't support our custom tick formats.

export function scaleLinear() {
  return patchLinearishTickFormat(d3.scaleLinear());
}

export function scaleSymlog() {
  return patchSymlogTickFormat(d3.scaleSymlog());
}

export function scalePow() {
  return patchLinearishTickFormat(d3.scalePow());
}

export function scaleLog() {
  return patchLogarithmicTickFormat(d3.scaleLog());
}
