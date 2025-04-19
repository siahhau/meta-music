// 你可以将这个文件命名为 AppLayout.jsx (或其他你喜欢的名称)

import React from 'react'; // 导入 React
import { SidebarProvider, useSidebar } from "../context/SidebarContext"; // 确保这些文件存在且是 JS/JSX
import { Outlet } from "react-router-dom"; // 从 react-router-dom 导入 Outlet
import AppHeader from "./AppHeader"; // 导入你的 AppHeader 组件 (jsx)
import Backdrop from "./Backdrop"; // 导入你的 Backdrop 组件 (jsx)
import AppSidebar from "./AppSidebar"; // 导入你的 AppSidebar 组件 (jsx)

/**
 * 内部组件，负责实际的布局结构
 */
const LayoutContent = () => {
  // 从 SidebarContext 获取侧边栏状态
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  return (
    // 根 div，使用 flex 布局实现侧边栏和内容区域排列
    <div className="min-h-screen xl:flex">

      {/* 侧边栏容器 */}
      <div>
        <AppSidebar /> {/* 侧边栏组件 */}
        <Backdrop />   {/* 点击侧边栏外部的背景遮罩 */}
      </div>

      {/* 主要内容区域 */}
      <div
        // 使用模板字符串动态添加 CSS 类
        className={`
          flex-1 // 占据剩余空间
          transition-all duration-300 ease-in-out // 平滑过渡效果
          ${
            // 根据侧边栏状态（展开或悬停）调整大屏幕下的左边距
            isExpanded || isHovered ? "lg:ml-[290px]" : "lg:ml-[90px]"
          }
          ${
            // 如果移动端侧边栏打开，则取消左边距（侧边栏覆盖内容）
            isMobileOpen ? "ml-0" : ""
          }
        `}
      >
        {/* 应用头部导航栏 */}
        <AppHeader />

        {/* 页面主体内容的容器 */}
        <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">
          {/* 这是 react-router V6+ 用于渲染子路由的地方 */}
          <Outlet />
        </div>
      </div> {/* End 主要内容区域 */}
    </div> // End 根 div
  );
};

/**
 * AppLayout 组件
 * 主要作用是提供 SidebarProvider 给它的子组件 (LayoutContent)
 */
const AppLayout = () => {
  return (
    // 使用 SidebarProvider 包裹，使得 LayoutContent 及其子组件能访问侧边栏状态
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
};

// 默认导出 AppLayout 组件
export default AppLayout;