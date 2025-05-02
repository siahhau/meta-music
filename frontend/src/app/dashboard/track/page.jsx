import axios from 'axios';
import { CONFIG } from 'src/global-config';

import { BlankView } from 'src/sections/track/view';

// ----------------------------------------------------------------------

export const metadata = { title: `歌曲 | Dashboard - ${CONFIG.appName}` };

export default async function Page() {
  const res = await axios.get('http://127.0.0.1:8000/tracks')
  console.log(res)
  return <BlankView />;
}
