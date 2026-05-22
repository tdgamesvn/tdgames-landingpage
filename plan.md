# Kế hoạch nội dung & triển khai (thực hiện sau)

Tài liệu ghi lại hướng đã chốt cho team 2 người: tách nội dung khỏi code UI, deploy qua CI/CD, không bắt buộc CMS giai đoạn đầu.

---

## 1. Mục tiêu

- Chỉnh **text, URL media, thứ tự, cờ kiểu `thumbnailIsVideo`** mà không sửa logic trong `home-hero` và các section tương tự.
- Có **blog / bài cập nhật** với ảnh, thứ tự ảnh có kiểm soát.
- **Load nhanh toàn cầu**: static + CDN phía Cloudflare; media lớn qua URL (không nhét file nặng vào Git nếu tránh được).

---

## 2. Nguồn nội dung: JSON trong repo

- Một hoặc vài file JSON (ví dụ `content/site.json`, `content/blog/*.json` hoặc Markdown + frontmatter cho bài dài).
- **Thứ tự** = thứ tự phần tử trong mảng (hero cards, gallery, v.v.).
- **TypeScript**: định nghĩa interface cho từng block (hero item, service, project, post meta) để tránh sai field khi sửa JSON.
- **Ảnh/video**: JSON chỉ lưu **URL** (tuyệt đối), trỏ tới R2/S3/Cloudflare R2 hoặc thư mục public tĩnh nếu file nhỏ.

### Gợi ý cấu trúc tối thiểu (tùy chỉnh khi làm)

```text
content/
  site.json          # hero, services, projects, footer, v.v.
  blog/
    index.json       # danh sách bài (slug, title, date, excerpt)
    my-post.md       # hoặc từng bài: nội dung dài + frontmatter
```

---

## 3. Tích hợp Next.js

- **Build time**: `import` JSON hoặc `fs.readFile` trong Server Component / `generateStaticParams` cho blog.
- Component (ví dụ `HomeHero`) nhận **props từ data đã load**, không hardcode mảng mock trong file component.
- Khi nội dung đổi: merge → build mới → deploy (xem mục 4).

---

## 4. CI/CD

- Pipeline: **install → lint/test (nếu có) → `next build` → deploy lên VPS** (Docker hoặc `node` + `pm2` / systemd tùy stack).
- Mỗi thay đổi `content/*.json` (và code) chạy lại pipeline; có thể cache `node_modules` / Next cache để build nhanh hơn.
- **Tùy chọn sau này**: webhook từ Git → deploy tự động; hoặc manual approval nếu muốn kiểm soát release.

---

## 5. Hạ tầng

| Thành phần | Vai trò |
|------------|--------|
| **VPS** | Chạy app Next (production) hoặc static export nếu chọn export. |
| **Cloudflare** | DNS, proxy, SSL, cache tĩnh (JS/CSS/font/hình), giảm tải origin. Cấu hình cache phù hợp; cẩn thận nếu bật cache HTML. |
| **Object storage + CDN** (R2, S3, v.v.) | Lưu ảnh/video blog và asset nặng; URL ghi trong JSON. |

---

## 6. Blog

- **Giai đoạn 1**: Markdown trong repo + frontmatter (title, date, cover, `images[]` có thứ tự) hoặc JSON meta + `.md` body.
- **Routing**: `app/blog/page.tsx` (danh sách), `app/blog/[slug]/page.tsx` (chi tiết), generate static paths từ danh sách file/content.
- **Sau này** (nếu cần): cân nhắc Sanity/Payload khi có người không dùng Git hoặc cần publish không qua deploy.

---

## 7. Checklist triển khai (làm lần lượt)

1. [ ] Chốt schema TypeScript cho `site.json` và cho từng loại card (gồm `thumbnailIsVideo` hoặc quy ước theo extension URL).
2. [ ] Tách dữ liệu mock hiện tại trong các component vào `content/site.json`.
3. [ ] Wire `page.tsx` / layout sections đọc từ `content/`.
4. [ ] Thêm thư mục `content/blog/` + route blog + style trang list/detail.
5. [ ] Thiết lập CI/CD build + deploy VPS.
6. [ ] Trỏ domain qua Cloudflare; bật cache rules cho asset tĩnh; SSL Full (strict).
7. [ ] (Tuỳ chọn) Đưa media nặng lên bucket + chỉnh URL trong JSON.

---

## 8. Ghi chú

- Team 2 người: **JSON + Git + CI/CD** thường đủ; review PR = review nội dung + code.
- Nếu sau này thêm người chỉnh nội dung không quen Git, quay lại đánh giá **Git-based CMS (Tina/Decap)** hoặc **headless CMS** thay vì mở rộng script thủ công.

---

*Tài liệu này là kế hoạch tham chiếu; cập nhật checklist khi đã hoàn thành từng mục.*
