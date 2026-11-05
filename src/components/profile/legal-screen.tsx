import { Text, View } from 'react-native';

import type { LegalDoc } from '@/components/profile/legal/types';
import { Screen } from '@/components/ui';

/** Renders any static legal / info document from structured data. */
export function LegalScreen({ doc }: { doc: LegalDoc }) {
  return (
    <Screen>
      <Text className="mb-4 text-2xl font-bold text-ink dark:text-white">{doc.title}</Text>
      {doc.blocks.map((block, i) => {
        if (block.t === 'h') {
          return (
            <Text key={i} className="mb-2 mt-5 text-lg font-semibold text-brand-2 dark:text-white">
              {block.text}
            </Text>
          );
        }
        if (block.t === 'list') {
          return (
            <View key={i} className="mb-3 gap-1.5 pl-2">
              {block.items.map((item, j) => (
                <View key={j} className="flex-row gap-2">
                  <Text className="text-base text-muted dark:text-neutral-300">{'\u2022'}</Text>
                  <Text className="flex-1 text-base leading-6 text-muted dark:text-neutral-300">
                    {item}
                  </Text>
                </View>
              ))}
            </View>
          );
        }
        return (
          <Text key={i} className="mb-3 text-base leading-6 text-muted dark:text-neutral-300">
            {block.text}
          </Text>
        );
      })}
    </Screen>
  );
}
