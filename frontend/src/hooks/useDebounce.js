// src/hooks/useDebounce.js

import { useState, useEffect } from 'react';

/**
 * Debounce Hook
 * @param {any} value 需要进行 debounce 处理的值 (例如：搜索框的输入)
 * @param {number} delay 延迟时间 (毫秒)
 * @returns 返回经过 debounce 处理后的值
 */
export default function useDebounce(value, delay) {
  // 创建一个 state 来存储 debounce 后的值
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(
    () => {
      // 设置一个定时器，在指定的 delay 之后用当前 value 更新 debouncedValue
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      // 清理函数：在下一次 effect 运行之前，或者组件卸载时，清除上一个定时器。
      // 这非常重要，可以防止在前一个 delay 结束前 value 再次改变时，旧的定时器仍然触发更新。
      return () => {
        clearTimeout(handler);
      };
    },
    // 依赖项数组：只有当 value 或 delay 发生变化时，才重新运行这个 effect
    [value, delay]
  );

  // 返回最终 debounce 后的值
  return debouncedValue;
}