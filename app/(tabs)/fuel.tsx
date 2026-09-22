import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import type { WindowType } from '@/engine/types';
import { useStore } from '@/state/store';
import { Screen, ScreenTitle, Segmented } from '@/ui/components';
import { HydrateView } from '@/views/HydrateView';
import { KitchenView } from '@/views/KitchenView';
import { RecipesView } from '@/views/RecipesView';
import { ShoppingView } from '@/views/ShoppingView';

type Tab = 'kitchen' | 'recipes' | 'shopping' | 'water';
const TABS: Tab[] = ['kitchen', 'recipes', 'shopping', 'water'];
const FOCI: WindowType[] = ['preMeal', 'topOff', 'during', 'recovery'];

export default function Fuel() {
  const params = useLocalSearchParams<{ tab?: string; focus?: string }>();
  const { state } = useStore();
  const [tab, setTab] = useState<Tab>('kitchen');
  const focus = FOCI.find((f) => f === params.focus);

  // Deep links from other screens (e.g. "Recovery recipes" after a workout).
  useEffect(() => {
    const t = TABS.find((x) => x === params.tab);
    if (t) setTab(t);
  }, [params.tab]);

  const openCount = state.shopping.filter((i) => !i.checked).length;

  return (
    <Screen>
      <ScreenTitle title="Fuel" />
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: 'kitchen', label: 'Kitchen' },
          { value: 'recipes', label: 'Recipes' },
          { value: 'shopping', label: openCount ? `List (${openCount})` : 'List' },
          { value: 'water', label: 'Water' },
        ]}
      />
      {tab === 'kitchen' && <KitchenView />}
      {tab === 'recipes' && <RecipesView key={focus ?? 'any'} initialFocus={focus === 'during' ? undefined : focus} />}
      {tab === 'shopping' && <ShoppingView />}
      {tab === 'water' && <HydrateView />}
    </Screen>
  );
}
