import { useEffect, useRef } from "react";
function useInfiniteScroll({ onLoadMore, enabled, rootMargin = "200px" }) {
  const sentinelRef = useRef(null);
  const callbackRef = useRef(onLoadMore);
  callbackRef.current = onLoadMore;
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !enabled) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) callbackRef.current();
      },
      { rootMargin }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled, rootMargin]);
  return sentinelRef;
}
export {
  useInfiniteScroll
};
