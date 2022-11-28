import { makeDefinition } from "../library/registry/fnDefinition";
import {
  frAny,
  frArray,
  frDict,
  frLambda,
  frString,
  frTuple2,
} from "../library/registry/frTypes";
import { FnFactory } from "../library/registry/helpers";
import { doLambdaCall } from "../reducer/Lambda";
import { Ok } from "../rsResult";
import { ImmutableMap } from "../utility/immutableMap";
import { vArray, vRecord, vString } from "../value";

const maker = new FnFactory({
  nameSpace: "Dict",
  requiresNamespace: true,
});

export const library = [
  maker.make({
    name: "set",
    // ~output=EvtRecord,
    examples: [`Dict.set({a: 1, b: 2}, "c", 3)`],
    definitions: [
      makeDefinition(
        "set",
        [frDict(frAny), frString, frAny],
        ([dict, key, value]) => Ok(vRecord(dict.set(key, value)))
      ),
    ],
  }),
  maker.make({
    name: "merge",
    // ~output=EvtRecord,
    examples: [`Dict.merge({a: 1, b: 2}, {c: 3, d: 4})`],
    definitions: [
      makeDefinition("merge", [frDict(frAny), frDict(frAny)], ([d1, d2]) =>
        Ok(vRecord(ImmutableMap.fromArray([...d1.entries(), ...d2.entries()])))
      ),
    ],
  }),
  maker.make({
    name: "mergeMany",
    // ~output=EvtRecord,
    examples: [`Dict.mergeMany([{a: 1, b: 2}, {c: 3, d: 4}])`],
    definitions: [
      makeDefinition("mergeMany", [frArray(frDict(frAny))], ([dicts]) =>
        Ok(
          vRecord(
            ImmutableMap.fromArray(dicts.map((d) => [...d.entries()]).flat())
          )
        )
      ),
    ],
  }),
  maker.make({
    name: "keys",
    // ~output=EvtArray,
    examples: [`Dict.keys({a: 1, b: 2})`],
    definitions: [
      makeDefinition("keys", [frDict(frAny)], ([d1]) =>
        Ok(vArray([...d1.keys()].map((k) => vString(k))))
      ),
    ],
  }),
  maker.make({
    name: "values",
    // output:EvtArray,
    examples: [`Dict.values({a: 1, b: 2})`],
    definitions: [
      makeDefinition("values", [frDict(frAny)], ([d1]) =>
        Ok(vArray([...d1.values()]))
      ),
    ],
  }),
  maker.make({
    name: "toList",
    // ~output=EvtArray,
    examples: [`Dict.toList({a: 1, b: 2})`],
    definitions: [
      makeDefinition("toList", [frDict(frAny)], ([dict]) =>
        Ok(vArray([...dict.entries()].map(([k, v]) => vArray([vString(k), v]))))
      ),
    ],
  }),
  maker.make({
    name: "fromList",
    // ~output=EvtRecord,
    examples: [`Dict.fromList([["a", 1], ["b", 2]])`],
    definitions: [
      makeDefinition(
        "fromList",
        [frArray(frTuple2(frString, frAny))],
        ([items]) => Ok(vRecord(ImmutableMap.fromArray(items)))
      ),
    ],
  }),
  maker.make({
    name: "map",
    // ~output=EvtRecord,
    examples: [`Dict.map({a: 1, b: 2}, {|x| x + 1})`],
    definitions: [
      makeDefinition(
        "map",
        [frDict(frAny), frLambda],
        ([dict, lambda], context, reducer) => {
          return Ok(
            vRecord(
              ImmutableMap.fromArray(
                [...dict.entries()].map(([key, value]) => {
                  const mappedValue = doLambdaCall(
                    lambda,
                    [value],
                    context,
                    reducer
                  );
                  return [key, mappedValue];
                })
              )
            )
          );
        }
      ),
    ],
  }),
];
