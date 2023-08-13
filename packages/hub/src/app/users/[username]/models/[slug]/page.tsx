import { EditModelPageBody } from "./EditModelPageBody";
import { loadModelPageQuery } from "./loadModelPageQuery";

type Props = {
  params: { username: string; slug: string };
};

export default async function Page({ params }: Props) {
  const query = await loadModelPageQuery({
    ownerUsername: params.username,
    slug: params.slug,
  });

  return (
    <div className="bg-white">
      <EditModelPageBody query={query} />
    </div>
  );
}
