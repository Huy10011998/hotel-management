/**
 * Nội dung tĩnh của website khách (ảnh, mô tả, tiện ích, FAQ…).
 * Giai đoạn BE: chuyển sang collection `site_content` / CMS để khách sạn tự sửa.
 * Ảnh phòng trong /public/site lấy từ Unsplash (minh họa — nên thay bằng ảnh thật của khách sạn).
 * Ảnh địa danh Đồng Tháp lấy từ Wikimedia Commons, giấy phép CC BY-SA — phải giữ ghi công (PHOTO_CREDITS).
 * Mục ghi "CẦN XÁC NHẬN": chưa tìm thấy nguồn công khai, khách sạn cần kiểm tra lại.
 */
import {
  BadgePercent,
  Bike,
  CalendarCheck,
  Car,
  ConciergeBell,
  Headset,
  Plane,
  ShieldCheck,
  Shirt,
  Snowflake,
  Sparkles,
  UtensilsCrossed,
  Wifi,
  type LucideIcon,
} from "lucide-react";

/** Khu vực hiển thị cạnh tên khách sạn khi chưa có hạng sao. */
export const SITE_AREA = "Cao Lãnh · Đồng Tháp";

/** Công viên Văn Miếu Cao Lãnh — khu phố đi bộ quanh công viên gồm cả đường Đặng Văn Bình. */
export const HERO_IMAGE = "/site/van-mieu-ho.jpg";

export interface RoomContent {
  images: string[];
  view: string;
  tagline: string;
  story: string;
  highlights: string[];
}

/** Theo mã loại phòng — loại phòng mới tạo trong trang quản trị dùng nội dung mặc định. Ảnh minh họa, CẦN thay ảnh thật. */
const ROOM_CONTENT: Record<string, RoomContent> = {
  STD: {
    images: ["/site/std-1.jpg", "/site/std-2.jpg", "/site/std-3.jpg"],
    view: "Hướng nội khu",
    tagline: "Gọn gàng, tiết kiệm cho chuyến công tác ngắn ngày",
    story:
      "Phòng Standard sạch sẽ, yên tĩnh với giường đôi, điều hòa, nước nóng và Wi-Fi miễn phí — lựa chọn hợp lý khi bạn công tác hoặc ghé Cao Lãnh vài ngày.",
    highlights: ["Giường đôi 1m6", "Nước nóng", "Wi-Fi miễn phí"],
  },
  SUP: {
    images: ["/site/sup-1.jpg", "/site/sup-2.jpg", "/site/sup-3.jpg"],
    view: "Có cửa sổ",
    tagline: "Thoáng hơn, có cửa sổ đón ánh sáng tự nhiên",
    story:
      "Superior có cửa sổ và lựa chọn 2 giường đơn hoặc 1 giường đôi — phù hợp bạn bè, đồng nghiệp đi cùng nhau.",
    highlights: ["Cửa sổ", "2 giường đơn hoặc 1 giường đôi", "Smart TV"],
  },
  DLX: {
    images: ["/site/dlx-1.jpg", "/site/dlx-2.jpg", "/site/dlx-3.jpg"],
    view: "Cửa sổ lớn",
    tagline: "Giường lớn, không gian rộng rãi cho cặp đôi",
    story:
      "Deluxe với giường đôi lớn 1m8, cửa sổ lớn và bàn làm việc riêng. Thích hợp cho cặp đôi hoặc khách lưu trú dài ngày muốn thêm chút thoải mái.",
    highlights: ["Giường 1m8", "Cửa sổ lớn", "Bàn làm việc"],
  },
  FAM: {
    images: ["/site/fam-1.jpg", "/site/fam-2.jpg", "/site/std-3.jpg"],
    view: "Có cửa sổ",
    tagline: "Không gian cho cả gia đình",
    story:
      "Phòng Family với 2 giường đôi và sofa, đủ chỗ cho gia đình 4 người lớn — tiện cho các chuyến về quê, thăm Văn Miếu hay du lịch Xẻo Quýt, Tràm Chim.",
    highlights: ["2 giường đôi", "Sofa", "Tối đa 4 người lớn"],
  },
  STE: {
    images: ["/site/ste-1.jpg", "/site/ste-2.jpg", "/site/ste-3.jpg"],
    view: "Cửa sổ lớn",
    tagline: "Phòng rộng nhất, có góc tiếp khách",
    story:
      "Phòng VIP rộng rãi với giường đôi lớn, sofa và góc tiếp khách, bồn tắm riêng — dành cho khách công tác cần không gian làm việc hoặc nghỉ ngơi thoải mái hơn.",
    highlights: ["Góc tiếp khách", "Bồn tắm", "Bàn làm việc"],
  },
};

const DEFAULT_ROOM_CONTENT: RoomContent = {
  images: ["/site/sup-1.jpg", "/site/std-3.jpg"],
  view: "Có cửa sổ",
  tagline: "Tiện nghi, ấm cúng giữa trung tâm Cao Lãnh",
  story: "Phòng được trang bị đầy đủ tiện nghi, dọn phòng hằng ngày và lễ tân hỗ trợ 24/7.",
  highlights: [],
};

export function roomContent(code: string): RoomContent {
  return ROOM_CONTENT[code] ?? DEFAULT_ROOM_CONTENT;
}

/** Ưu đãi khi đặt trực tiếp (so với OTA). */
export const DIRECT_BENEFITS: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: BadgePercent, title: "Giá tốt nhất", text: "Rẻ hơn hoặc bằng giá trên các trang đặt phòng" },
  { icon: CalendarCheck, title: "Hủy miễn phí", text: "Với gói giá linh hoạt, trước ngày đến 2 ngày" },
  { icon: Headset, title: "Hỗ trợ tận tình", text: "Lễ tân tư vấn tham quan, gọi xe, đặt tour" },
  { icon: ShieldCheck, title: "Thanh toán an toàn", text: "VietQR, thẻ, ví điện tử hoặc trả tại khách sạn" },
];

/** Tiện ích — CẦN XÁC NHẬN với khách sạn, chỉ giữ các tiện ích phổ biến. */
export const FACILITIES: { icon: LucideIcon; label: string }[] = [
  { icon: Wifi, label: "Wi-Fi miễn phí" },
  { icon: ConciergeBell, label: "Lễ tân 24/7" },
  { icon: Snowflake, label: "Điều hòa, nước nóng" },
  { icon: Sparkles, label: "Dọn phòng hằng ngày" },
  { icon: Car, label: "Chỗ để xe" },
  { icon: Shirt, label: "Giặt ủi" },
  { icon: Bike, label: "Cho thuê xe máy" },
  { icon: UtensilsCrossed, label: "Ăn sáng (theo gói)" },
];

/** Ghi công ảnh Wikimedia Commons (bắt buộc với CC BY-SA). */
export const PHOTO_CREDITS: { image: string; title: string; author: string; license: string; url: string }[] = [
  { image: "/site/van-mieu-ho.jpg", title: "Công viên Văn Thánh Miếu Cao Lãnh", author: "Bùi Thụy Đào Nguyên", license: "CC BY-SA 3.0", url: "https://commons.wikimedia.org/wiki/File:C%C3%B4ng_vi%C3%AAn_V%C4%83n_Th%C3%A1nh_Mi%E1%BA%BFu_Cao_L%C3%A3nh.jpg" },
  { image: "/site/van-mieu.jpg", title: "Văn miếu Cao Lãnh", author: "Bùi Thụy Đào Nguyên", license: "CC BY-SA 3.0", url: "https://commons.wikimedia.org/wiki/File:V%C4%83n_mi%E1%BA%BFu_Cao_L%C3%A3nh.jpg" },
  { image: "/site/nguyen-sinh-sac.jpg", title: "Đền thờ Nguyễn Sinh Sắc", author: "Bùi Thụy Đào Nguyên", license: "CC BY-SA 3.0", url: "https://commons.wikimedia.org/wiki/File:%C4%90%E1%BB%81n_th%E1%BB%9D_Nguy%E1%BB%85n_Sinh_S%E1%BA%AFc.jpg" },
  { image: "/site/xeo-quyt.jpg", title: "Xẻo Quýt", author: "Tonbi ko", license: "CC BY-SA 4.0", url: "https://commons.wikimedia.org/wiki/File:Xeo_quyt.jpg" },
  { image: "/site/tram-chim.jpg", title: "Vườn quốc gia Tràm Chim", author: "Nhthien", license: "CC BY-SA 3.0", url: "https://commons.wikimedia.org/wiki/File:Chim_H%E1%BA%A1c_%E1%BB%9F_V%C6%B0%E1%BB%9Dn_Qu%E1%BB%91c_Gia_Tr%C3%A0m_Chim.jpg" },
];

/** Điểm tham quan quanh Cao Lãnh. */
export const ATTRACTIONS = [
  { image: "/site/van-mieu.jpg", title: "Văn Miếu Cao Lãnh", text: "Công viên Văn Miếu với hồ nước và khu phố đi bộ ngay gần khách sạn — nơi dạo mát buổi chiều." },
  { image: "/site/nguyen-sinh-sac.jpg", title: "Khu di tích Nguyễn Sinh Sắc", text: "Nơi an nghỉ của cụ Phó bảng Nguyễn Sinh Sắc, thân sinh Chủ tịch Hồ Chí Minh. Mở cửa 7:00 – 17:00, miễn phí." },
  { image: "/site/xeo-quyt.jpg", title: "Khu di tích Xẻo Quýt", text: "Đi xuồng xuyên rừng tràm giữa di tích căn cứ kháng chiến, cách trung tâm khoảng 30 km." },
  { image: "/site/tram-chim.jpg", title: "Vườn quốc gia Tràm Chim", text: "Vùng đất ngập nước Đồng Tháp Mười, nơi ngắm sếu đầu đỏ và chim nước, cách khoảng 35 km." },
];

/** Đánh giá thật của khách (Google / OTA) — để trống thì trang chủ ẩn mục đánh giá. Không đưa đánh giá tự soạn lên đây. */
export const RATING: { score: number; label: string; count: number } | null = null;
export const RATING_BREAKDOWN: [string, number][] = [];
export const REVIEWS: { name: string; from: string; stay: string; score: number; text: string }[] = [];

/** Khoảng cách ước tính (nguồn: cổng thông tin du lịch) — tính từ trung tâm Cao Lãnh. */
export const NEARBY: [string, string][] = [
  ["Công viên Văn Miếu Cao Lãnh", "Đi bộ được"],
  ["Chợ Cao Lãnh", "Trung tâm phường"],
  ["Khu di tích Nguyễn Sinh Sắc", "~1 km"],
  ["Khu di tích Xẻo Quýt", "~30 km"],
  ["Vườn quốc gia Tràm Chim", "~35 km"],
];

export const FAQS: [string, string][] = [
  ["Giờ nhận phòng và trả phòng là mấy giờ?", "Nhận phòng từ {checkIn}, trả phòng trước {checkOut}. Nhận phòng sớm hoặc trả phòng muộn tùy tình trạng phòng, có thể phát sinh phụ thu."],
  ["Tôi cần mang giấy tờ gì khi nhận phòng?", "Khách Việt Nam xuất trình CCCD gắn chip; khách nước ngoài xuất trình hộ chiếu còn hạn và thị thực. Khách sạn thực hiện khai báo lưu trú theo quy định."],
  ["Giá phòng đã bao gồm thuế và phí chưa?", "Tổng tiền hiển thị khi đặt đã gồm phí dịch vụ {fee}% và VAT {vat}%. Giá theo đêm hiển thị là giá trung bình trước thuế phí."],
  ["Trẻ em có được ở miễn phí không?", "Trẻ dưới 6 tuổi ngủ chung giường với bố mẹ được miễn phí. Mỗi hạng phòng có số trẻ em tối đa — xem chi tiết từng phòng."],
  ["Tôi có thể hủy hoặc đổi ngày không?", "Gói giá linh hoạt được hủy miễn phí trước ngày nhận phòng 2 ngày. Gói không hoàn hủy có giá tốt hơn nhưng không được hoàn tiền. Bạn có thể tự hủy trong mục Tra cứu đặt phòng."],
  ["Đi đến khách sạn bằng cách nào?", "Khách sạn ở trung tâm Phường Cao Lãnh, gần công viên Văn Miếu. Lễ tân hỗ trợ đón tại bến xe Cao Lãnh hoặc sân bay Cần Thơ — chọn ở mục Dịch vụ thêm khi đặt phòng."],
  ["Khách sạn có xuất hóa đơn VAT cho công ty không?", "Có. Chọn \"Xuất hóa đơn công ty\" khi đặt phòng và nhập mã số thuế; hóa đơn điện tử được gửi qua email sau khi trả phòng."],
];

export const SPECIAL_REQUESTS = [
  { key: "high_floor", label: "Phòng tầng cao" },
  { key: "quiet", label: "Phòng yên tĩnh" },
  { key: "non_smoking", label: "Không hút thuốc" },
  { key: "early_checkin", label: "Nhận phòng sớm" },
  { key: "baby_cot", label: "Nôi em bé" },
  { key: "celebration", label: "Trang trí kỷ niệm / sinh nhật" },
];

export const ARRIVAL_TIMES = ["Trước 12:00", "12:00 – 14:00", "14:00 – 16:00", "16:00 – 18:00", "18:00 – 20:00", "20:00 – 22:00", "Sau 22:00"];

/** Dịch vụ cho khách đặt kèm — giá lấy từ danh mục Dịch vụ của khách sạn. */
/** Dịch vụ cho khách đặt kèm — giá lấy từ danh mục Dịch vụ của khách sạn. */
export const ADDONS: { serviceId: string; icon: LucideIcon; text: string }[] = [
  { serviceId: "sv-12", icon: Car, text: "Đón tại bến xe Cao Lãnh, báo giờ đến cho lễ tân." },
  { serviceId: "sv-10", icon: Plane, text: "Xe 4–7 chỗ đón tại sân bay Cần Thơ, tài xế cầm bảng tên." },
  { serviceId: "sv-11", icon: Bike, text: "Xe tay ga kèm 2 mũ bảo hiểm — tiện đi Văn Miếu, chợ Cao Lãnh, Xẻo Quýt." },
  { serviceId: "sv-8", icon: UtensilsCrossed, text: "Dành cho gói Chỉ phòng — ăn sáng tại khách sạn, tính theo suất." },
];

export const NATIONALITIES = ["Việt Nam", "Hoa Kỳ", "Anh", "Úc", "Pháp", "Đức", "Nhật Bản", "Hàn Quốc", "Trung Quốc", "Singapore", "Thái Lan", "Khác"];
