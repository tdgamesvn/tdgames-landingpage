"use client";

/**
 * Tab "Tài khoản & quyền" (chỉ Sếp): quản lý tài khoản nhân viên + bảng quyền theo vai.
 * Mọi lỗi server hiện nguyên văn; ô quyền lưu ngay khi bấm, lỗi thì hoàn tác.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { hrFetch, useHrSession } from "./HrSession";
import { HR_PERMISSIONS, HR_ROLES, ROLE_LABEL, type HrRole } from "@/lib/hr-permissions";
import { formatInterviewTime } from "@/lib/interview-schedule";
import { MAX_REF_CODES, normalizeRefCode } from "@/lib/hr-ref-codes";

type UserStatus = "active" | "invited" | "disabled";
type HrUser = {
  id: string;
  email: string;
  display_name: string;
  role: HrRole;
  disabled: boolean;
  status: UserStatus;
  created_at: string | null;
  last_login_at: string | null;
  discord_user_id: string | null;
  phone: string | null;
  /** Mã giới thiệu (đã chuẩn hoá); phần tử đầu = mã chính. */
  ref_codes: string[] | null;
};
type Override = { role: string; permission: string; allowed: boolean };
type PermRole = "hr" | "leader" | "accountant";
const PERM_ROLES: PermRole[] = ["hr", "leader", "accountant"];

const STATUS_LABEL: Record<UserStatus, string> = {
  active: "Đang dùng",
  invited: "Chờ đặt mật khẩu",
  disabled: "Đã khoá",
};
const STATUS_CLS: Record<UserStatus, string> = {
  active: "text-green-400",
  invited: "text-amber-400",
  disabled: "text-red-400",
};

const inputCls = "rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-[13px] text-white focus:outline-none";

async function readJson(res: Response) {
  return (await res.json().catch(() => ({}))) as Record<string, unknown>;
}

export default function AccountsPanel() {
  const { me } = useHrSession();
  const [users, setUsers] = useState<HrUser[] | null>(null);
  const [overrides, setOverrides] = useState<Override[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [uRes, pRes] = await Promise.all([hrFetch("/api/hr/users"), hrFetch("/api/hr/permissions")]);
      const [u, p] = await Promise.all([readJson(uRes), readJson(pRes)]);
      if (!uRes.ok) throw new Error(String(u.error ?? `HTTP ${uRes.status}`));
      if (!pRes.ok) throw new Error(String(p.error ?? `HTTP ${pRes.status}`));
      setUsers((u.users as HrUser[]) ?? []);
      setOverrides((p.overrides as Override[]) ?? []);
      setLoadError("");
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Không tải được dữ liệu");
    }
  }, []);

  useEffect(() => {
    // Qua microtask — không setState đồng bộ trong effect.
    void Promise.resolve().then(load);
  }, [load]);

  function upsertUser(u: HrUser) {
    setUsers((prev) => (prev ? prev.map((x) => (x.id === u.id ? u : x)) : prev));
  }

  /** true = server lưu thành công. */
  async function patchUser(u: HrUser, body: Record<string, unknown>, okText: string): Promise<boolean> {
    setBusyId(u.id);
    setNotice(null);
    try {
      const res = await hrFetch(`/api/hr/users/${u.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await readJson(res);
      if (!res.ok) {
        setNotice({ kind: "error", text: String(j.error ?? `HTTP ${res.status}`) });
        return false;
      }
      if (j.user) upsertUser(j.user as HrUser);
      if (typeof j.warning === "string") setNotice({ kind: "error", text: j.warning });
      else setNotice({ kind: "ok", text: okText });
      return true;
    } catch {
      setNotice({ kind: "error", text: "Không kết nối được máy chủ" });
      return false;
    } finally {
      setBusyId(null);
    }
  }

  function toggleDisabled(u: HrUser) {
    const msg = u.disabled
      ? `Mở khoá tài khoản ${u.display_name}?`
      : `Khoá tài khoản ${u.display_name}? Người này sẽ bị đăng xuất ngay.`;
    if (!confirm(msg)) return;
    void patchUser(u, { disabled: !u.disabled }, u.disabled ? "Đã mở khoá" : "Đã khoá");
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-white">Tài khoản</h2>
        </div>
        {notice && (
          <p
            role="status"
            className={`rounded-lg border px-3 py-2 text-[13px] ${
              notice.kind === "ok"
                ? "border-green-500/30 bg-green-500/10 text-green-400"
                : "border-red-500/30 bg-red-500/10 text-red-400"
            }`}
          >
            {notice.text}
          </p>
        )}
        {loadError && <p className="text-[13px] text-red-400">{loadError}</p>}

        <AddUserForm
          onCreated={(u, warning) => {
            setUsers((prev) => (prev ? [...prev, u] : [u]));
            setNotice(
              warning
                ? { kind: "error", text: warning }
                : { kind: "ok", text: `Đã gửi lời mời tới ${u.email}` },
            );
          }}
          onError={(text) => setNotice({ kind: "error", text })}
        />

        <div className="hr-group overflow-x-auto">
          <table className="w-full min-w-[1320px] text-left text-[13px]">
            <thead>
              <tr className="text-[11px] uppercase tracking-wider text-white/40">
                <th className="px-4 py-2 font-bold">Tên</th>
                <th className="px-2 py-2 font-bold">Email</th>
                <th className="px-2 py-2 font-bold">Vai</th>
                <th className="px-2 py-2 font-bold">Số điện thoại</th>
                <th className="px-2 py-2 font-bold">Discord ID</th>
                <th className="px-2 py-2 font-bold" title="Hồ sơ nộp qua link ?ref=<mã> tự giao cho người này phụ trách">Mã ref</th>
                <th className="px-2 py-2 font-bold">Trạng thái</th>
                <th className="px-2 py-2 font-bold">Đăng nhập cuối</th>
                <th className="px-4 py-2 text-right font-bold">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {users === null && !loadError && (
                <tr><td colSpan={9} className="px-4 py-6 text-white/50">Đang tải…</td></tr>
              )}
              {users?.map((u) => {
                const isSelf = me?.user.id === u.id;
                const busy = busyId === u.id;
                return (
                  <tr key={u.id} className="border-t border-white/10" data-testid={`user-${u.email}`}>
                    <td className="px-4 py-2.5 font-semibold text-white/90">
                      {u.display_name}
                      {isSelf && <span className="ml-1.5 text-[11px] font-normal text-white/40">(bạn)</span>}
                    </td>
                    <td className="px-2 py-2.5 text-white/70">{u.email}</td>
                    <td className="px-2 py-2.5">
                      <select
                        aria-label={`Vai của ${u.display_name}`}
                        value={u.role}
                        disabled={busy || isSelf}
                        onChange={(e) =>
                          void patchUser(u, { role: e.target.value }, `Đã đổi vai ${u.display_name} thành ${ROLE_LABEL[e.target.value as HrRole]}`)
                        }
                        className={`${inputCls} py-1 disabled:opacity-50`}
                      >
                        {HR_ROLES.map((r) => (
                          <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-2.5">
                      <InlineFieldCell
                        label={`Số điện thoại của ${u.display_name}`}
                        value={u.phone ?? ""}
                        placeholder="Chưa có"
                        inputMode="tel"
                        width="w-32"
                        disabled={busy}
                        onSave={(v) =>
                          void patchUser(u, { phone: v }, v ? `Đã lưu số điện thoại của ${u.display_name}` : `Đã xoá số điện thoại của ${u.display_name}`)
                        }
                      />
                    </td>
                    <td className="px-2 py-2.5">
                      <DiscordIdCell
                        user={u}
                        disabled={busy}
                        onSave={(v) =>
                          void patchUser(
                            u,
                            { discord_user_id: v },
                            v ? `Đã lưu Discord ID của ${u.display_name}` : `Đã xoá Discord ID của ${u.display_name}`,
                          )
                        }
                      />
                    </td>
                    <td className="px-2 py-2.5 align-top">
                      <RefCodesCell
                        user={u}
                        disabled={busy}
                        onSave={(codes) => patchUser(u, { ref_codes: codes }, `Đã lưu mã ref của ${u.display_name}`)}
                      />
                    </td>
                    <td className={`px-2 py-2.5 font-semibold ${STATUS_CLS[u.status]}`}>{STATUS_LABEL[u.status]}</td>
                    <td className="px-2 py-2.5 text-white/60">
                      {u.last_login_at ? formatInterviewTime(u.last_login_at) : "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        {u.status === "invited" && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void patchUser(u, { resend_invite: true }, `Đã gửi lại lời mời tới ${u.email}`)}
                            className="hr-secondary-btn hr-secondary-btn--sm"
                          >
                            Gửi lại lời mời
                          </button>
                        )}
                        {!isSelf && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => toggleDisabled(u)}
                            className={`hr-secondary-btn hr-secondary-btn--sm ${u.disabled ? "" : "text-red-400"}`}
                          >
                            {u.disabled ? "Mở khoá" : "Khoá"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <PermissionsTable overrides={overrides} onOverrides={setOverrides} />
    </div>
  );
}

const DISCORD_HINT = "Discord → Cài đặt → Nâng cao → bật Developer Mode → chuột phải tên người đó → Copy User ID";

/** Ô sửa tại chỗ dùng chung: lưu khi rời ô / Enter nếu giá trị đổi, Esc huỷ. Server kiểm định dạng. */
function InlineFieldCell({
  label,
  value,
  placeholder,
  inputMode,
  width,
  disabled,
  onSave,
}: {
  label: string;
  value: string;
  placeholder: string;
  inputMode: "tel" | "numeric";
  width: string;
  disabled: boolean;
  onSave: (v: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  const [prev, setPrev] = useState(value);
  if (value !== prev) {
    setPrev(value);
    setDraft(value);
  }
  return (
    <input
      aria-label={label}
      inputMode={inputMode}
      placeholder={placeholder}
      value={draft}
      disabled={disabled}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        const v = draft.trim();
        if (v !== value) onSave(v);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") setDraft(value);
      }}
      className={`${inputCls} ${width} py-1 font-mono text-[12px] disabled:opacity-50`}
    />
  );
}

/** Ô Discord ID sửa tại chỗ: lưu khi rời ô / Enter nếu giá trị đổi. Server kiểm định dạng. */
function DiscordIdCell({ user, disabled, onSave }: { user: HrUser; disabled: boolean; onSave: (v: string) => void }) {
  const saved = user.discord_user_id ?? "";
  const [draft, setDraft] = useState(saved);
  const [prevSaved, setPrevSaved] = useState(saved);
  if (saved !== prevSaved) {
    // Server trả giá trị mới (đã chuẩn hoá) → đồng bộ ô nhập.
    setPrevSaved(saved);
    setDraft(saved);
  }
  function commit() {
    const v = draft.trim();
    if (v !== saved) onSave(v);
  }
  return (
    <input
      aria-label={`Discord ID của ${user.display_name}`}
      inputMode="numeric"
      placeholder="Chưa có"
      title={DISCORD_HINT}
      value={draft}
      disabled={disabled}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") setDraft(saved);
      }}
      className={`${inputCls} w-44 py-1 font-mono text-[12px] disabled:opacity-50`}
    />
  );
}

/** Link giới thiệu: trang Careers đọc ?ref= rồi chuyển tiếp sang /apply (form gửi referred_by). */
function refLink(code: string) {
  return `https://tdgamestudio.com/careers?ref=${encodeURIComponent(code)}`;
}

/**
 * Ô "Mã ref": chip (mã đầu = mã chính), thêm bằng Enter, xoá bằng ×, bấm ★ để đưa lên làm mã chính.
 * Lưu ngay mỗi thay đổi; server chuẩn hoá + chặn mã trùng tài khoản khác (409).
 */
function RefCodesCell({
  user,
  disabled,
  onSave,
}: {
  user: HrUser;
  disabled: boolean;
  onSave: (codes: string[]) => Promise<boolean>;
}) {
  const codes = user.ref_codes ?? [];
  const [draft, setDraft] = useState("");
  const [copied, setCopied] = useState(false);
  const preview = normalizeRefCode(draft);

  async function add() {
    if (!preview || disabled) return;
    if (codes.includes(preview)) {
      setDraft("");
      return;
    }
    // Chỉ xoá ô nhập khi server lưu được (vd. 409 trùng mã → giữ nguyên để sửa).
    if (await onSave([...codes, preview])) setDraft("");
  }

  return (
    <div className="w-60 space-y-1.5">
      {codes.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {codes.map((c, i) => (
            <span
              key={c}
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[11.5px] ${
                i === 0 ? "bg-[var(--hr-orange)] text-[var(--hr-on-orange)]" : "bg-white/10 text-white/80"
              }`}
              title={i === 0 ? "Mã chính (dùng cho link giới thiệu)" : undefined}
            >
              {c}
              {i > 0 && (
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => void onSave([c, ...codes.filter((x) => x !== c)])}
                  aria-label={`Đặt ${c} làm mã chính`}
                  title="Đặt làm mã chính"
                  className="opacity-60 hover:opacity-100 disabled:opacity-30"
                >
                  ★
                </button>
              )}
              <button
                type="button"
                disabled={disabled}
                onClick={() => void onSave(codes.filter((x) => x !== c))}
                aria-label={`Xoá mã ${c}`}
                className="opacity-60 hover:opacity-100 disabled:opacity-30"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      {codes.length < MAX_REF_CODES && (
        <input
          aria-label={`Thêm mã ref cho ${user.display_name}`}
          placeholder={codes.length ? "Thêm mã…" : "Thêm mã (vd. thuy-dung)"}
          value={draft}
          disabled={disabled}
          maxLength={60}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void add();
            if (e.key === "Escape") setDraft("");
          }}
          onBlur={() => void add()}
          title={preview && preview !== draft ? `Sẽ lưu thành: ${preview}` : undefined}
          className={`${inputCls} w-full py-1 font-mono text-[12px] disabled:opacity-50`}
        />
      )}
      {codes[0] && (
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(refLink(codes[0])).then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            });
          }}
          title="Chép link giới thiệu"
          className="block max-w-full truncate text-left font-mono text-[11px] text-white/45 hover:text-white/80"
        >
          {copied ? "Đã chép link" : `…/careers?ref=${codes[0]}`}
        </button>
      )}
    </div>
  );
}

function AddUserForm({
  onCreated,
  onError,
}: {
  onCreated: (u: HrUser, warning?: string) => void;
  onError: (text: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<HrRole>("leader");
  const [discordId, setDiscordId] = useState("");
  const [phone, setPhone] = useState("");
  const [refCodes, setRefCodes] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await hrFetch("/api/hr/users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          display_name: name,
          role,
          discord_user_id: discordId,
          phone,
          // "Thuỳ Dung, dung" → ["Thuỳ Dung", "dung"]; server chuẩn hoá ("thuy-dung") + kiểm trùng.
          ref_codes: refCodes.split(",").map((c) => c.trim()).filter(Boolean),
        }),
      });
      const j = await readJson(res);
      if (!res.ok) {
        onError(String(j.error ?? `HTTP ${res.status}`));
        return;
      }
      onCreated(j.user as HrUser, typeof j.warning === "string" ? j.warning : undefined);
      setEmail("");
      setName("");
      setDiscordId("");
      setPhone("");
      setRefCodes("");
      setOpen(false);
    } catch {
      onError("Không kết nối được máy chủ");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="hr-primary-btn hr-primary-btn--sm">
        Thêm tài khoản
      </button>
    );
  }
  return (
    <form onSubmit={(e) => void submit(e)} className="hr-group flex flex-wrap items-end gap-3 px-4 py-3">
      <label className="text-[11px] font-bold uppercase tracking-wider text-white/40">
        Email
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`${inputCls} mt-1 block w-64 font-normal normal-case tracking-normal`}
        />
      </label>
      <label className="text-[11px] font-bold uppercase tracking-wider text-white/40">
        Tên hiển thị
        <input
          required
          maxLength={80}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={`${inputCls} mt-1 block w-48 font-normal normal-case tracking-normal`}
        />
      </label>
      <label className="text-[11px] font-bold uppercase tracking-wider text-white/40">
        Vai
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as HrRole)}
          className={`${inputCls} mt-1 block font-normal normal-case tracking-normal`}
        >
          {HR_ROLES.map((r) => (
            <option key={r} value={r}>{ROLE_LABEL[r]}</option>
          ))}
        </select>
      </label>
      <label className="text-[11px] font-bold uppercase tracking-wider text-white/40">
        Số điện thoại
        <input
          inputMode="tel"
          placeholder="Không bắt buộc"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={`${inputCls} mt-1 block w-40 font-mono font-normal normal-case tracking-normal`}
        />
      </label>
      <label className="text-[11px] font-bold uppercase tracking-wider text-white/40" title={DISCORD_HINT}>
        Discord ID (để tag)
        <input
          inputMode="numeric"
          placeholder="Không bắt buộc"
          value={discordId}
          onChange={(e) => setDiscordId(e.target.value)}
          className={`${inputCls} mt-1 block w-48 font-mono font-normal normal-case tracking-normal`}
        />
      </label>
      <label className="text-[11px] font-bold uppercase tracking-wider text-white/40" title="Cách nhau bằng dấu phẩy; mã đầu là mã chính">
        Mã ref
        <input
          placeholder="Không bắt buộc"
          value={refCodes}
          onChange={(e) => setRefCodes(e.target.value)}
          className={`${inputCls} mt-1 block w-48 font-mono font-normal normal-case tracking-normal`}
        />
      </label>
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="hr-primary-btn hr-primary-btn--sm">
          {saving ? "Đang gửi…" : "Tạo & gửi lời mời"}
        </button>
        <button type="button" disabled={saving} onClick={() => setOpen(false)} className="hr-secondary-btn hr-secondary-btn--sm">
          Huỷ
        </button>
      </div>
    </form>
  );
}

function PermissionsTable({
  overrides,
  onOverrides,
}: {
  overrides: Override[] | null;
  onOverrides: React.Dispatch<React.SetStateAction<Override[] | null>>;
}) {
  const [error, setError] = useState("");
  const [saving, setSaving] = useState<string | null>(null);

  const groups = useMemo(() => {
    const m = new Map<string, (typeof HR_PERMISSIONS)[number][]>();
    for (const p of HR_PERMISSIONS) m.set(p.group, [...(m.get(p.group) ?? []), p]);
    return [...m.entries()];
  }, []);

  const overrideOf = (role: PermRole, key: string) => overrides?.find((o) => o.role === role && o.permission === key);

  /** Lưu một ô; hoàn tác (giữ nguyên state cũ) nếu server lỗi. */
  async function save(role: PermRole, key: string, allowed: boolean, def: boolean) {
    if (!overrides) return;
    const cell = `${role}:${key}`;
    const prev = overrides;
    // Lạc quan: bằng mặc định → bỏ dòng ghi đè (khớp server), khác → đặt dòng ghi đè.
    const rest = prev.filter((o) => !(o.role === role && o.permission === key));
    onOverrides(allowed === def ? rest : [...rest, { role, permission: key, allowed }]);
    setSaving(cell);
    setError("");
    try {
      const res = await hrFetch("/api/hr/permissions", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role, permission: key, allowed }),
      });
      if (!res.ok) {
        const j = await readJson(res);
        throw new Error(String(j.error ?? `HTTP ${res.status}`));
      }
    } catch (e) {
      onOverrides(prev);
      setError(e instanceof Error ? e.message : "Không lưu được");
    } finally {
      setSaving(null);
    }
  }

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-bold text-white">Quyền theo vai</h2>
        <p className="mt-1 text-[13px] text-white/50">
          Bấm ô để bật/tắt, lưu ngay. Chấm cam = khác mặc định. Sếp luôn toàn quyền.
        </p>
      </div>
      {error && <p role="alert" className="text-[13px] text-red-400">{error}</p>}
      <div className="hr-group overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-[13px]">
          <thead>
            <tr className="text-[11px] uppercase tracking-wider text-white/40">
              <th className="px-4 py-2 font-bold">Quyền</th>
              <th className="px-2 py-2 text-center font-bold">{ROLE_LABEL.boss}</th>
              {PERM_ROLES.map((r) => (
                <th key={r} className="px-2 py-2 text-center font-bold">{ROLE_LABEL[r]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {overrides === null && (
              <tr><td colSpan={5} className="px-4 py-6 text-white/50">Đang tải…</td></tr>
            )}
            {overrides &&
              groups.map(([group, perms]) => (
                <GroupRows key={group} group={group}>
                  {perms.map((p) => (
                    <tr key={p.key} className="border-t border-white/10">
                      <td className="px-4 py-2 text-white/80">{p.label}</td>
                      <td className="px-2 py-2 text-center text-[12px] text-white/40">Toàn quyền</td>
                      {PERM_ROLES.map((r) => {
                        const def = p.defaults[r];
                        const ov = overrideOf(r, p.key);
                        const value = ov ? ov.allowed : def;
                        const cell = `${r}:${p.key}`;
                        return (
                          <td key={r} className="px-2 py-2 text-center">
                            <div className="inline-flex items-center gap-1.5">
                              <input
                                type="checkbox"
                                aria-label={`${p.label} — ${ROLE_LABEL[r]}`}
                                checked={value}
                                disabled={saving === cell}
                                onChange={(e) => void save(r, p.key, e.target.checked, def)}
                                className="h-4 w-4 accent-[var(--hr-orange)]"
                              />
                              {ov && (
                                <>
                                  <span
                                    title={`Khác mặc định (mặc định: ${def ? "bật" : "tắt"})`}
                                    className="h-1.5 w-1.5 rounded-full bg-orange-500"
                                    data-testid="override-dot"
                                  />
                                  <button
                                    type="button"
                                    disabled={saving === cell}
                                    onClick={() => void save(r, p.key, def, def)}
                                    className="text-[11px] text-white/50 underline hover:text-white"
                                  >
                                    Về mặc định
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </GroupRows>
              ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function GroupRows({ group, children }: { group: string; children: React.ReactNode }) {
  return (
    <>
      <tr className="border-t border-white/10 bg-white/[0.03]">
        <th colSpan={5} className="px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white/50">
          {group}
        </th>
      </tr>
      {children}
    </>
  );
}
