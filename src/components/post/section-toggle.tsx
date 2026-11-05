import { Pressable, Text, View } from 'react-native';

import type { PostKind } from '@/api/posts/types';

const ITEMS: { key: PostKind; label: string; active: string }[] = [
  { key: 'like', label: 'Public Likes', active: 'bg-[#108A07]' },
  { key: 'dislike', label: 'Public Dislikes', active: 'bg-[#BF1414]' },
];

export function SectionToggle({
  value,
  onChange,
}: {
  value: PostKind;
  onChange: (v: PostKind) => void;
}) {
  return (
    <View className="flex-row gap-2 px-4 py-3">
      {ITEMS.map((item) => (
        <Pressable
          key={item.key}
          onPress={() => onChange(item.key)}
          className={`flex-1 items-center rounded-xl py-2 ${value === item.key ? item.active : 'bg-brand-2'}`}
        >
          <Text className="font-semibold text-white">{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}
