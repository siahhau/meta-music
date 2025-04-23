import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSidebar } from '../context/SidebarContext';
import { ThemeToggleButton } from '../components/common/ThemeToggleButton';
import NotificationDropdown from '../components/header/NotificationDropdown';
import UserDropdown from '../components/header/UserDropdown';
import api from '../api';
import useDebounce from '../hooks/useDebounce';

function AppHeader() {
  // --- 状态管理 ---
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isResultsVisible, setIsResultsVisible] = useState(false);

  // --- Refs ---
  const inputRef = useRef(null);
  const searchContainerRef = useRef(null);

  // --- 其他 Hooks ---
  const navigate = useNavigate();
  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // --- Effect: 处理 Cmd/Ctrl + K 快捷键聚焦 ---
  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // --- Effect: 搜索 API 请求 ---
  useEffect(() => {
    const fetchData = async () => {
      if (!debouncedSearchQuery || debouncedSearchQuery.trim().length === 0) {
        setSearchResults([]);
        setIsResultsVisible(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      setIsResultsVisible(true);

      try {
        const response = await api.get('/api/search/', {
          params: {
            q: debouncedSearchQuery,
            limit: 100,
            types: 'track,artist,album',
          },
        });
        console.log('搜索响应:', response.data);
        setSearchResults(response.data.results || []);
        if (!response.data.results || response.data.results.length === 0) {
          setError('没有找到结果');
        }
      } catch (err) {
        console.error('搜索失败:', err);
        setError('搜索失败，请检查网络或登录状态后重试。');
        setSearchResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [debouncedSearchQuery, navigate]);

  // --- Effect: 点击外部隐藏搜索结果 ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsResultsVisible(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- 事件处理 ---
  const handleInputChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleResultClick = (result) => {
    setIsResultsVisible(false);
    setSearchQuery('');
    navigate(`/detail/${result.type}/${result.spotify_id}`);
  };

  const handleToggle = () => {
    if (window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  const [isApplicationMenuOpen, setApplicationMenuOpen] = useState(false);
  const toggleApplicationMenu = () => {
    setApplicationMenuOpen(!isApplicationMenuOpen);
  };

  // 按类型分组结果
  const groupedResults = {
    track: searchResults.filter((result) => result.type === 'track').slice(0, 10),
    artist: searchResults.filter((result) => result.type === 'artist').slice(0, 10),
    album: searchResults.filter((result) => result.type === 'album').slice(0, 10),
  };

  // --- JSX 渲染 ---
  return (
    <header className="sticky top-0 flex w-full bg-white border-gray-200 z-50 dark:border-gray-800 dark:bg-gray-900 lg:border-b">
      <div className="flex flex-col items-center justify-between grow lg:flex-row lg:px-6">
        {/* 左侧部分 */}
        <div className="flex items-center justify-between w-full gap-2 px-3 py-3 border-b border-gray-200 dark:border-gray-800 sm:gap-4 lg:justify-normal lg:border-b-0 lg:px-0 lg:py-4">
          {/* 侧边栏切换按钮 */}
          <button
            className="items-center justify-center w-10 h-10 text-gray-500 border-gray-200 rounded-lg dark:border-gray-800 lg:flex dark:text-gray-400 lg:h-11 lg:w-11 lg:border"
            onClick={handleToggle}
            aria-label="Toggle Sidebar"
          >
            {isMobileOpen ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                  fill="currentColor"
                />
              </svg>
            ) : (
              <svg width="16" height="12" viewBox="0 0 16 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M0.583252 1C0.583252 0.585788 0.919038 0.25 1.33325 0.25H14.6666C15.0808 0.25 15.4166 0.585786 15.4166 1C15.4166 1.41421 15.0808 1.75 14.6666 1.75L1.33325 1.75C0.919038 1.75 0.583252 1.41422 0.583252 1ZM0.583252 11C0.583252 10.5858 0.919038 10.25 1.33325 10.25L14.6666 10.25C15.0808 10.25 15.4166 10.5858 15.4166 11C15.4166 11.4142 15.0808 11.75 14.6666 11.75L1.33325 11.75C0.919038 11.75 0.583252 11.4142 0.583252 11ZM1.33325 5.25C0.919038 5.25 0.583252 5.58579 0.583252 6C0.583252 6.41421 0.919038 6.75 1.33325 6.75L7.99992 6.75C8.41413 6.75 8.74992 6.41421 8.74992 6C8.74992 5.58579 8.41413 5.25 7.99992 5.25L1.33325 5.25Z"
                  fill="currentColor"
                />
              </svg>
            )}
          </button>

          {/* 移动端 Logo */}
          <Link to="/" className="lg:hidden">
            <img className="dark:hidden" src="/images/logo/logo.svg" alt="Logo" />
            <img className="hidden dark:block" src="/images/logo/logo-dark.svg" alt="Logo" />
          </Link>

          {/* 移动端菜单按钮 */}
          <button
            onClick={toggleApplicationMenu}
            className="flex items-center justify-center w-10 h-10 text-gray-700 rounded-lg hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 lg:hidden"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M5.99902 10.4951C6.82745 10.4951 7.49902 11.1667 7.49902 11.9951V12.0051C7.49902 12.8335 6.82745 13.5051 5.99902 13.5051C5.1706 13.5051 4.49902 12.8335 4.49902 12.0051V11.9951C4.49902 11.1667 5.1706 10.4951 5.99902 10.4951ZM17.999 10.4951C18.8275 10.4951 19.499 11.1667 19.499 11.9951V12.0051C19.499 12.8335 18.8275 13.5051 17.999 13.5051C17.1706 13.5051 16.499 12.8335 16.499 12.0051V11.9951C16.499 11.1667 17.1706 10.4951 17.999 10.4951ZM13.499 11.9951C13.499 11.1667 12.8275 10.4951 11.999 10.4951C11.1706 10.4951 10.499 11.1667 10.499 11.9951V12.0051C10.499 12.8335 11.1706 13.5051 11.999 13.5051C12.8275 13.5051 13.499 12.8335 13.499 12.0051V11.9951Z"
                fill="currentColor"
              />
            </svg>
          </button>

          {/* 桌面端搜索框 */}
          <div className="hidden lg:block relative" ref={searchContainerRef}>
            <form onSubmit={(e) => e.preventDefault()}>
              <div className="relative">
                {/* 搜索图标 */}
                <span className="absolute -translate-y-1/2 pointer-events-none left-4 top-1/2">
                  <svg
                    className="fill-gray-500 dark:fill-gray-400"
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z"
                      fill=""
                    />
                  </svg>
                </span>
                {/* 搜索输入框 */}
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="搜索专辑、艺术家、单曲"
                  value={searchQuery}
                  onChange={handleInputChange}
                  onFocus={() => setIsResultsVisible(searchQuery.length > 0)}
                  className="h-11 w-full rounded-lg border border-gray-200 bg-transparent py-2.5 pl-12 pr-14 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-3 focus:ring-brand-500/10 dark:border-gray-800 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 xl:w-[430px]"
                />
                {/* Cmd+K 提示按钮 */}
                <button
                  type="button"
                  onClick={() => inputRef.current?.focus()}
                  className="absolute right-2.5 top-1/2 inline-flex -translate-y-1/2 items-center gap-0.5 rounded-lg border border-gray-200 bg-gray-50 px-[7px] py-[4.5px] text-xs -tracking-[0.2px] text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400"
                >
                  <span>⌘</span>
                  <span>K</span>
                </button>
              </div>
            </form>

            {/* 搜索结果下拉列表 */}
            {isResultsVisible && (
              <div className="absolute top-full left-0 right-0 mt-2 w-full max-h-96 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
                {isLoading && <div className="p-4 text-center text-gray-500 dark:text-gray-400">正在搜索...</div>}
                {error && <div className="p-4 text-center text-red-500">{error}</div>}
                {!isLoading && !error && searchResults.length === 0 && debouncedSearchQuery && (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                    没有找到结果
                  </div>
                )}
                {!isLoading && !error && searchResults.length > 0 && (
                  <div>
                    {/* 结果数量提示 */}
                    <div className="p-3 text-sm text-gray-500 dark:text-gray-400">
                      找到 {searchResults.length} 条结果（单曲: {groupedResults.track.length}，艺术家: {groupedResults.artist.length}，专辑: {groupedResults.album.length}）
                    </div>
                    {/* 单曲 */}
                    {groupedResults.track.length > 0 && (
                      <div className="border-b border-gray-200 dark:border-gray-700">
                        <h3 className="px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300">单曲</h3>
                        <ul>
                          {groupedResults.track.map((result) => (
                            <li
                              key={`${result.type}-${result.spotify_id}`}
                              className="border-t border-gray-200 dark:border-gray-700 first:border-t-0"
                              onClick={() => handleResultClick(result)}
                            >
                              <div className="flex items-center p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                                {result.image_url && (
                                  <img
                                    src={result.image_url}
                                    alt={result.name}
                                    className="w-10 h-10 mr-3 rounded object-cover flex-shrink-0"
                                  />
                                )}
                                <div className="overflow-hidden">
                                  <div className="font-medium text-gray-800 dark:text-white/90 truncate">{result.name}</div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400 truncate">{result.artist_name} • 单曲</div>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {/* 艺术家 */}
                    {groupedResults.artist.length > 0 && (
                      <div className="border-b border-gray-200 dark:border-gray-700">
                        <h3 className="px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300">艺术家</h3>
                        <ul>
                          {groupedResults.artist.map((result) => (
                            <li
                              key={`${result.type}-${result.spotify_id}`}
                              className="border-t border-gray-200 dark:border-gray-700 first:border-t-0"
                              onClick={() => handleResultClick(result)}
                            >
                              <div className="flex items-center p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                                {result.image_url && (
                                  <img
                                    src={result.image_url}
                                    alt={result.name}
                                    className="w-10 h-10 mr-3 rounded object-cover flex-shrink-0"
                                  />
                                )}
                                <div className="overflow-hidden">
                                  <div className="font-medium text-gray-800 dark:text-white/90 truncate">{result.name}</div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400 truncate">艺术家</div>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {/* 专辑 */}
                    {groupedResults.album.length > 0 && (
                      <div>
                        <h3 className="px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300">专辑</h3>
                        <ul>
                          {groupedResults.album.map((result) => (
                            <li
                              key={`${result.type}-${result.spotify_id}`}
                              className="border-t border-gray-200 dark:border-gray-700 first:border-t-0"
                              onClick={() => handleResultClick(result)}
                            >
                              <div className="flex items-center p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                                {result.image_url && (
                                  <img
                                    src={result.image_url}
                                    alt={result.name}
                                    className="w-10 h-10 mr-3 rounded object-cover flex-shrink-0"
                                  />
                                )}
                                <div className="overflow-hidden">
                                  <div className="font-medium text-gray-800 dark:text-white/90 truncate">{result.name}</div>
                                  <div className="text-sm text-gray-500 dark:text-gray-400 truncate">{result.artist_name} • 专辑</div>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 右侧部分 */}
        <div
          className={`${isApplicationMenuOpen ? 'flex' : 'hidden'} items-center justify-between w-full gap-4 px-5 py-4 lg:flex shadow-theme-md lg:justify-end lg:px-0 lg:shadow-none`}
        >
          <div className="flex items-center gap-2 2xsm:gap-3">
            <ThemeToggleButton />
            <NotificationDropdown />
          </div>
          <UserDropdown />
        </div>
      </div>
    </header>
  );
}

export default AppHeader;