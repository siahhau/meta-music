'use client';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { PostNewEditForm } from '../post-new-edit-form';

// ----------------------------------------------------------------------

export function PostEditView({ post }) {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="编辑"
        backHref={paths.dashboard.post.root}
        links={[
          { name: '仪表板', href: paths.dashboard.root },
          { name: '博客', href: paths.dashboard.post.root },
          { name: post?.title },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <PostNewEditForm currentPost={post} />
    </DashboardContent>
  );
}
