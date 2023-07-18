import { evaluateStringToResult } from "../../src/reducer/index.js";
import { Plot } from "../../src/value/index.js";
import { testEvalToBe, testEvalToMatch } from "../helpers/reducerHelpers.js";

async function testPlotResult<T extends Plot["type"]>(
  name: string,
  code: string,
  type: T,
  cb: (plot: Extract<Plot, { type: T }>) => void
) {
  test(name, async () => {
    const result = await evaluateStringToResult(code);
    if (!result.ok) {
      fail("Expected ok result");
    }
    if (result.value.type !== "Plot" || result.value.value.type !== type) {
      fail("Expected numericFn plot");
    }
    cb(result.value.value as Extract<Plot, { type: T }>);
  });
}

describe("Plot", () => {
  describe("Plot.dists", () => {
    testEvalToBe(
      'Plot.dists({dists: [{name: "dist1", value: 2}, {name: "dist2", value: 2 to 5}]})',
      "Plot containing dist1, dist2"
    );
  });

  describe("Plot.numericFn", () => {
    testEvalToMatch(
      `Plot.numericFn({
        fn: {|x| x * 5}
      })`,
      "Plot for numeric function"
    );

    testEvalToMatch(
      `Plot.numericFn({
        fn: {|x| x * 5}
      })`,
      "Plot for numeric function"
    );

    testEvalToMatch(
      `Plot.numericFn({
        fn: {|x, y| x * y}
      })`,
      "Expected a function with one parameter"
    );

    testPlotResult(
      "default scale based on domain",
      `Plot.numericFn({
        fn: {|x: [3, 5]| x * 5}
      })`,
      "numericFn",
      (plot) => {
        expect(plot.xScale.type).toBe("linear");
        expect(plot.xScale.min).toBe(3);
        expect(plot.xScale.max).toBe(5);
      }
    );

    testPlotResult(
      "explicit scale with min/max ignores the domain",
      `Plot.numericFn({
        fn: {|x: [3, 5]| x * 5},
        xScale: Scale.linear({ min: 100, max: 200 })
      })`,
      "numericFn",
      (plot) => {
        expect(plot.xScale.type).toBe("linear");
        expect(plot.xScale.min).toBe(100);
        expect(plot.xScale.max).toBe(200);
      }
    );

    testPlotResult(
      "scale without min/max inherits domain boundaries",
      `Plot.numericFn({
        fn: {|x: [3, 5]| x * 5},
        xScale: Scale.log()
      })`,
      "numericFn",
      (plot) => {
        expect(plot.xScale.type).toBe("log");
        expect(plot.xScale.min).toBe(3);
        expect(plot.xScale.max).toBe(5);
      }
    );

    testEvalToMatch(
      `Plot.numericFn({
        fn: {|x| x * 5},
        xScale: Scale.linear({ min: 100 })
      })`,
      "'max' and 'min' should either be simultaneously set or unset on xScale for a function plot"
    );

    testEvalToMatch(
      `Plot.numericFn({
        fn: {|x| x * 5},
        xScale: Scale.linear({ max: 100 })
      })`,
      "'max' and 'min' should either be simultaneously set or unset on xScale for a function plot"
    );

    testPlotResult(
      "scale with one of min/max inherits domain boundaries",
      `Plot.numericFn({
        fn: {|x: [3, 5]| x * 5},
        xScale: Scale.log({ min: 100 })
      })`,
      "numericFn",
      (plot) => {
        expect(plot.xScale.type).toBe("log");
        expect(plot.xScale.min).toBe(100);
        expect(plot.xScale.max).toBe(5);
      }
    );
  });

  describe("Plot.distFn", () => {
    testEvalToMatch(
      `Plot.distFn({
        fn: {|x| x to x + 1}
       })`,
      "Plot for dist function"
    );

    testEvalToMatch(
      `Plot.distFn({
        fn: {|x,y| x to x + y}
       })`,
      "Expected a function with one parameter"
    );
  });

  testPlotResult(
    "default scale based on domain",
    `Plot.distFn({
        fn: {|x: [3, 5]| uniform(x, x + 1)}
      })`,
    "distFn",
    (plot) => {
      expect(plot.xScale.type).toBe("linear");
      expect(plot.xScale.min).toBe(3);
      expect(plot.xScale.max).toBe(5);
    }
  );

  testPlotResult(
    "explicit scale with min/max ignores the domain",
    `Plot.distFn({
        fn: {|x: [3, 5]| uniform(x, x + 1)},
        xScale: Scale.linear({ min: 100, max: 200 })
      })`,
    "distFn",
    (plot) => {
      expect(plot.xScale.type).toBe("linear");
      expect(plot.xScale.min).toBe(100);
      expect(plot.xScale.max).toBe(200);
    }
  );
});
