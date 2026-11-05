import { useState } from 'react';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';

import { type Faq, HELP_VIDEO, helpIntro, helpSections } from '@/components/profile/help-content';
import { Card, SectionTitle } from '@/components/profile/ui';

function FaqItem({ faq, video }: { faq: Faq; video?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <View className="border-b border-border dark:border-neutral-800">
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((v) => !v)}
        className="flex-row items-center gap-3 px-4 py-3.5"
      >
        <Text className="flex-1 text-base font-medium text-ink dark:text-white">{faq.q}</Text>
        <Text className="text-lg text-muted">{open ? '\u2212' : '+'}</Text>
      </Pressable>
      {open ? (
        <View className="px-4 pb-4">
          <Text className="text-sm leading-5 text-muted dark:text-neutral-300">{faq.a}</Text>
          {video ? (
            <Text
              accessibilityRole="link"
              onPress={() => void Linking.openURL(HELP_VIDEO)}
              className="mt-2 font-semibold text-brand"
            >
              Watch the video
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

export default function HelpScreen() {
  return (
    <ScrollView
      className="flex-1 bg-surface dark:bg-neutral-950"
      contentContainerClassName="p-4 pb-12"
    >
      <Text className="mb-2 text-2xl font-bold text-ink dark:text-white">Help and FAQ</Text>
      {helpIntro.map((p) => (
        <Text key={p} className="mb-2 text-sm leading-5 text-muted dark:text-neutral-300">
          {p}
        </Text>
      ))}
      {helpSections.map((section) => (
        <View key={section.title}>
          <SectionTitle>{section.title}</SectionTitle>
          <Card>
            {section.faqs?.map((faq) => (
              <FaqItem key={faq.q} faq={faq} video={faq.q.startsWith('(For Android 12+')} />
            ))}
            {section.body || section.bullets ? (
              <View className="gap-1.5 p-4">
                {section.body ? (
                  <Text className="text-sm leading-5 text-muted dark:text-neutral-300">
                    {section.body}
                  </Text>
                ) : null}
                {section.bullets?.map((b) => (
                  <Text key={b} className="text-sm leading-5 text-ink dark:text-white">
                    {'\u2022'} {b}
                  </Text>
                ))}
              </View>
            ) : null}
          </Card>
        </View>
      ))}
    </ScrollView>
  );
}
