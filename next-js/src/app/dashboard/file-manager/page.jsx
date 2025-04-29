import { CONFIG } from 'src/global-config';

import { FileManagerView } from 'src/sections/file-manager/view';

// ----------------------------------------------------------------------

export const metadata = { title: `文件管理 | 仪表盘 - ${CONFIG.appName}` };

export default function Page() {
  return <FileManagerView />;
}
