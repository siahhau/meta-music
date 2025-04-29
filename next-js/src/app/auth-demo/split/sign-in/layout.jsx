import { AuthSplitLayout } from 'src/layouts/auth-split';

// ----------------------------------------------------------------------

export default function Layout({ children }) {
  return (
    <AuthSplitLayout
      slotProps={{
        section: { title: '嗨，欢迎回来' },
      }}
    >
      {children}
    </AuthSplitLayout>
  );
}
