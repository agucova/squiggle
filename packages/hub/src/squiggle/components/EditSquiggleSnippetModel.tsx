import { useSession } from "next-auth/react";
import { FC, useMemo } from "react";
import { FormProvider, useFieldArray, useForm } from "react-hook-form";
import { graphql, useFragment, useMutation } from "react-relay";

import {
  PlaygroundToolbarItem,
  SquigglePlayground,
} from "@quri/squiggle-components";
import { Button, LinkIcon, useToast } from "@quri/ui";

import {
  EditSquiggleSnippetModelMutation,
  RelativeValuesExportInput,
} from "@/__generated__/EditSquiggleSnippetModelMutation.graphql";
import { ModelPage$key } from "@/__generated__/ModelPage.graphql";
import { ModelRevision$key } from "@/__generated__/ModelRevision.graphql";
import { SquiggleContent$key } from "@/__generated__/SquiggleContent.graphql";
import { ModelPageFragment } from "@/app/users/[username]/models/[slug]/ModelPage";
import { ModelRevisionFragment } from "@/app/users/[username]/models/[slug]/ModelRevision";
import { EditModelExports } from "@/components/exports/EditModelExports";
import { useAvailableHeight } from "@/hooks/useAvailableHeight";
import { SquiggleContentFragment } from "./SquiggleContent";

export const Mutation = graphql`
  mutation EditSquiggleSnippetModelMutation(
    $input: MutationUpdateSquiggleSnippetModelInput!
  ) {
    result: updateSquiggleSnippetModel(input: $input) {
      __typename
      ... on BaseError {
        message
      }
      ... on UpdateSquiggleSnippetResult {
        model {
          ...ModelPage
        }
      }
    }
  }
`;

type FormShape = {
  code: string;
  relativeValuesExports: RelativeValuesExportInput[];
};

type Props = {
  // We have to pass the entire model here and not just content;
  // it's too hard to split the editing form into "content-type-specific" part and "generic model fields" part.
  modelRef: ModelPage$key;
};

export const EditSquiggleSnippetModel: FC<Props> = ({ modelRef }) => {
  const toast = useToast();
  const { data: session } = useSession();

  const model = useFragment(ModelPageFragment, modelRef);
  const revision = useFragment<ModelRevision$key>(
    ModelRevisionFragment,
    model.currentRevision
  );

  const content = useFragment<SquiggleContent$key>(
    SquiggleContentFragment,
    revision.content
  );

  const { height, ref } = useAvailableHeight();

  const initialFormValues: FormShape = useMemo(() => {
    return {
      code: content.code,
      relativeValuesExports: revision.relativeValuesExports.map((item) => ({
        variableName: item.variableName,
        definition: {
          username: item.definition.owner.username,
          slug: item.definition.slug,
        },
      })),
    };
  }, [content, revision.relativeValuesExports]);

  const form = useForm<FormShape>({
    defaultValues: initialFormValues,
  });

  const {
    fields: variablesWithDefinitionsFields,
    append: appendVariableWithDefinition,
    remove: removeVariableWithDefinition,
  } = useFieldArray({
    name: "relativeValuesExports",
    control: form.control,
  });

  const [saveMutation] =
    useMutation<EditSquiggleSnippetModelMutation>(Mutation);

  const save = form.handleSubmit((formData) => {
    saveMutation({
      variables: {
        input: {
          content: {
            code: formData.code,
          },
          relativeValuesExports: formData.relativeValuesExports,
          slug: model.slug,
          username: model.owner.username,
        },
      },
      onCompleted(data) {
        if (data.result.__typename === "BaseError") {
          toast(data.result.message, "error");
        } else {
          toast("Saved", "confirmation");
        }
      },
      onError(e) {
        toast(e.toString(), "error");
      },
    });
  });

  const canSave = session?.user.username === model.owner.username;

  const onCodeChange = (code: string) => {
    form.setValue("code", code);
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={save}>
        <div ref={ref}>
          <SquigglePlayground
            height={height ?? "100vh"}
            onCodeChange={onCodeChange}
            defaultCode={content.code}
            renderExtraControls={({ openModal }) =>
              canSave && (
                <div className="h-full flex items-center justify-end gap-2">
                  <PlaygroundToolbarItem
                    tooltipText={"Exported Variables"}
                    icon={LinkIcon}
                    onClick={() => openModal("exports")}
                  ></PlaygroundToolbarItem>
                  <Button theme="primary" onClick={save} size="small">
                    Save
                  </Button>
                </div>
              )
            }
            renderExtraModal={(name) => {
              if (name === "exports") {
                return {
                  body: (
                    <div className="px-6 py-2">
                      <EditModelExports
                        append={appendVariableWithDefinition}
                        remove={removeVariableWithDefinition}
                        items={variablesWithDefinitionsFields}
                        modelSlug={model.slug}
                      />
                    </div>
                  ),
                  title: "Exported Variables",
                };
              }
            }}
          />
        </div>
      </form>
    </FormProvider>
  );
};
