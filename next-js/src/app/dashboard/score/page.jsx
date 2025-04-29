import { CONFIG } from 'src/global-config';

import { ScoreListView } from 'src/sections/score/score-list-view';

// ----------------------------------------------------------------------

export const metadata = { title: `歌谱列表 | 仪表盘 - ${CONFIG.appName}` };

export default function Page() {
  return <ScoreListView />;
}
