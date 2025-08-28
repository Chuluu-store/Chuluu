import { AlbumPage } from '../../../widgets/album-page';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Album({ params }: PageProps) {
  const { id } = await params;
  return <AlbumPage albumId={id} />;
}
