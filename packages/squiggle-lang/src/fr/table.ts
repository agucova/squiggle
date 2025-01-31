import { makeDefinition } from "../library/registry/fnDefinition.js";
import {
  frAny,
  frArray,
  frDict,
  frLambda,
  frOptional,
  frString,
} from "../library/registry/frTypes.js";
import { FnFactory } from "../library/registry/helpers.js";
import { vTableChart } from "../value/index.js";

const maker = new FnFactory({
  nameSpace: "Table",
  requiresNamespace: true,
});

export const library = [
  maker.make({
    name: "make",
    output: "Plot",
    examples: [],
    definitions: [
      makeDefinition(
        [
          frDict(
            ["data", frArray(frAny)],
            [
              "columns",
              frArray(frDict(["fn", frLambda], ["name", frOptional(frString)])),
            ]
          ),
        ],
        ([{ data, columns }]) => {
          return vTableChart({
            data,
            columns: columns.map(({ fn, name }) => ({
              fn,
              name: name ?? undefined,
            })),
          });
        }
      ),
    ],
  }),
];
