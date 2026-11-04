import { useWindowDimensions } from 'react-native';
import { getLayout, type ResponsiveLayout } from '@/utils/layout';

export { RAIL_WIDTH, getLayout, type ResponsiveLayout, type SizeClass } from '@/utils/layout';

export function useResponsive(): ResponsiveLayout {
  const { width, height } = useWindowDimensions();
  return getLayout(width, height);
}
