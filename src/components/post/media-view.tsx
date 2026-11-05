import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { View } from 'react-native';

function Video({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = false;
  });
  return <VideoView player={player} style={{ width: '100%', height: '100%' }} nativeControls />;
}

export function MediaView({ url, type }: { url?: string | null; type?: string | null }) {
  if (!url) return null;
  const isVideo =
    (type ?? '').toLowerCase().startsWith('video') || /\.(mp4|mov|m4v|webm)$/i.test(url);
  return (
    <View className="mt-3 aspect-video w-full overflow-hidden rounded-2xl bg-black/5">
      {isVideo ? (
        <Video uri={url} />
      ) : (
        <Image source={{ uri: url }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
      )}
    </View>
  );
}
