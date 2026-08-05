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
import { SpineTab } from "./_components/SpineTab";
import { PageSlotsTab } from "./_components/PageSlotsTab";
import { SettingsTab } from "./_components/SettingsTab";
import { ShowreelTab } from "./_components/ShowreelTab";
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
  {
    id: "spine",
    label: "10. Spine",
    description: "Upload Spine 4.2 characters (.json/.skel + .atlas + PNG) và gán slug",
  },
  {
    id: "page-slots",
    label: "11. Page Slots",
    description: "Quản lý media slots cho từng trang — swap URL ngay, không rebuild",
  },
  {
    id: "showreel",
    label: "12. Showreel",
    description: "Upload ảnh/video cho trang /showreel — tab Art/Animation/VFX + category",
  },
  {
    id: "settings",
    label: "⚙ Settings",
    description: "Cấu hình ứng dụng: HR password, v.v. Thay đổi có hiệu lực ngay",
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
    // ponytail: localStorage (không phải sessionStorage) — key sống qua lần đóng
    // tab, giống /hr và /crm. Sai key thì verifyKey xoá.
    const cached = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
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
        // Key verify được đến từ FormData (DOM), không phải từ state — autofill
        // không kích onChange nên adminKey có thể rỗng. Không sync ở đây thì mọi
        // tab fetch với x-admin-key rỗng → 401 dù badge hiện AUTHENTICATED.
        setAdminKey(value);
        setKeyVerified(true);
        setVerifyMsg("Admin key OK");
        if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, value);
      } else {
        setKeyVerified(false);
        // Chỉ xoá key đã lưu khi chắc chắn sai (401). Lỗi 5xx/mạng thì giữ lại,
        // không bắt sếp gõ lại key vì server hắt hơi.
        if (res.status === 401 && typeof window !== "undefined") {
          localStorage.removeItem(STORAGE_KEY);
        }
        // Tách 401 (sai key) khỏi lỗi hệ thống — gộp chung làm mất cả buổi
        // truy lỗi khi thật ra key trong DB đã bị đổi.
        setVerifyMsg(
          res.status === 401
            ? "Sai admin key"
            : `Lỗi hệ thống (HTTP ${res.status}) — key có thể vẫn đúng`,
        );
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
    if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEY);
  }

  if (!keyVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-xl border border-white/10 bg-zinc-900 p-6 space-y-4">
          <h1 className="text-2xl font-semibold">TD Games — Admin</h1>
          <p className="text-sm text-white/60">
            Nhập admin key (giá trị của <code className="font-mono text-xs">ADMIN_SECRET</code>) để tiếp tục.
          </p>
          {/* <form> + FormData: lấy key từ DOM chứ không từ React state.
              Password manager autofill không kích onChange -> state rỗng ->
              nút Sign in disable dù ô đã có chữ (sếp báo 2026-07-30). */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const value = String(new FormData(e.currentTarget).get("adminKey") ?? "").trim();
              if (value) void verifyKey(value);
            }}
            className="space-y-4"
          >
            <input
              type="password"
              name="adminKey"
              defaultValue={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="Admin key"
              className="w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
              autoFocus
            />
            <button
              type="submit"
              disabled={verifying}
              className="w-full rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium hover:bg-indigo-500 disabled:opacity-40"
            >
              {verifying ? "Verifying…" : "Sign in"}
            </button>
          </form>
          {verifyMsg ? <p className="text-xs text-white/60">{verifyMsg}</p> : null}
          <p className="text-[10px] text-white/40">
            Key được lưu trong <code className="font-mono">localStorage</code> (giữ qua các lần mở lại).
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
        {tab === "spine" ? <SpineTab adminKey={adminKey} /> : null}
        {tab === "page-slots" ? <PageSlotsTab adminKey={adminKey} /> : null}
        {tab === "showreel" ? <ShowreelTab adminKey={adminKey} /> : null}
        {tab === "settings" ? (
          <SettingsTab
            adminKey={adminKey}
            onAdminKeyChange={(newKey) => {
              setAdminKey(newKey);
              if (newKey) {
                localStorage.setItem(STORAGE_KEY, newKey);
              } else {
                localStorage.removeItem(STORAGE_KEY);
                setKeyVerified(false); // sign out — user must re-login with env var
              }
            }}
          />
        ) : null}
      </main>
    </div>
  );
}
