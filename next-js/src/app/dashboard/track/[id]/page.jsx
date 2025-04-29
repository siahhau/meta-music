
import { CONFIG } from 'src/global-config';

import { TrackDetailsView } from 'src/sections/track/view/track-details-view';

// ----------------------------------------------------------------------

export const metadata = { title: `歌曲详情 | Dashboard - ${CONFIG.appName}` };

export default async function TrackDetailsPage(data) {
  return <TrackDetailsView initialTrackData={null} error={null} />;
}
