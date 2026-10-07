/**
 * Sinh chuỗi VietQR (chuẩn EMVCo / NAPAS 247) để in mã QR chuyển khoản có sẵn số tiền + nội dung.
 * Không gọi dịch vụ ngoài.
 */
function tlv(id: string, value: string) {
  return `${id}${String(value.length).padStart(2, "0")}${value}`;
}

function crc16(s: string) {
  let crc = 0xffff;
  for (let i = 0; i < s.length; i++) {
    crc ^= s.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
    crc &= 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function buildVietQR({ bin, accountNo, amount, description }: { bin: string; accountNo: string; amount?: number; description?: string }) {
  const merchant = tlv("00", "A000000727") + tlv("01", tlv("00", bin) + tlv("01", accountNo)) + tlv("02", "QRIBFTTA");
  const addl = description ? tlv("62", tlv("08", description.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").slice(0, 50))) : "";
  const body =
    tlv("00", "01") +
    tlv("01", amount ? "12" : "11") +
    tlv("38", merchant) +
    tlv("53", "704") +
    (amount ? tlv("54", String(Math.round(amount))) : "") +
    tlv("58", "VN") +
    addl +
    "6304";
  return body + crc16(body);
}
