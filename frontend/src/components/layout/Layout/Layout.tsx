import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "../Sidebar";
import { useUIStore } from "../../../store/uiStore";
import "./Layout.css";

export function Layout() {
  const setScrollProgress = useUIStore((s) => s.setScrollProgress);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? scrollTop / docHeight : 0;
      setScrollProgress(Math.min(progress, 1));
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [setScrollProgress]);

  return (
    <div className="layout">
      <Sidebar />
      <main className="layout-main">
        <Outlet />
      </main>
    </div>
  );
}
