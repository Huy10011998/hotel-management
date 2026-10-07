"use client";

import Link from "next/link";
import { SiteContainer } from "@/components/site/site-shell";
import { useStore } from "@/lib/store";
import { FREE_CANCEL_DAYS, MAX_NIGHTS } from "@/lib/booking";
import { formatVND } from "@/lib/utils";

function Policy({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 border-b py-6 last:border-0">
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-muted-foreground [&_li]:ml-5 [&_li]:list-disc">{children}</div>
    </section>
  );
}

export default function PoliciesPage() {
  const { hotel, services } = useStore();
  const price = (id: string) => formatVND(services.find((s) => s.id === id)?.price ?? 0);
  return (
    <SiteContainer className="max-w-3xl py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Chính sách & điều khoản</h1>
      <p className="mt-2 text-muted-foreground">Áp dụng cho đặt phòng trực tiếp tại website {hotel.website}.</p>

      <Policy id="nhan-tra-phong" title="Nhận & trả phòng">
        <ul>
          <li>Nhận phòng từ {hotel.checkInTime}, trả phòng trước {hotel.checkOutTime}.</li>
          <li>Nhận phòng sớm / trả phòng muộn tùy tình trạng phòng, phụ thu {price("sv-13")} / {price("sv-14")} mỗi lần.</li>
          <li>Khách xuất trình CCCD gắn chip hoặc hộ chiếu còn hạn khi nhận phòng để khai báo lưu trú theo Luật Cư trú.</li>
          <li>Toàn bộ khu vực phòng nghỉ không hút thuốc; không mang thú cưng.</li>
        </ul>
      </Policy>

      <Policy id="huy-phong" title="Hủy, thay đổi & hoàn tiền">
        <ul>
          <li><b className="text-foreground">Gói linh hoạt:</b> miễn phí hủy đến hết ngày trước ngày nhận phòng {FREE_CANCEL_DAYS} ngày. Sau thời hạn này hoặc không đến (no-show), phí bằng tiền phòng đêm đầu tiên.</li>
          <li><b className="text-foreground">Gói không hoàn hủy:</b> thanh toán trước toàn bộ, không hoàn tiền khi hủy, thay đổi hoặc không đến.</li>
          <li>Tự hủy tại mục <Link href="/tra-cuu" className="text-primary hover:underline">Tra cứu đặt phòng</Link>. Đổi ngày vui lòng liên hệ {hotel.phone}.</li>
          <li>Tiền hoàn về đúng phương thức đã thanh toán trong 5–7 ngày làm việc.</li>
        </ul>
      </Policy>

      <Policy id="tre-em" title="Trẻ em & giường phụ">
        <ul>
          <li>Trẻ dưới 6 tuổi ngủ chung giường với bố mẹ được miễn phí, bao gồm ăn sáng.</li>
          <li>Trẻ từ 6 đến dưới 12 tuổi tính theo số trẻ em tối đa của từng hạng phòng.</li>
          <li>Giường phụ {price("sv-15")} / đêm, đặt qua lễ tân; nôi em bé miễn phí theo yêu cầu.</li>
        </ul>
      </Policy>

      <Policy id="thanh-toan" title="Giá & thanh toán">
        <ul>
          <li>Giá niêm yết bằng VND. Tổng tiền khi đặt đã gồm phí dịch vụ {hotel.serviceFeePercent}% và VAT {hotel.vatPercent}%.</li>
          <li>Hình thức: chuyển khoản VietQR, thẻ ATM / Visa / Mastercard / JCB, ví MoMo (qua cổng VNPay), hoặc thanh toán tại khách sạn với gói linh hoạt.</li>
          <li>Đặt trực tuyến tối đa {MAX_NIGHTS} đêm và 1 phòng mỗi lần; đặt nhiều phòng hoặc đoàn vui lòng liên hệ để có giá tốt nhất.</li>
          <li>Hóa đơn điện tử xuất theo thông tin cung cấp khi đặt phòng, gửi qua email sau khi trả phòng.</li>
        </ul>
      </Policy>

      <Policy id="bao-mat" title="Bảo vệ dữ liệu cá nhân">
        <p>
          {hotel.legalName} xử lý dữ liệu cá nhân theo Nghị định 13/2023/NĐ-CP. Dữ liệu (họ tên, liên hệ, quốc tịch, giấy tờ tùy thân khi nhận phòng) chỉ dùng để thực hiện đặt phòng,
          khai báo lưu trú theo quy định và chăm sóc khách hàng; không bán hay chia sẻ cho bên thứ ba ngoài cơ quan chức năng và đối tác thanh toán.
        </p>
        <p>Thông tin thẻ do cổng thanh toán xử lý, khách sạn không lưu trữ. Bạn có quyền yêu cầu xem, chỉnh sửa hoặc xóa dữ liệu qua email {hotel.email}.</p>
        <p>Email khuyến mãi chỉ được gửi khi bạn đồng ý và có thể hủy đăng ký bất cứ lúc nào.</p>
      </Policy>
    </SiteContainer>
  );
}
