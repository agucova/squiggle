"use client";
import { clsx } from "clsx";
import { useSession } from "next-auth/react";
import { FC } from "react";
import { graphql, useFragment } from "react-relay";

import { ModelAccessControls$key } from "@/__generated__/ModelAccessControls.graphql";
import { ModelAccessControlsMutation } from "@/__generated__/ModelAccessControlsMutation.graphql";
import { useAsyncMutation } from "@/hooks/useAsyncMutation";
import {
  Dropdown,
  DropdownMenu,
  DropdownMenuAsyncActionItem,
  GlobeIcon,
  LockIcon,
} from "@quri/ui";

export const Fragment = graphql`
  fragment ModelAccessControls on Model {
    id
    slug
    isPrivate
    owner {
      username
    }
  }
`;

function getIconComponent(isPrivate: boolean) {
  return isPrivate ? LockIcon : GlobeIcon;
}

export const Mutation = graphql`
  mutation ModelAccessControlsMutation(
    $input: MutationUpdateModelPrivacyInput!
  ) {
    result: updateModelPrivacy(input: $input) {
      __typename
      ... on BaseError {
        message
      }
      ... on UpdateModelPrivacyResult {
        model {
          id
          isPrivate
        }
      }
    }
  }
`;

export const UpdateModelPrivacyAction: FC<{
  modelRef: ModelAccessControls$key;
  close(): void;
}> = ({ modelRef, close }) => {
  const model = useFragment(Fragment, modelRef);
  // TODO - fill cache in ModelEvaluator and re-render
  const [runMutation] = useAsyncMutation<ModelAccessControlsMutation>({
    mutation: Mutation,
    expectedTypename: "UpdateModelPrivacyResult",
  });

  const act = async () => {
    await runMutation({
      variables: {
        input: {
          username: model.owner.username,
          slug: model.slug,
          isPrivate: !model.isPrivate,
        },
      },
    });
  };

  return (
    <DropdownMenuAsyncActionItem
      title={model.isPrivate ? "Make public" : "Make private"}
      icon={getIconComponent(!model.isPrivate)}
      onClick={act}
      close={close}
    />
  );
};

export const ModelAccessControls: FC<{ modelRef: ModelAccessControls$key }> = ({
  modelRef,
}) => {
  const model = useFragment(Fragment, modelRef);
  const { data: session } = useSession();
  const ownedByCurrentUser = model.owner.username === session?.user?.username;

  const Icon = getIconComponent(model.isPrivate);

  const body = (
    // TODO: copy-pasted from CacheMenu from relative-values, extract to <InvisibleMaybeDropdown> or something
    <div
      className={clsx(
        "flex items-center text-sm text-gray-500 px-2 py-1 rounded-sm",
        ownedByCurrentUser && "hover:bg-slate-200 cursor-pointer"
      )}
    >
      <Icon className="text-gray-500 mr-1" size={14} />
      {model.isPrivate ? "Private" : "Public"}
    </div>
  );

  return ownedByCurrentUser ? (
    <Dropdown
      render={({ close }) => (
        <DropdownMenu>
          <UpdateModelPrivacyAction modelRef={modelRef} close={close} />
        </DropdownMenu>
      )}
    >
      {body}
    </Dropdown>
  ) : (
    body
  );
};
