import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { extractJson } from "@/lib/blog-ai";

/**
 * Sinh bộ câu hỏi phỏng vấn CEO cho một chủ đề.
 *
 * ponytail: một câu hỏi `ask` duy nhất chỉ moi được một ý — bài viết ra vẫn mỏng.
 * Phỏng vấn 6 câu nhắm vào con số, sự cố, quy trình thật thì mới có chất liệu mà
 * đối thủ không copy được. Đây chính là thứ Google xếp hạng cao hơn bài AI chung chung.
 */
const INTERVIEW_PROMPT = `Bạn là nhà báo chuyên phỏng vấn lãnh đạo studio game, đang khai thác chất liệu để viết một bài blog TIẾNG ANH cho TD Games — studio Việt Nam nhận outsourcing 2D game art, animation (Spine) và VFX cho studio game nước ngoài.

Người trả lời là CEO của TD Games. Bài viết nhắm tới khách đang cân nhắc thuê studio outsource.

Hãy đặt ĐÚNG 6 câu hỏi phỏng vấn để moi ra chất liệu mà KHÔNG studio nào khác có:
- Hỏi CON SỐ cụ thể: giá, thời gian, số lần sửa, số asset, tỉ lệ giảm rework, quy mô team.
- Hỏi SỰ CỐ thật: lần hỏng việc nào đó, nguyên nhân, cách xử lý, bài học.
- Hỏi QUY TRÌNH thật: các bước studio đang làm, công cụ, ai làm gì.
- Hỏi SO SÁNH: trước và sau khi thay đổi cách làm, hoặc studio này với studio khác.
- Hỏi VÍ DỤ có tên: dự án nào, khách loại nào (không cần lộ tên khách nếu NDA).

Nguyên tắc:
- Mỗi câu hỏi phải TRẢ LỜI ĐƯỢC bằng một đoạn ngắn, đừng hỏi lan man nhiều ý trong một câu.
- Hỏi TIẾNG VIỆT, giọng thân mật như đang ngồi nói chuyện.
- Không hỏi thứ tra Google ra được. Chỉ hỏi thứ chỉ người trong studio mới biết.
- Câu đầu tiên nên dễ trả lời nhất để CEO bắt nhịp.

Với mỗi câu hỏi trả về:
- "q": câu hỏi, TIẾNG VIỆT
- "why": một mệnh đề RẤT ngắn nói vì sao câu này làm bài mạnh hơn (để CEO biết đáng công trả lời)
- "a": BẢN NHÁP câu trả lời viết sẵn hộ CEO, TIẾNG VIỆT, 2-4 câu, giọng kể chuyện của người trong nghề. CEO sẽ đọc và sửa, hoặc dùng luôn.

Quy tắc cho "a" — quan trọng:
- Viết phần khung, phần lập luận, phần quy trình theo hiểu biết chuẩn của ngành 2D game art outsourcing. Chỗ này cứ viết đầy đủ.
- NHƯNG mọi CON SỐ, TÊN DỰ ÁN, TÊN KHÁCH, MỐC THỜI GIAN cụ thể mà chỉ người trong TD Games mới biết thì TUYỆT ĐỐI KHÔNG được bịa. Thay bằng marker vuông mô tả cái cần điền, ví dụ: [bao nhiêu ngày?], [tên dự án?], [giảm bao nhiêu %?], [team mấy người?].
- Thà nhiều marker còn hơn một con số sai — bài này đăng public, số sai là claim sai.

Chỉ trả về JSON: {"questions":[{"q":"","why":"","a":""}]}`;

export async function POST(req: Request) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  const baseUrl = process.env.AI_BASE_URL;
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL ?? "gpt-5.4-mini";
  if (!baseUrl || !apiKey) {
    return NextResponse.json({ error: "AI_BASE_URL / AI_API_KEY not configured" }, { status: 500 });
  }

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data: topic, error } = await supabase
    .from("blog_topics")
    .select("*")
    .eq("id", id)
    .single();
  if (error || !topic) return NextResponse.json({ error: "Topic not found" }, { status: 404 });

  let res: Response;
  try {
    res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: INTERVIEW_PROMPT },
          {
            role: "user",
            content: JSON.stringify({
              topic: topic.topic,
              target_keyword: topic.keyword,
              search_intent: topic.intent,
              why_us: topic.why,
              seed_question: topic.ask,
            }),
          },
        ],
        temperature: 0.7,
      }),
      signal: AbortSignal.timeout(180_000),
    });
  } catch {
    return NextResponse.json(
      { error: "AI backend unreachable (Mac tắt / cliproxyapi không chạy?)" },
      { status: 502 },
    );
  }
  if (!res.ok) {
    return NextResponse.json({ error: `AI backend error ${res.status}` }, { status: 502 });
  }

  const raw: string = (await res.json())?.choices?.[0]?.message?.content ?? "";
  try {
    const parsed = extractJson(raw) as { questions?: { q?: string; why?: string; a?: string }[] };
    const questions = (parsed.questions ?? [])
      .map((x) => ({
        q: String(x.q ?? "").trim(),
        why: String(x.why ?? "").trim(),
        a: String(x.a ?? "").trim(),
      }))
      .filter((x) => x.q);
    if (!questions.length) throw new Error("rỗng");
    return NextResponse.json({ questions });
  } catch {
    return NextResponse.json(
      { error: "AI trả output không đọc được", raw: raw.slice(0, 500) },
      { status: 502 },
    );
  }
}
