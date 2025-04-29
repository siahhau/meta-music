import { CONFIG } from 'src/global-config';

import { TrackListView } from 'src/sections/track/view';

// ----------------------------------------------------------------------

export const metadata = { title: `Job list | Dashboard - ${CONFIG.appName}` };

export default function Page() {
  return <TrackListView />;
}
