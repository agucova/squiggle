export function chooseUsernameRoute() {
  return "/settings/choose-username";
}

export function modelRoute({
  username,
  slug,
}: {
  username: string;
  slug: string;
}) {
  return `/users/${username}/models/${slug}`;
}

export function isModelRoute(url: string) {
  return url.match("^/users/[^/]+/models/[^/]+$");
}

//Triggers on the model route and all subroutes
export function isModelSubroute(url: string) {
  return url.match("^/users/[^/]+/models/*");
}

// used by useFixModelUrlCasing hook
export function patchModelRoute({
  pathname,
  username,
  slug,
}: {
  pathname: string;
  username: string;
  slug: string;
}) {
  const match = pathname.match("^/users/[^/]+/models/[^/]+($|/.*)");
  if (!match) {
    throw new Error("Not a model route");
  }
  return `/users/${username}/models/${slug}${match[1]}`;
}

export function modelForRelativeValuesExportRoute({
  username,
  slug,
  variableName,
  mode = "list",
}: {
  username: string;
  slug: string;
  variableName: string;
  mode?: "list" | "grid" | "plot";
}) {
  const baseRoute = `/users/${username}/models/${slug}/relative-values/${variableName}`;
  switch (mode) {
    case "list":
      return baseRoute;
    default:
      return `${baseRoute}/${mode}`;
  }
}

export function modelViewRoute({
  username,
  slug,
}: {
  username: string;
  slug: string;
}) {
  return `/users/${username}/models/${slug}/view`;
}

export function modelRevisionsRoute({
  username,
  slug,
}: {
  username: string;
  slug: string;
}) {
  return `/users/${username}/models/${slug}/revisions`;
}

export function modelRevisionRoute({
  username,
  slug,
  revisionId,
}: {
  username: string;
  slug: string;
  revisionId: string;
}) {
  return `/users/${username}/models/${slug}/revisions/${revisionId}`;
}

export function relativeValuesRoute({
  username,
  slug,
}: {
  username: string;
  slug: string;
}) {
  return `/users/${username}/relative-values/${slug}`;
}

export function relativeValuesEditRoute(props: {
  username: string;
  slug: string;
}) {
  return relativeValuesRoute(props) + "/edit";
}

export function userRoute({ username }: { username: string }) {
  return `/users/${username}`;
}

export function newModelRoute() {
  return "/new/model";
}

export function newDefinitionRoute() {
  return "/new/definition";
}

export function graphqlAPIRoute() {
  return graphqlPlaygroundRoute();
}

export function graphqlPlaygroundRoute(query?: string) {
  const paramsString =
    query === undefined
      ? ""
      : "?" +
        new URLSearchParams({
          query,
        }).toString();

  return `/api/graphql${paramsString}`;
}

export function aboutRoute() {
  return "/about";
}

export function privacyPolicyRoute() {
  return "/privacy";
}

export function termsOfServiceRoute() {
  return "/terms";
}
