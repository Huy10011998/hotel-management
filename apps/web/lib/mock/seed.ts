/**
 * Sinh dữ liệu mẫu có seed cố định (cùng kết quả trên server và client).
 * Ngày được tính tương đối theo hôm nay để demo luôn "sống".
 */
import type {
  BookingSource,
  Company,
  Folio,
  FolioCharge,
  FolioPayment,
  Guest,
  Hotel,
  Invoice,
  MaintenanceTicket,
  RatePlan,
  RateRule,
  Reservation,
  ReservationStatus,
  RolePermissions,
  Room,
  RoomType,
  Service,
  Staff,
  AuditLog,
} from "@hotel/shared";
import { dayjs, toDateOnly } from "@/lib/utils";

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface SeedData {
  hotel: Hotel;
  roomTypes: RoomType[];
  rooms: Room[];
  companies: Company[];
  guests: Guest[];
  reservations: Reservation[];
  folios: Folio[];
  invoices: Invoice[];
  services: Service[];
  ratePlans: RatePlan[];
  rateRules: RateRule[];
  staff: Staff[];
  rolePermissions: RolePermissions;
  tickets: MaintenanceTicket[];
  auditLogs: AuditLog[];
}

const HO = [
  "Nguyễn",
  "Trần",
  "Lê",
  "Phạm",
  "Hoàng",
  "Huỳnh",
  "Phan",
  "Vũ",
  "Võ",
  "Đặng",
  "Bùi",
  "Đỗ",
  "Hồ",
  "Ngô",
  "Dương",
  "Lý",
];
const DEM = [
  "Văn",
  "Thị",
  "Minh",
  "Thanh",
  "Ngọc",
  "Hoàng",
  "Quốc",
  "Gia",
  "Bảo",
  "Thu",
  "Hữu",
  "Anh",
  "Đức",
  "Khánh",
];
const TEN = [
  "An",
  "Bình",
  "Châu",
  "Dũng",
  "Giang",
  "Hà",
  "Hải",
  "Hiếu",
  "Hoa",
  "Huy",
  "Khoa",
  "Lan",
  "Linh",
  "Long",
  "Mai",
  "Nam",
  "Nhung",
  "Phúc",
  "Quân",
  "Sơn",
  "Tâm",
  "Thảo",
  "Trang",
  "Tuấn",
  "Vy",
  "Yến",
];
const FOREIGN = [
  ["John Smith", "Hoa Kỳ"],
  ["Emma Wilson", "Anh"],
  ["Kim Min-jun", "Hàn Quốc"],
  ["Tanaka Yuki", "Nhật Bản"],
  ["Lucas Martin", "Pháp"],
  ["Anna Müller", "Đức"],
  ["Wang Lei", "Trung Quốc"],
  ["Olivia Brown", "Úc"],
  ["Somchai Prasert", "Thái Lan"],
  ["Park Ji-woo", "Hàn Quốc"],
] as const;
const CITIES = [
  "Hà Nội",
  "TP. Hồ Chí Minh",
  "Đà Nẵng",
  "Cần Thơ",
  "Hải Phòng",
  "Huế",
  "Nha Trang",
  "Vũng Tàu",
  "Biên Hòa",
  "Quy Nhơn",
];

export function createSeed(): SeedData {
  const rnd = mulberry32(20261007);
  const pick = <T>(arr: readonly T[]) => arr[Math.floor(rnd() * arr.length)];
  const int = (min: number, max: number) =>
    min + Math.floor(rnd() * (max - min + 1));
  const today = dayjs().startOf("day");
  const nowIso = dayjs().toISOString();

  // Địa chỉ đã xác nhận. Các trường "CẦN XÁC NHẬN" chưa tìm thấy nguồn công khai — sửa ở Cài đặt → Thông tin khách sạn.
  const hotel: Hotel = {
    name: "Khách sạn Bạch Đàn",
    legalName: "Khách sạn Bạch Đàn", // CẦN XÁC NHẬN tên đăng ký kinh doanh
    taxCode: "", // CẦN XÁC NHẬN
    address: "14/64 Đặng Văn Bình, Phường Cao Lãnh, Tỉnh Đồng Tháp",
    phone: "033 456 7002", // CẦN XÁC NHẬN (mã vùng Đồng Tháp 0277)
    email: "datphong@example.com", // CẦN XÁC NHẬN
    website: "example.com", // CẦN XÁC NHẬN
    stars: 0, // chưa xếp hạng sao — 0 thì giao diện ẩn sao
    checkInTime: "14:00",
    checkOutTime: "12:00",
    currency: "VND",
    vatPercent: 8,
    serviceFeePercent: 5,
    // CẦN XÁC NHẬN — số tài khoản giả, không để khách chuyển khoản thật vào đây
    bank: {
      bin: "970436",
      bankName: "Vietcombank",
      accountNo: "0000000000",
      accountName: "KHACH SAN BACH DAN",
    },
  };

  // Hạng phòng, diện tích, giá: ước tính theo mặt bằng khách sạn tại Cao Lãnh — CẦN XÁC NHẬN
  const roomTypes: RoomType[] = [
    {
      id: "rt-std",
      code: "STD",
      name: "Standard",
      maxAdults: 2,
      maxChildren: 1,
      bedType: "1 giường đôi 1m6",
      areaM2: 18,
      baseRate: 350_000,
      extraAdultFee: 100_000,
      amenities: ["Wi-Fi", "Điều hòa", "TV", "Tủ lạnh mini", "Nước nóng"],
      description: "Phòng tiêu chuẩn, yên tĩnh.",
    },
    {
      id: "rt-sup",
      code: "SUP",
      name: "Superior",
      maxAdults: 2,
      maxChildren: 1,
      bedType: "2 giường đơn / 1 giường đôi",
      areaM2: 22,
      baseRate: 450_000,
      extraAdultFee: 100_000,
      amenities: [
        "Wi-Fi",
        "Điều hòa",
        "Smart TV",
        "Tủ lạnh mini",
        "Nước nóng",
        "Cửa sổ",
      ],
      description: "Rộng hơn, có cửa sổ.",
    },
    {
      id: "rt-dlx",
      code: "DLX",
      name: "Deluxe",
      maxAdults: 2,
      maxChildren: 2,
      bedType: "1 giường đôi lớn 1m8",
      areaM2: 26,
      baseRate: 600_000,
      extraAdultFee: 150_000,
      amenities: [
        "Wi-Fi",
        "Điều hòa",
        "Smart TV",
        "Tủ lạnh mini",
        "Nước nóng",
        "Cửa sổ lớn",
        "Bàn làm việc",
      ],
      description: "Giường lớn, cửa sổ lớn.",
    },
    {
      id: "rt-fam",
      code: "FAM",
      name: "Family",
      maxAdults: 4,
      maxChildren: 2,
      bedType: "2 giường đôi",
      areaM2: 32,
      baseRate: 750_000,
      extraAdultFee: 150_000,
      amenities: [
        "Wi-Fi",
        "Điều hòa",
        "Smart TV",
        "Tủ lạnh mini",
        "Nước nóng",
        "Sofa",
      ],
      description: "Phù hợp gia đình 4 người.",
    },
    {
      id: "rt-ste",
      code: "STE",
      name: "VIP",
      maxAdults: 3,
      maxChildren: 2,
      bedType: "1 giường đôi lớn + sofa",
      areaM2: 38,
      baseRate: 1_000_000,
      extraAdultFee: 200_000,
      amenities: [
        "Wi-Fi",
        "Điều hòa",
        "Smart TV",
        "Tủ lạnh mini",
        "Nước nóng",
        "Bồn tắm",
        "Bàn làm việc",
        "Góc tiếp khách",
      ],
      description: "Phòng rộng nhất, có góc tiếp khách.",
    },
  ];

  // 4 tầng × 6 phòng — CẦN XÁC NHẬN số phòng thực tế
  const floorPlan: Record<number, string[]> = {
    1: ["rt-std", "rt-std", "rt-std", "rt-sup", "rt-sup", "rt-std"],
    2: ["rt-std", "rt-sup", "rt-sup", "rt-dlx", "rt-dlx", "rt-fam"],
    3: ["rt-sup", "rt-dlx", "rt-dlx", "rt-dlx", "rt-fam", "rt-fam"],
    4: ["rt-dlx", "rt-dlx", "rt-ste", "rt-ste", "rt-fam", "rt-sup"],
  };
  const rooms: Room[] = [];
  for (const [floorStr, types] of Object.entries(floorPlan)) {
    const floor = Number(floorStr);
    types.forEach((rt, i) => {
      const number = `${floor}${String(i + 1).padStart(2, "0")}`;
      rooms.push({
        id: `room-${number}`,
        number,
        floor,
        roomTypeId: rt,
        hkStatus: "clean",
        outOfOrder: false,
      });
    });
  }

  const staff: Staff[] = [
    {
      id: "st-1",
      fullName: "Trần Quốc Huy",
      role: "admin",
      phone: "0901234567",
      email: "huy.tq@example.com",
      active: true,
      twoFactor: true,
    },
    {
      id: "st-2",
      fullName: "Lê Thị Mai",
      role: "manager",
      phone: "0902345678",
      email: "mai.lt@example.com",
      active: true,
      twoFactor: true,
    },
    {
      id: "st-3",
      fullName: "Phạm Ngọc Linh",
      role: "receptionist",
      phone: "0903456789",
      email: "linh.pn@example.com",
      active: true,
      twoFactor: false,
    },
    {
      id: "st-4",
      fullName: "Võ Minh Tuấn",
      role: "receptionist",
      phone: "0904567890",
      email: "tuan.vm@example.com",
      active: true,
      twoFactor: false,
    },
    {
      id: "st-5",
      fullName: "Đặng Thu Hà",
      role: "accountant",
      phone: "0905678901",
      email: "ha.dt@example.com",
      active: true,
      twoFactor: true,
    },
    {
      id: "st-6",
      fullName: "Nguyễn Thị Hoa",
      role: "housekeeper",
      phone: "0906789012",
      email: "hoa.nt@example.com",
      active: true,
      twoFactor: false,
    },
    {
      id: "st-7",
      fullName: "Bùi Văn Sơn",
      role: "housekeeper",
      phone: "0907890123",
      email: "son.bv@example.com",
      active: true,
      twoFactor: false,
    },
    {
      id: "st-8",
      fullName: "Huỳnh Thị Yến",
      role: "housekeeper",
      phone: "0908901234",
      email: "yen.ht@example.com",
      active: true,
      twoFactor: false,
    },
    {
      id: "st-9",
      fullName: "Hồ Đức Long",
      role: "housekeeper",
      phone: "0909012345",
      email: "long.hd@example.com",
      active: false,
      twoFactor: false,
    },
  ];
  const housekeepers = staff.filter(
    (s) => s.role === "housekeeper" && s.active,
  );

  const rolePermissions: RolePermissions = {
    admin: [
      "dashboard.view",
      "reservation.manage",
      "frontdesk.checkin",
      "guest.manage",
      "room.manage",
      "rate.manage",
      "billing.manage",
      "billing.discount",
      "housekeeping.manage",
      "maintenance.manage",
      "report.view",
      "staff.manage",
      "settings.manage",
    ],
    manager: [
      "dashboard.view",
      "reservation.manage",
      "frontdesk.checkin",
      "guest.manage",
      "room.manage",
      "rate.manage",
      "billing.manage",
      "billing.discount",
      "housekeeping.manage",
      "maintenance.manage",
      "report.view",
    ],
    receptionist: [
      "dashboard.view",
      "reservation.manage",
      "frontdesk.checkin",
      "guest.manage",
      "billing.manage",
      "maintenance.manage",
    ],
    housekeeper: ["housekeeping.manage", "maintenance.manage"],
    accountant: ["dashboard.view", "billing.manage", "report.view"],
  };

  const companies: Company[] = [
    {
      id: "co-1",
      name: "Công ty CP Thực phẩm Cholimex",
      taxCode: "0300627384",
      address: "Lô C40-43, KCN Vĩnh Lộc, TP.HCM",
      contact: "Phòng Hành chính",
    },
    {
      id: "co-2",
      name: "Công ty TNHH Du lịch Saigontourist",
      taxCode: "0300625210",
      address: "45 Lê Thánh Tôn, TP.HCM",
      contact: "Bộ phận đặt phòng",
    },
    {
      id: "co-3",
      name: "Công ty CP Công nghệ FPT",
      taxCode: "0101248141",
      address: "Tòa FPT, Cầu Giấy, Hà Nội",
      contact: "Phòng Nhân sự",
    },
  ];

  const guests: Guest[] = [];
  for (let i = 0; i < 140; i++) {
    const foreign = rnd() < 0.18;
    let fullName: string;
    let nationality = "Việt Nam";
    if (foreign) {
      const [n, nat] = pick(FOREIGN);
      fullName = n;
      nationality = nat;
    } else {
      const dem = pick(DEM);
      fullName = `${pick(HO)} ${dem} ${pick(TEN)}`;
    }
    const gender: Guest["gender"] =
      fullName.includes(" Thị ") || rnd() < 0.4 ? "female" : "male";
    guests.push({
      id: `g-${i + 1}`,
      fullName,
      gender,
      dob: toDateOnly(
        today.subtract(int(20, 65), "year").subtract(int(0, 364), "day"),
      ),
      phone: foreign
        ? `+84${int(900000000, 999999999)}`
        : `09${int(10000000, 99999999)}`,
      email:
        rnd() < 0.7
          ? `${fullName.split(" ").pop()!.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d")}${i}@gmail.com`
          : undefined,
      idType: foreign ? "passport" : "cccd",
      idNumber: foreign
        ? `P${int(1000000, 9999999)}`
        : `0${int(10, 99)}${int(100000000, 999999999)}`,
      nationality,
      address: foreign ? undefined : pick(CITIES),
      companyId: rnd() < 0.12 ? pick(companies).id : undefined,
      vip: rnd() < 0.08,
      blacklisted: i === 57,
      tags:
        rnd() < 0.2
          ? [
              pick([
                "Tầng cao",
                "Không hút thuốc",
                "Gối mềm",
                "Ăn chay",
                "Khách quen",
                "Phòng yên tĩnh",
              ]),
            ]
          : [],
      notes:
        i === 57
          ? "Từng gây thiệt hại tài sản phòng 305 — từ chối nhận phòng."
          : undefined,
      createdAt: today.subtract(int(30, 900), "day").toISOString(),
    });
  }

  const services: Service[] = [
    {
      id: "sv-1",
      name: "Nước suối",
      category: "minibar",
      price: 10_000,
      unit: "chai",
      active: true,
    },
    {
      id: "sv-2",
      name: "Coca-Cola",
      category: "minibar",
      price: 15_000,
      unit: "lon",
      active: true,
    },
    {
      id: "sv-3",
      name: "Bia Sài Gòn",
      category: "minibar",
      price: 20_000,
      unit: "lon",
      active: true,
    },
    {
      id: "sv-4",
      name: "Snack khoai tây",
      category: "minibar",
      price: 15_000,
      unit: "gói",
      active: true,
    },
    {
      id: "sv-5",
      name: "Giặt ủi áo sơ mi",
      category: "laundry",
      price: 20_000,
      unit: "cái",
      active: true,
    },
    {
      id: "sv-6",
      name: "Giặt ủi quần",
      category: "laundry",
      price: 25_000,
      unit: "cái",
      active: true,
    },
    {
      id: "sv-7",
      name: "Giặt khô vest",
      category: "laundry",
      price: 80_000,
      unit: "bộ",
      active: true,
    },
    {
      id: "sv-8",
      name: "Ăn sáng (khách ngoài gói)",
      category: "restaurant",
      price: 50_000,
      unit: "suất",
      active: true,
    },
    {
      id: "sv-9",
      name: "Hủ tiếu / phở tại phòng",
      category: "restaurant",
      price: 45_000,
      unit: "tô",
      active: true,
    },
    {
      id: "sv-10",
      name: "Đưa đón sân bay Cần Thơ",
      category: "transport",
      price: 700_000,
      unit: "lượt",
      active: true,
    },
    {
      id: "sv-11",
      name: "Thuê xe máy",
      category: "transport",
      price: 120_000,
      unit: "ngày",
      active: true,
    },
    {
      id: "sv-12",
      name: "Đưa đón bến xe Cao Lãnh",
      category: "transport",
      price: 50_000,
      unit: "lượt",
      active: true,
    },
    {
      id: "sv-13",
      name: "Phụ thu nhận phòng sớm",
      category: "surcharge",
      price: 100_000,
      unit: "lần",
      active: true,
    },
    {
      id: "sv-14",
      name: "Phụ thu trả phòng muộn",
      category: "surcharge",
      price: 100_000,
      unit: "lần",
      active: true,
    },
    {
      id: "sv-15",
      name: "Giường phụ",
      category: "surcharge",
      price: 150_000,
      unit: "đêm",
      active: true,
    },
  ];

  const ratePlans: RatePlan[] = [
    {
      id: "rp-bar",
      code: "BAR",
      name: "Giá tiêu chuẩn (BAR)",
      mealPlan: "breakfast",
      adjustPercent: 0,
      refundable: true,
      active: true,
    },
    {
      id: "rp-ro",
      code: "RO",
      name: "Chỉ phòng",
      mealPlan: "room_only",
      adjustPercent: -10,
      refundable: true,
      active: true,
    },
    {
      id: "rp-nr",
      code: "NRF",
      name: "Không hoàn hủy",
      mealPlan: "breakfast",
      adjustPercent: -15,
      refundable: false,
      active: true,
    },
    {
      id: "rp-corp",
      code: "CORP",
      name: "Giá công ty",
      mealPlan: "breakfast",
      adjustPercent: -20,
      refundable: true,
      active: true,
    },
    {
      id: "rp-hb",
      code: "HB",
      name: "Gói ăn sáng + tối",
      mealPlan: "half_board",
      adjustPercent: 25,
      refundable: true,
      active: true,
    },
  ];

  const rateRules: RateRule[] = [
    {
      id: "rr-1",
      name: "Cuối tuần (T6, T7)",
      weekdays: [5, 6],
      adjustPercent: 15,
      roomTypeIds: [],
      active: true,
    },
    {
      id: "rr-2",
      name: "Lễ 20/11",
      from: `${today.year()}-11-19`,
      to: `${today.year()}-11-21`,
      weekdays: [],
      adjustPercent: 10,
      roomTypeIds: [],
      active: true,
    },
    {
      id: "rr-3",
      name: "Mùa cao điểm Tết",
      from: `${today.year() + 1}-01-25`,
      to: `${today.year() + 1}-02-08`,
      weekdays: [],
      adjustPercent: 40,
      roomTypeIds: [],
      active: true,
    },
    {
      id: "rr-4",
      name: "Khuyến mãi mùa thấp điểm",
      from: toDateOnly(today.add(10, "day")),
      to: toDateOnly(today.add(24, "day")),
      weekdays: [0, 1, 2, 3],
      adjustPercent: -12,
      roomTypeIds: ["rt-dlx", "rt-ste"],
      active: true,
    },
  ];

  const sourceWeights: [BookingSource, number][] = [
    ["booking_com", 28],
    ["agoda", 22],
    ["walk_in", 10],
    ["phone", 10],
    ["website", 12],
    ["traveloka", 7],
    ["expedia", 5],
    ["corporate", 6],
  ];
  const totalW = sourceWeights.reduce((s, [, w]) => s + w, 0);
  const pickSource = (): BookingSource => {
    let r = rnd() * totalW;
    for (const [s, w] of sourceWeights) {
      if ((r -= w) <= 0) return s;
    }
    return "walk_in";
  };

  const reservations: Reservation[] = [];
  const folios: Folio[] = [];
  const invoices: Invoice[] = [];
  let seq = 1;
  let invSeq = 1;
  const receptionists = ["Phạm Ngọc Linh", "Võ Minh Tuấn"];

  const ooo = new Set(["room-207", "room-406"]);

  for (const room of rooms) {
    const rt = roomTypes.find((t) => t.id === room.roomTypeId)!;
    let cursor = today.subtract(int(40, 46), "day");
    const end = today.add(32, "day");
    while (cursor.isBefore(end)) {
      cursor = cursor.add(int(0, 4), "day");
      const nights = int(1, 5);
      const ci = cursor;
      const co = cursor.add(nights, "day");
      cursor = co;
      // Phòng bảo trì: không có booking chạm hôm nay
      if (
        ooo.has(room.id) &&
        !ci.isAfter(today.add(2, "day")) &&
        co.isAfter(today.subtract(1, "day"))
      )
        continue;

      const source = pickSource();
      const guest = pick(guests.filter((g) => !g.blacklisted));
      const ratePlan =
        source === "corporate"
          ? ratePlans[3]
          : rnd() < 0.15
            ? ratePlans[2]
            : rnd() < 0.15
              ? ratePlans[1]
              : ratePlans[0];
      const rate =
        Math.round(
          (rt.baseRate * (1 + ratePlan.adjustPercent / 100)) / 10_000,
        ) * 10_000;

      let status: ReservationStatus;
      if (!co.isAfter(today)) {
        // Đã kết thúc; ngày trả phòng = hôm nay thì một phần vẫn chưa check-out
        status =
          co.isSame(today) && rnd() < 0.55
            ? "checked_in"
            : rnd() < 0.05
              ? "cancelled"
              : "checked_out";
        if (status === "checked_out" && rnd() < 0.03) status = "no_show";
      } else if (!ci.isAfter(today)) {
        status = ci.isSame(today) && rnd() < 0.6 ? "confirmed" : "checked_in";
      } else {
        status =
          rnd() < 0.12 ? "tentative" : rnd() < 0.04 ? "cancelled" : "confirmed";
      }

      const id = `rs-${seq}`;
      const code = `BK${today.format("YY")}${String(seq).padStart(5, "0")}`;
      seq++;
      const createdAt = ci
        .subtract(int(1, 40), "day")
        .hour(int(8, 21))
        .minute(int(0, 59));
      const by = pick(receptionists);
      const history = [
        {
          at: createdAt.toISOString(),
          by:
            source.endsWith("_com") ||
            ["agoda", "traveloka", "expedia"].includes(source)
              ? "Channel Manager"
              : by,
          action: "Tạo đặt phòng",
        },
      ];
      if (status !== "tentative")
        history.push({
          at: createdAt.add(10, "minute").toISOString(),
          by,
          action: "Xác nhận đặt phòng",
        });
      if (status === "checked_in" || status === "checked_out")
        history.push({
          at: ci.hour(14).minute(int(0, 59)).toISOString(),
          by,
          action: `Check-in vào phòng ${room.number}`,
        });
      if (status === "checked_out")
        history.push({
          at: co.hour(int(9, 12)).minute(int(0, 59)).toISOString(),
          by,
          action: "Check-out",
        });
      if (status === "cancelled")
        history.push({
          at: createdAt.add(int(1, 5), "day").toISOString(),
          by,
          action: "Hủy đặt phòng",
        });

      const deposit =
        ["booking_com", "expedia"].includes(source) || status === "tentative"
          ? 0
          : rnd() < 0.6
            ? Math.round((rate * Math.min(nights, 2) * 0.5) / 100_000) * 100_000
            : 0;
      const isOtaPrepaid =
        source === "agoda" || source === "traveloka" || source === "expedia";
      const unassigned =
        status === "confirmed" &&
        ci.isAfter(today.add(3, "day")) &&
        rnd() < 0.25;

      reservations.push({
        id,
        code,
        guestId: guest.id,
        roomTypeId: rt.id,
        roomId: unassigned ? null : room.id,
        checkIn: toDateOnly(ci),
        checkOut: toDateOnly(co),
        adults: Math.min(rt.maxAdults, int(1, 3)),
        children: rnd() < 0.2 ? 1 : 0,
        source,
        status,
        ratePlanId: ratePlan.id,
        ratePerNight: rate,
        deposit,
        note:
          rnd() < 0.1
            ? pick([
                "Khách đến muộn sau 22h",
                "Cần nôi em bé",
                "Kỷ niệm ngày cưới — trang trí phòng",
                "Yêu cầu phòng tầng cao",
                "Xuất hóa đơn công ty",
              ])
            : undefined,
        createdAt: createdAt.toISOString(),
        history,
      });

      if (
        status === "checked_in" ||
        status === "checked_out" ||
        status === "confirmed" ||
        status === "tentative"
      ) {
        const charges: FolioCharge[] = [];
        const payments: FolioPayment[] = [];
        if (status === "checked_in" || status === "checked_out") {
          // Tiền phòng các đêm đã qua night audit
          const lastNight =
            status === "checked_out" ? co : dayjs.min(co, today);
          for (let d = ci; d.isBefore(lastNight); d = d.add(1, "day")) {
            charges.push({
              id: `${id}-c${charges.length}`,
              date: toDateOnly(d),
              category: "room",
              description: `Tiền phòng ${room.number} — ${rt.name}`,
              qty: 1,
              unitPrice: rate,
              amount: rate,
            });
          }
          const nExtra = int(0, 4);
          for (let k = 0; k < nExtra; k++) {
            const sv = pick(services.filter((s) => s.category !== "surcharge"));
            const qty =
              sv.category === "minibar" || sv.category === "laundry"
                ? int(1, 3)
                : 1;
            const span = Math.max(
              1,
              dayjs.min(co, today.add(1, "day")).diff(ci, "day"),
            );
            charges.push({
              id: `${id}-c${charges.length}`,
              date: toDateOnly(ci.add(int(0, span - 1), "day")),
              category: sv.category,
              description: sv.name,
              qty,
              unitPrice: sv.price,
              amount: sv.price * qty,
              serviceId: sv.id,
            });
          }
        }
        if (deposit > 0)
          payments.push({
            id: `${id}-p0`,
            at: createdAt.add(15, "minute").toISOString(),
            method: pick(["bank_transfer", "card", "cash"] as const),
            amount: deposit,
            note: "Đặt cọc",
            by,
          });
        if (isOtaPrepaid && status !== "tentative") {
          payments.push({
            id: `${id}-p1`,
            at: createdAt.toISOString(),
            method: "ota_prepaid",
            amount: rate * nights,
            note: `Thanh toán qua ${source}`,
            by: "Channel Manager",
          });
        }
        const total = charges.reduce((s, c) => s + c.amount, 0);
        if (status === "checked_out") {
          const fee = Math.round(total * (hotel.serviceFeePercent / 100));
          const vat = Math.round((total + fee) * (hotel.vatPercent / 100));
          const grand = total + fee + vat;
          const paid = payments.reduce((s, p) => s + p.amount, 0);
          if (grand - paid > 0)
            payments.push({
              id: `${id}-p2`,
              at: co.hour(11).toISOString(),
              method: pick(["cash", "bank_transfer", "card"] as const),
              amount: grand - paid,
              note: "Thanh toán khi trả phòng",
              by,
            });
          invoices.push({
            id: `inv-${invSeq}`,
            number: `HD${co.format("YYMM")}${String(invSeq).padStart(4, "0")}`,
            reservationId: id,
            issuedAt: co.hour(11).minute(int(0, 59)).toISOString(),
            buyerName: guest.companyId
              ? companies.find((c) => c.id === guest.companyId)!.name
              : guest.fullName,
            buyerTaxCode: guest.companyId
              ? companies.find((c) => c.id === guest.companyId)!.taxCode
              : undefined,
            subtotal: total,
            serviceFee: fee,
            vat,
            total: grand,
          });
          invSeq++;
        }
        folios.push({
          id: `fo-${id}`,
          reservationId: id,
          charges,
          payments,
          status: status === "checked_out" ? "closed" : "open",
        });
      }
    }
  }

  // Trạng thái buồng phòng
  for (const room of rooms) {
    const inHouse = reservations.find(
      (r) => r.roomId === room.id && r.status === "checked_in",
    );
    const departedToday = reservations.find(
      (r) =>
        r.roomId === room.id &&
        r.status === "checked_out" &&
        r.checkOut === toDateOnly(today),
    );
    if (ooo.has(room.id)) {
      room.outOfOrder = true;
      room.hkStatus = "dirty";
    } else if (departedToday) {
      room.hkStatus = rnd() < 0.5 ? "dirty" : "cleaning";
    } else if (inHouse) {
      room.hkStatus = rnd() < 0.55 ? "dirty" : "clean";
    } else {
      room.hkStatus =
        rnd() < 0.15 ? "dirty" : rnd() < 0.3 ? "inspected" : "clean";
    }
    if (room.hkStatus !== "inspected" && room.hkStatus !== "clean")
      room.hkAssigneeId = pick(housekeepers).id;
  }

  const tickets: MaintenanceTicket[] = [
    {
      id: "tk-1",
      code: "MT-0041",
      roomId: "room-207",
      title: "Điều hòa không lạnh, chảy nước",
      description:
        "Khách phản ánh điều hòa chảy nước xuống tường. Cần thay ống thoát và nạp gas.",
      priority: "high",
      status: "in_progress",
      blocksRoom: true,
      reportedBy: "Nguyễn Thị Hoa",
      assigneeId: undefined,
      createdAt: today.subtract(1, "day").hour(9).toISOString(),
    },
    {
      id: "tk-2",
      code: "MT-0042",
      roomId: "room-406",
      title: "Thấm trần nhà tắm",
      description: "Thấm nước từ tầng trên, cần kiểm tra đường ống tầng trên.",
      priority: "urgent",
      status: "open",
      blocksRoom: true,
      reportedBy: "Bùi Văn Sơn",
      createdAt: today.hour(7).minute(40).toISOString(),
    },
    {
      id: "tk-3",
      code: "MT-0043",
      roomId: "room-305",
      title: "Bóng đèn đầu giường hỏng",
      description: "",
      priority: "low",
      status: "open",
      blocksRoom: false,
      reportedBy: "Huỳnh Thị Yến",
      createdAt: today.hour(8).minute(15).toISOString(),
    },
    {
      id: "tk-4",
      code: "MT-0039",
      roomId: "room-105",
      title: "Khóa từ không nhận thẻ",
      description: "Đã thay pin khóa.",
      priority: "medium",
      status: "done",
      blocksRoom: false,
      reportedBy: "Phạm Ngọc Linh",
      createdAt: today.subtract(3, "day").toISOString(),
      resolvedAt: today.subtract(3, "day").add(2, "hour").toISOString(),
    },
    {
      id: "tk-5",
      code: "MT-0040",
      roomId: "room-402",
      title: "TV mất tín hiệu",
      description: "Cáp HDMI lỏng, đã cắm lại.",
      priority: "medium",
      status: "done",
      blocksRoom: false,
      reportedBy: "Võ Minh Tuấn",
      createdAt: today.subtract(2, "day").toISOString(),
      resolvedAt: today.subtract(2, "day").add(1, "hour").toISOString(),
    },
  ].filter((t) => rooms.some((r) => r.id === t.roomId)) as MaintenanceTicket[];

  const auditLogs: AuditLog[] = [
    {
      id: "al-1",
      at: today.hour(8).minute(2).toISOString(),
      by: "Phạm Ngọc Linh",
      action: "Đăng nhập",
      target: "Hệ thống",
    },
    {
      id: "al-2",
      at: today.hour(8).minute(30).toISOString(),
      by: "Lê Thị Mai",
      action: "Sửa giá Deluxe 550.000 → 600.000",
      target: "Loại phòng DLX",
    },
    {
      id: "al-3",
      at: today.hour(9).minute(12).toISOString(),
      by: "Võ Minh Tuấn",
      action: "Giảm giá 10% folio",
      target: reservations[3]?.code ?? "",
    },
    {
      id: "al-4",
      at: nowIso,
      by: "Trần Quốc Huy",
      action: "Mở ứng dụng",
      target: "Hệ thống",
    },
  ];

  return {
    hotel,
    roomTypes,
    rooms,
    companies,
    guests,
    reservations,
    folios,
    invoices,
    services,
    ratePlans,
    rateRules,
    staff,
    rolePermissions,
    tickets,
    auditLogs,
  };
}
