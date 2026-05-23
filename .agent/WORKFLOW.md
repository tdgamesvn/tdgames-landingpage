# WORKFLOW — tdgames-landingpage

Entrypoint cho project agent.

## Memory Files

| File | Nội dung |
|------|----------|
| `meta/PROJECT.md` | Overview, tech stack, trạng thái |
| `meta/TASKS.md` | Backlog → Doing → Done |
| `meta/LOG.md` | Lịch sử công việc theo ngày |
| `meta/DECISIONS.md` | Quyết định kỹ thuật dài hạn |
| `meta/SCHEMA.md` | DB schema chi tiết (verified Supabase) |
| `meta/API.md` | API routes + curl examples |
| `meta/RUNBOOK.md` | Commands dev/ops + checklist deploy |

## Trước khi làm bất cứ việc gì

1. Đọc `meta/PROJECT.md` — overview + trạng thái hiện tại
2. Đọc `meta/TASKS.md` — xem Doing trước, rồi To do
3. Đọc entry cuối `meta/LOG.md` — context session trước

## Lệnh nhanh

```bash
npm run dev        # http://localhost:3000
npm run build      # Production build
npm run lint       # Lint
```

## Sau khi làm xong

- Append `LOG.md` (Task / Work Done / Validation / Result / Blockers / Next Step)
- Update `TASKS.md` (move tasks đúng trạng thái)
- Update `DECISIONS.md` nếu có quyết định kỹ thuật mới
- Update `SCHEMA.md` nếu có migration mới

## Agent key

- Key: `proj-tdgames-landingpage`
- GitHub: https://github.com/tdgamesvn/tdgames-landingpage
- Supabase: `zjunfcyymesfpeikspzf`
