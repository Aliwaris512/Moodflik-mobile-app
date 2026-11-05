import { Stack, useLocalSearchParams } from 'expo-router';

import { isLegalSlug, legalDocs } from '@/components/profile/legal';
import { LegalScreen } from '@/components/profile/legal-screen';
import { Notice } from '@/components/profile/ui';

export default function LegalDocScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  if (!isLegalSlug(slug)) return <Notice>Document not found.</Notice>;
  const doc = legalDocs[slug];
  return (
    <>
      <Stack.Screen options={{ title: doc.title.length > 28 ? 'Legal' : doc.title }} />
      <LegalScreen doc={doc} />
    </>
  );
}
