import { useState } from "react";
import { Outlet } from "react-router-dom";
import { X } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { RewardLayer } from "./RewardLayer";
import { CommandPalette } from "./CommandPalette";

const SIDEBAR_W = "17rem";

export function Layout() {
  const [drawer, setDrawer] = useState(false);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <TopBar onMenu={() => setDrawer(true)} />

      <div className="mx-auto flex max-w-[1600px]">
        {/* desktop sidebar */}
        <aside
          className="sticky top-14 hidden h-[calc(100vh-3.5rem)] shrink-0 border-r lg:block"
          style={{ width: SIDEBAR_W, borderColor: "var(--border)", background: "var(--bg-elev)" }}
        >
          <Sidebar />
        </aside>

        {/* mobile drawer */}
        {drawer && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setDrawer(false)} />
            <aside
              className="absolute left-0 top-0 h-full w-72 border-r shadow-xl"
              style={{ borderColor: "var(--border)", background: "var(--bg-elev)" }}
            >
              <div className="flex items-center justify-between px-4 py-3">
                <span className="font-extrabold">Menu</span>
                <button onClick={() => setDrawer(false)} className="cursor-pointer rounded-lg p-1.5 hover:bg-black/5 dark:hover:bg-white/10">
                  <X size={18} />
                </button>
              </div>
              <Sidebar onNavigate={() => setDrawer(false)} />
            </aside>
          </div>
        )}

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>

      <RewardLayer />
      <CommandPalette />
    </div>
  );
}
