import { ScrollView } from 'react-native';

import { legalDocs, legalSlugs } from '@/components/profile/legal';
import { Card, Row } from '@/components/profile/ui';

export default function LegalIndex() {
  return (
    <ScrollView className="flex-1 bg-surface dark:bg-neutral-950" contentContainerClassName="p-4">
      <Card>
        {legalSlugs.map((slug) => (
          <Row
            key={slug}
            title={legalDocs[slug].title}
            href={{ pathname: '/legal/[slug]', params: { slug } }}
          />
        ))}
      </Card>
    </ScrollView>
  );
}
