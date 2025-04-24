// 格式化时长为 MM:SS
export const formatDuration = (ms) => {
    if (!ms || isNaN(ms)) return "0:00";
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000)
      .toString()
      .padStart(2, "0");
    return `${minutes}:${seconds}`;
};