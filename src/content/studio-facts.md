# TD Games — kho sự thật cho blog tự động

File này được `POST /api/admin/blog/topics` nạp vào prompt mỗi lần AI dựng bài.
Mọi thứ trong đây AI được phép nêu đích danh. Mọi thứ KHÔNG có trong đây, AI bị
cấm bịa — đó là lý do 80 bài auto trước 2026-09-23 nhạt: không có kho này nên
prompt cấm sạch mọi chi tiết cụ thể, bài chỉ còn nguyên tắc chung chung.

**Quy tắc sửa file:** chỉ ghi thứ sếp đứng ra bảo đảm được. Sai một con số ở đây
là sai trên toàn bộ bài viết từ đó về sau. Mục nào chưa chắc thì để nguyên
`(CHƯA ĐIỀN)` — AI hiểu ký hiệu đó là "không được nhắc tới".

---

## Studio làm gì

- Studio Việt Nam, nhận outsourcing cho studio game nước ngoài.
- Bốn mảng dịch vụ đang bán (khớp `/services`): 2D Art, 2D Animation, 2D VFX,
  Full Game Production.
- Trọng tâm là 2D. Không bán 3D nặng, không bán code gameplay, không bán engine
  internals.

## Dự án đã làm — được nêu đích danh

Toàn bộ danh sách dưới đây đã công khai ở `/portfolio` trên chính website, nên
nhắc tên trong blog là an toàn. Chỉ được nêu ĐÚNG những gì ghi ở đây: tên dự án
và loại việc. Không suy ra thời lượng, số asset, giá, hay tiến độ.

| Dự án | Loại việc |
|---|---|
| Axie Infinity — Origins | Animation |
| Lore Axie Origin | Cinematic |
| Sky Mavis — Animation Contest | Animation |
| Battle of the Gods / Mytheria | Login screen animation |
| Summoner Era — Heroes Fire | Animation + VFX |
| Summoner Era — Heroes Light/Dark | Animation + VFX |
| Summoner Era — Arena of Heroes | Animation |
| Summoner Era — Login Screen (2020) | Animation |
| Summoner Era — Mid Autumn | Animation |
| 3Q | Game animation + VFX |
| Kayn Snow Moon (League of Legends) | Login screen animation |
| Horse Racing | Splash art animation |
| Puzzle Wonderland | Character animation |
| Reaper & Lady — Project OverDrive | Game animation |
| Boss Animation — The Twins | Animation |

Đọc thêm chi tiết từng dự án: `src/app/portfolio/<slug>/project-data.ts`.

## Công cụ trong pipeline

- Art: Photoshop, Illustrator, Figma.
- Animation: Spine.
- AI hỗ trợ — ảnh: Midjourney, GPT, Gemini. Video: Seedance, Kling, VEO.
  ComfyUI dùng cho khâu sâu hơn (inpainting, upscale, ControlNet).

Đây là bộ tool sếp đã chốt ở JD tuyển dụng. **Không thêm tool nào ngoài danh sách
này** — kể cả tool nổi tiếng, kể cả khi bài viết đang thiếu ví dụ.

---

# Phần cần sếp điền — AI đang bị cấm nhắc tới

Mỗi mục điền xong là mở khoá một loại bài mà đối thủ không viết được. Điền được
mục nào thì xoá chữ `(CHƯA ĐIỀN)` của mục đó.

## Giá & cách báo giá
(CHƯA ĐIỀN) — khoảng giá thật theo loại asset, đơn vị tính (per asset / per
animation state / per sprint), phí gấp, phí revision ngoài gói.

## Thời gian
(CHƯA ĐIỀN) — thời gian thật cho một nhân vật Spine, một splash art, một batch
icon; mất bao lâu từ lúc nhận brief tới bản đầu.

## Quy trình & bàn giao
(CHƯA ĐIỀN) — số vòng revision trong gói, định dạng file bàn giao, quy ước đặt
tên, checklist QA trước khi giao, cách handoff cho Unity/Unreal.

## Quy mô đội
(CHƯA ĐIỀN) — bao nhiêu artist, bao nhiêu animator, chia team theo dự án thế nào.

## Sự cố thật đã gặp
(CHƯA ĐIỀN) — đây là mục giá trị nhất và không ai copy được. Mỗi dòng: chuyện gì
hỏng, vì sao, sửa ra sao, rút ra gì. Ví dụ dạng cần: "khách đổi style guide ở
tuần 3 của batch 40 nhân vật → phải làm lại X → từ đó bắt lock style trước khi
vào batch".

## Điều khoản hợp đồng
(CHƯA ĐIỀN) — sở hữu file gốc, NDA, điều khoản huỷ, quyền dùng AI trong sản xuất.
