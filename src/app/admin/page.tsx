"use client";

import { useEffect, useState } from "react";
import { BulkTab } from "./_components/BulkTab";
import { CreateTab } from "./_components/CreateTab";
import { MediaTab } from "./_components/MediaTab";
import { ProjectContentTab } from "./_components/ProjectContentTab";
import { ProjectsTab } from "./_components/ProjectsTab";
import { TeamTab } from "./_components/TeamTab";
import { CareersTab } from "./_components/CareersTab";
import { BlogTab } from "./_components/BlogTab";
import { FooterTab } from "./_components/FooterTab";
import type { AdminTab } from "./_lib/types";

const TABS: { id: AdminTab; label: string; description: string }[] = [
  {
    id: "projects",
    label: "1. Projects",
    description: "Edit cover, title, category của 16 portfolio project",
  },
  {
    id: "content",
    label: "2. Project content",
    description: "Thay từng ảnh/video trong case study (rewrite project-data.ts)",
  },
  {
    id: "media",
    label: "3. Media library",
    description: "Upload mới, search/filter, replace asset đã có",
  },
  {
    id: "create",
    label: "4. Create project",
    description: "Tạo project mới + cover trong 1 luồng",
  },
  {
    id: "bulk",
    label: "5. Bulk replace",
    description: "Chạy script replace URL hàng loạt (advanced)",
  },
  {
    id: "team",
    label: "6. Team",
    description: "Quản lý thành viên: ảnh, tên, chức danh tại trang /about",
  },
  {
    id: "careers",
    label: "7. Careers",
    description: "Quản lý job listings và đơn ứng tuyển từ /careers",
  },
  {
    id: "blog",
    label: "8. Blog",
    description: "Tạo, sửa, xóa bài viết blog — draft/publish, markdown editor",
  },
  {
    id: "footer",
    label: "9. Footer",
    description: "Chỉnh sửa mô tả công ty, social links và thông tin liên hệ ở footer",
  },
];

const STORAGE_KEY = "tdg.admin.key";

export default function AdminPage() {
  const [tab, setTab] = useState<AdminTab>("projects");
  const [adminKey, setAdminKey] = useState("");
  const [keyVerified, setKeyVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState("");

  useEffect(() => {
    const cached = typeof window !== "undefined" ? sessionStorage.getItem(STORAGE_KEY) : null;
    if (cached) {
      setAdminKey(cached);
      void verifyKey(cached);
    }
  }, []);

  async function verifyKey(value: string) {
    setVerifying(true);
    setVerifyMsg("");
    try {
      const res = await fetch("/api/admin/media", {
        headers: { "x-admin-key": value },
        cache: "no-store",
      });
      if (res.ok) {
        setKeyVerified(true);
        setVerifyMsg("Admin key OK");
        if (typeof window !== "undefined") sessionStorage.setItem(STORAGE_KEY, value);
      } else {
        setKeyVerified(false);
        setVerifyMsg("Sai admin key hoặc API lỗi");
      }
    } catch {
      setKeyVerified(false);
      setVerifyMsg("Không kết nối được API");
    } finally {
      setVerifying(false);
    }
  }

  function logout() {
    setAdminKey("");
    setKeyVerified(false);
    setVerifyMsg("");
    if (typeof window !== "undefined") sessionStorage.removeItem(STORAGE_KEY);
  }

  if (!keyVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-xl border border-white/10 bg-zinc-900 p-6 space-y-4">
          <h1 className="text-2xl font-semibold">TD Games — Admin</h1>
          <p className="text-sm text-white/60">
            Nhập admin key (giá trị của <code className="font-mono text-xs">ADMIN_SECRET</code>) để tiếp tục.
          </p>
          <input
            type="password"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && adminKey) void verifyKey(adminKey);
            }}
            placeholder="Admin key"
            className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
            autoFocus
          />
          <button
            onClick={() => void verifyKey(adminKey)}
            disabled={!adminKey || verifying}
            className="w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium hover:bg-indigo-500 disabled:opacity-40"
          >
            {verifying ? "Verifying…" : "Sign in"}
          </button>
          {verifyMsg ? <p className="text-xs text-white/60">{verifyMsg}</p> : null}
          <p className="text-[10px] text-white/40">
            Key được lưu trong <code className="font-mono">sessionStorage</code> (chỉ phiên này).
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-white/10 bg-zinc-900">
        <div className="mx-auto max-w-7xl px-4 py-3 flex flex-wrap items-center gap-3">
          <h1 className="text-lg font-semibold">TD Games — Admin</h1>
          <span className="rounded-full bg-emerald-500/20 text-emerald-200 px-2 py-0.5 text-[10px] uppercase tracking-wide">
            Authenticated
          </span>
          <span className="ml-auto" />
          <button
            onClick={logout}
            className="rounded-md border border-white/15 px-3 py-1.5 text-xs hover:bg-white/5"
          >
            Logout
          </button>
        </div>
        <nav className="mx-auto max-w-7xl px-4 pb-3 flex flex-wrap gap-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={
                "rounded-md px-3 py-1.5 text-sm transition-colors " +
                (tab === t.id
                  ? "bg-indigo-600 text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white")
              }
              title={t.description}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 space-y-4">
        {tab === "projects" ? <ProjectsTab adminKey={adminKey} /> : null}
        {tab === "content" ? <ProjectContentTab adminKey={adminKey} /> : null}
        {tab === "media" ? <MediaTab adminKey={adminKey} /> : null}
        {tab === "create" ? (
          <CreateTab adminKey={adminKey} onCreated={() => setTab("projects")} />
        ) : null}
        {tab === "bulk" ? <BulkTab adminKey={adminKey} /> : null}
        {tab === "team" ? <TeamTab adminKey={adminKey} /> : null}
        {tab === "careers" ? <CareersTab adminKey={adminKey} /> : null}
        {tab === "blog" ? <BlogTab adminKey={adminKey} /> : null}
        {tab === "footer" ? <FooterTab adminKey={adminKey} /> : null}
      </main>
    </div>
  );
}
