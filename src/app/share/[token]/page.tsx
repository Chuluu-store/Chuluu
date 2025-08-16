import { SharePage } from "../../../widgets/share-page";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function Share({ params }: PageProps) {
  const { token } = await params;
  return <SharePage token={token} />;
}
