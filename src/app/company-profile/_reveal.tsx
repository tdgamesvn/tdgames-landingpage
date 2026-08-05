"use client";

import { motion } from "framer-motion";

// ponytail: 1 wrapper duy nhất cho toàn trang thay vì mỗi section tự viết motion.
// Chỉ fade+rise, không stagger phức tạp — chuyển động nhiều làm hồ sơ năng lực
// trông như demo hiệu ứng, không phải tài liệu bán hàng.
export default function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
