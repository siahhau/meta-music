// utils/magenta.js
// 提供对通过CDN加载的Magenta.js的访问

// 检查全局Magenta对象是否已加载
export function getMagentaMusic() {
  if (typeof window === 'undefined') {
    return null; // 服务器端不可用
  }
  
  return window.core || window.mm || null;
}

// 等待Magenta库加载完成
export function waitForMagenta(timeout = 10000) {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('不能在服务器端使用'));
  }
  
  // 如果已经加载完成，立即返回
  if (window.core || window.mm) {
    return Promise.resolve(window.core || window.mm);
  }
  
  // 否则等待加载
  return new Promise((resolve, reject) => {
    let totalWait = 0;
    const interval = 100; // 每100ms检查一次
    
    const checkInterval = setInterval(() => {
      if (window.core || window.mm) {
        clearInterval(checkInterval);
        resolve(window.core || window.mm);
        return;
      }
      
      totalWait += interval;
      if (totalWait >= timeout) {
        clearInterval(checkInterval);
        reject(new Error('加载Magenta库超时'));
      }
    }, interval);
  });
}

export default waitForMagenta;