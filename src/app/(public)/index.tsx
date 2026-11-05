import { Link } from 'expo-router';
import { Image, Text, View } from 'react-native';

import { Button, Screen } from '@/components/ui';

export default function Landing() {
  return (
    <Screen>
      <View className="flex-1 justify-center">
        <Image
          source={require('@/assets/images/logo.png')}
          resizeMode="contain"
          className="mb-6 h-16 w-56 self-center"
        />
        <Text className="mb-6 text-center text-xl font-bold text-ink">
          Welcome to Moodflik, Where you can:
        </Text>
        <Text className="mb-4 text-base text-ink">
          See, share and speak about daily events and experiences of things you{' '}
          <Text className="italic text-green-600">love</Text> and{' '}
          <Text className="italic text-danger">dislike</Text> simultaneously.
        </Text>
        <Text className="mb-4 text-base text-ink">
          Find and follow your favourite people, places and organisations with similar interests and
          dislikes.
        </Text>
        <Text className="mb-6 text-base text-ink">
          Join live hot trending topics of events happening locally and globally with diverse
          reactions.
        </Text>
        <Text className="mb-4 text-center text-base font-semibold text-ink">
          No account? No problem. Jump on board in seconds!
        </Text>
        <View className="gap-3">
          <Link href="/signup" asChild>
            <Button title="Sign Up" />
          </Link>
          <Link href="/login" asChild>
            <Button title="Sign In" variant="outline" />
          </Link>
        </View>
      </View>
    </Screen>
  );
}
