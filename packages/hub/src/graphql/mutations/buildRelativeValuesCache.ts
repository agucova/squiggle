import { builder } from "@/graphql/builder";
import { prisma } from "@/prisma";
import { cartesianProduct } from "@/relative-values/lib/utils";
import { relativeValuesItemsSchema } from "@/relative-values/types";
import { ModelEvaluator } from "@/relative-values/values/ModelEvaluator";
import { decodeGlobalID } from "@pothos/plugin-relay";
import { RelativeValuesExport } from "../types/RelativeValuesExport";

builder.mutationField("buildRelativeValuesCache", (t) =>
  t.withAuth({ user: true }).fieldWithInput({
    type: builder.simpleObject("BuildRelativeValuesCacheResult", {
      fields: (t) => ({
        relativeValuesExport: t.field({
          type: RelativeValuesExport,
          nullable: false,
        }),
      }),
    }),
    errors: {},
    input: {
      exportId: t.input.string({ required: true }),
    },
    resolve: async (_, { input }, { session }) => {
      const { typename, id: exportId } = decodeGlobalID(input.exportId);
      if (typename !== "RelativeValuesExport") {
        throw new Error("Expected RelativeValuesExport id");
      }

      const relativeValuesExport =
        await prisma.relativeValuesExport.findUniqueOrThrow({
          where: { id: exportId },
          include: {
            definition: {
              select: {
                currentRevision: {
                  select: {
                    items: true,
                  },
                },
              },
            },
            modelRevision: {
              select: {
                contentType: true,
                squiggleSnippet: true,
                model: {
                  select: {
                    owner: true,
                  },
                },
              },
            },
          },
        });

      const { modelRevision } = relativeValuesExport;

      if (modelRevision.model.owner.email !== session.user.email) {
        throw new Error("You don't own this model");
      }

      if (modelRevision.contentType !== "SquiggleSnippet") {
        throw new Error("Unsupported model revision content type");
      }

      const squiggleSnippet = modelRevision.squiggleSnippet;
      if (!squiggleSnippet) {
        throw new Error("Model content not found");
      }

      const evaluatorResult = await ModelEvaluator.create(squiggleSnippet.code);
      if (!evaluatorResult.ok) {
        throw new Error(
          `Failed to create evaluator: ${evaluatorResult.value.toString()}`
        );
      }
      const evaluator = evaluatorResult.value;

      const definitionRevision =
        relativeValuesExport.definition.currentRevision;
      if (!definitionRevision) {
        throw new Error("Definition revision not found");
      }

      const items = relativeValuesItemsSchema.parse(definitionRevision.items);
      const itemIds = items.map((item) => item.id);

      const existingCacheItems = await prisma.relativeValuesPairCache.findMany({
        where: {
          exportId,
        },
        select: {
          firstItem: true,
          secondItem: true,
        },
      });

      const seen: Record<string, Record<string, boolean>> = {};
      for (const row of existingCacheItems) {
        seen[row.firstItem] ??= {};
        seen[row.firstItem][row.secondItem] = true;
      }

      for (const [firstItem, secondItem] of cartesianProduct(
        itemIds,
        itemIds
      )) {
        if (seen[firstItem]?.[secondItem]) {
          continue; // already cached
        }
        const result = evaluator.compareWithoutCache(firstItem, secondItem);
        await prisma.relativeValuesPairCache.create({
          data: {
            exportId,
            firstItem,
            secondItem,
            ...(result.ok
              ? { result: result.value }
              : { error: result.value.toString() }),
          },
        });
      }

      const updatedRelativeValuesExport =
        await prisma.relativeValuesExport.findUniqueOrThrow({
          where: { id: exportId },
        });
      return { relativeValuesExport: updatedRelativeValuesExport };
    },
  })
);
