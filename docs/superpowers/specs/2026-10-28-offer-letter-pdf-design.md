# Mail offer + Thư mời nhận việc (PDF đính kèm) — Design

Ngày: 2026-10-28 · Sếp duyệt nội dung (em rà lại) + chọn PDF.

## Vì sao
Thư mời nhận việc hiện làm tay bằng Word (mẫu "TD Games - Thư mời nhận việc - <Tên>.docx") rồi đính kèm mail. Nhiều chỗ khác nhau từng người (chức danh, ngày bắt đầu, lương + phụ cấp, máy tính/điện thoại công ty hay cá nhân, email công việc…). Mục tiêu: Kế toán/HR điền form trong /hr → hệ thống sinh PDF đúng mẫu, đính kèm mail offer; thân mail ngắn, không lộ lương.

## Mail offer (mẫu mặc định mới, kind `offer`)
Tiêu đề: `[TD Games] Thư mời nhận việc — {vi_tri}`

```
Xin chào {ten_ung_vien},

Thay mặt TD Games, cảm ơn bạn đã dành thời gian tham gia quá trình tuyển dụng. Sau quá trình cân nhắc kỹ, chúng tôi rất vui thông báo bạn đã vượt qua vòng phỏng vấn và được lựa chọn cho vị trí {vi_tri}.

- Chức danh: {chuc_danh}
- Ngày bắt đầu: {ngay_bat_dau}
- Thời gian làm việc: {thoi_gian_lam_viec}
- Địa điểm: {dia_diem}
- Chế độ đãi ngộ: Xem chi tiết trong file đính kèm

File đính kèm “{ten_file}”: mức lương, phụ cấp, thời gian thử việc, phúc lợi, giấy tờ cần chuẩn bị và lịch trình ngày đầu đi làm.

Bạn vui lòng trả lời email này để xác nhận nhận offer trước {han_xac_nhan}. Nếu có câu hỏi về công việc, vị trí hay chế độ, bạn liên hệ:
{nguoi_lien_he}

TD Games rất mong được chào đón bạn trở thành một phần của đội ngũ!

{chu_ky}
```
(Dòng "- Nhãn: giá trị" tự thành bảng thông tin trong HTML như các mail khác.)

Biến offer mới: `chuc_danh`, `ngay_bat_dau` (vd "8:45, Thứ Hai 12/10/2026" — tự sinh thứ từ ngày + giờ), `thoi_gian_lam_viec`, `dia_diem`, `han_xac_nhan` (vd "Thứ Sáu 30/10/2026"), `nguoi_lien_he` (một dòng: "Ms. Thảo (Đào Thị Xuân Thảo) · 0964525584 · ketoan@tdconsulting.vn" — xem luật dưới), `ten_file`. Giữ `muc_luong` hợp lệ (tương thích) nhưng mẫu mặc định KHÔNG dùng (không lộ lương trong thân mail).

**Người liên hệ:** người gửi là Kế toán/HR → chính người đó; Sếp gửi → tài khoản Kế toán đầu tiên chưa khoá (theo created_at); chưa có → "Phòng Nhân sự · hr@tdgamestudio.com". Định dạng: `{display_name} · {phone} · {email}` (bỏ phần trống).

**Hạn xác nhận:** mặc định = ngày gửi + 3 ngày làm việc (bỏ T7/CN), sửa được trong form.

## Thư mời nhận việc (PDF A4, tiếng Việt)
Bố cục theo file Word gốc (sếp gửi ảnh): logo TD Games trên cùng, tiêu đề "THƯ MỜI NHẬN VIỆC", "Thân gửi bạn **{tên}**," đoạn mở đầu, bảng 2 cột NỘI DUNG / GHI CHÚ chia mục có thanh tiêu đề cam:
- **I. Thông tin vị trí:** 1 Chức danh · 2 Địa điểm làm việc · 3 Thời gian làm việc · 4 Ngày bắt đầu làm việc (đậm) · 5 Mức lương: Lương cơ bản + danh sách phụ cấp (tên + số tiền, thêm/bớt dòng) + **Tổng lương gross (tự cộng)**; ghi chú cột phải = thử việc (vd "Thử việc 2 tháng (hưởng 100% lương)") · 6 Máy tính làm việc · 7 Điện thoại.
- **II. Chính sách phúc lợi:** 1 Trợ cấp gửi xe · 2 Phúc lợi khác (danh sách gạch đầu dòng).
- **III. Chuẩn bị cho ngày đầu đi làm:** 1 Email công việc · 2 Các giấy tờ cần chuẩn bị (danh sách) + ghi chú (hạn nộp).
- **IV. Lịch trình ngày đầu đi làm:** bảng giờ – việc.
- Đoạn kết, "GIÁM ĐỐC", tên người ký.
Số tiền định dạng `5.310.000 VND`. Đánh số liền mạch (bản gốc nhảy số).

**Trường riêng từng người** (form trong hồ sơ): tên ứng viên (mặc định từ hồ sơ), chức danh (mặc định tên job), ngày + giờ bắt đầu, lương cơ bản, phụ cấp (mặc định danh sách tên từ mẫu, số tiền trống), ghi chú thử việc, máy tính, điện thoại, email công việc, hạn xác nhận. Mọi trường khác lấy từ **mẫu mặc định công ty** nhưng vẫn sửa được cho từng người.

**Mẫu mặc định công ty** (sửa trong tab Mẫu mail → mục "Thư mời nhận việc"): địa điểm, thời gian làm việc, giờ bắt đầu mặc định (8:45), danh sách tên phụ cấp mặc định, ghi chú thử việc mặc định, máy tính / điện thoại mặc định, trợ cấp gửi xe, phúc lợi khác, định dạng email công việc (vd "tên + họ viết tắt @tdgames…" dạng text hướng dẫn), giấy tờ cần chuẩn bị + ghi chú, lịch trình ngày đầu, đoạn mở đầu, đoạn kết, chức vụ + tên người ký. Mặc định ban đầu chép từ file Word sếp gửi.

## Lưu & bảo mật
- `offer_letters` (application_id PK → applications on delete cascade, data jsonb, updated_by, updated_by_user_id, updated_at). Defaults: `app_settings` key `offer_letter_defaults` (JSON).
- Quyền: xem/sửa thư mời + xem trước PDF + gửi = `emails.send_offer` (HR, Kế toán, Sếp) + phạm vi hồ sơ (loadScopedApplication). Sửa mẫu mặc định = `emails.templates`.
- KHÔNG lưu PDF lên CDN công khai (có lương). Gửi mail: server sinh PDF từ dữ liệu đã lưu, đính kèm qua Resend `attachments` (base64). `candidate_emails.attachments jsonb` lưu `[{filename, kind:"offer_letter", snapshot}]` (snapshot = dữ liệu thư lúc gửi) để xem lại; tải lại qua endpoint có xác thực (sinh lại PDF từ snapshot).
- Chế độ test: PDF vẫn đính kèm, mail về tony@.
- Gửi mail offer bắt buộc đã lưu thư mời; thiếu trường bắt buộc (chức danh, ngày bắt đầu, lương cơ bản) → không cho gửi, báo rõ.

## Duyệt thư mời (Sếp chốt 2026-10-28)
- Người KHÔNG phải Sếp (Kế toán, HR…) soạn thư → **Gửi Sếp duyệt** → Sếp **Duyệt** hoặc **Yêu cầu sửa** (ghi chú bắt buộc, ≤ 500 ký tự) → chỉ khi **đã duyệt** mới gửi mail offer. Trạng thái: `draft` | `pending` | `approved` | `changes_requested` (cột `offer_letters.approval_status`, kèm submitted_*/reviewed_*/review_note).
- Sếp tự lưu thư = đã duyệt. Người khác sửa nội dung thư đã gửi duyệt / đã duyệt → về `draft` (so JSON ổn định của dữ liệu đã sanitize; lưu lại y nguyên thì giữ trạng thái).
- Chặn ở server: POST gửi mail `offer` và draft GET `offer` → 400 "Thư mời chưa được Sếp duyệt" (`code: offer_not_approved`).
- Thông báo (không có lương): gửi duyệt → mọi Sếp (Discord tag Sếp có Discord ID, không ai có → @everyone; push); Sếp quyết định → người gửi duyệt + người support (push + Discord tag).
- UI: khối Offer ① Soạn thư → ② Gửi Sếp duyệt (Sếp: Duyệt / Yêu cầu sửa / Xem thư) → ③ Gửi mail offer; dải trạng thái + xác nhận khi sửa thư đã duyệt trong hộp thoại thư; card pipeline nhãn "Chờ duyệt offer".
- Code: thuần `src/lib/offer-letter-approval.ts` (nextApprovalOnSave, canSubmit/canReview/canSendOffer, validateReviewInput, offerApprovalRecipients); `notifyOfferApproval` (hr-notify.ts).

## Không làm
- Ký số / chữ ký ảnh. File Word. Ứng viên bấm "chấp nhận" online (vẫn trả lời mail).
