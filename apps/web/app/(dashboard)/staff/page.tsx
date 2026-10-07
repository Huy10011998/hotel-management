"use client";

import * as React from "react";
import { toast } from "sonner";
import { Pencil, Plus, ShieldCheck } from "lucide-react";
import { PERMISSIONS, PERMISSION_LABEL, STAFF_ROLES, STAFF_ROLE_LABEL, type Staff, type StaffRole } from "@hotel/shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox, Field, Input, Select, Switch } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/hotel/page-header";
import { DataTable, type Column } from "@/components/hotel/data-table";
import { AuditLogTable } from "@/components/hotel/audit-log-table";
import { useStore } from "@/lib/store";
import { initials, uid } from "@/lib/utils";

export default function StaffPage() {
  const { staff, rolePermissions, togglePermission, upsertStaff } = useStore();
  const [editing, setEditing] = React.useState<Staff | null>(null);

  const columns: Column<Staff>[] = [
    {
      key: "name",
      header: "Nhân viên",
      cell: (s) => (
        <span className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-full bg-primary/12 text-xs font-semibold text-primary">{initials(s.fullName)}</span>
          <span><span className="block font-medium">{s.fullName}</span><span className="text-xs text-muted-foreground">{s.email}</span></span>
        </span>
      ),
      sortValue: (s) => s.fullName,
    },
    { key: "role", header: "Vai trò", cell: (s) => <Badge variant={s.role === "admin" ? "danger" : s.role === "manager" ? "warning" : "secondary"}>{STAFF_ROLE_LABEL[s.role]}</Badge>, sortValue: (s) => STAFF_ROLE_LABEL[s.role] },
    { key: "phone", header: "Điện thoại", cell: (s) => <span className="tabular">{s.phone}</span>, sortValue: (s) => s.phone },
    { key: "2fa", header: "Xác thực 2 lớp", cell: (s) => (s.twoFactor ? <Badge variant="success"><ShieldCheck className="size-3" /> Bật</Badge> : <Badge variant="muted">Tắt</Badge>), csv: (s) => (s.twoFactor ? "Bật" : "Tắt") },
    { key: "active", header: "Hoạt động", cell: (s) => <span onClick={(e) => e.stopPropagation()}><Switch checked={s.active} onCheckedChange={(v) => upsertStaff({ ...s, active: v })} label={`Kích hoạt ${s.fullName}`} /></span>, csv: (s) => (s.active ? "Có" : "Không") },
    { key: "act", header: "", cell: (s) => <Button variant="ghost" size="icon-sm" onClick={(e) => { e.stopPropagation(); setEditing(s); }} aria-label="Sửa"><Pencil /></Button> },
  ];

  return (
    <>
      <PageHeader title="Nhân viên & phân quyền" description="Tài khoản, vai trò và quyền truy cập theo chức năng (RBAC)" actions={<Button onClick={() => setEditing({ id: "", fullName: "", role: "receptionist", phone: "", email: "", active: true, twoFactor: false })}><Plus /> Thêm nhân viên</Button>} />
      <Tabs defaultValue="staff">
        <TabsList>
          <TabsTrigger value="staff">Nhân viên</TabsTrigger>
          <TabsTrigger value="roles">Ma trận phân quyền</TabsTrigger>
          <TabsTrigger value="log">Nhật ký hoạt động</TabsTrigger>
        </TabsList>
        <TabsContent value="staff">
          <DataTable data={staff} columns={columns} rowKey={(s) => s.id} searchText={(s) => `${s.fullName} ${s.email} ${s.phone}`} exportName="nhan-vien" onRowClick={setEditing} />
        </TabsContent>
        <TabsContent value="roles">
          <Card>
            <CardHeader><div><CardTitle>Quyền theo vai trò</CardTitle><CardDescription>Thay đổi áp dụng cho mọi nhân viên thuộc vai trò. Vai trò Quản trị luôn có toàn quyền.</CardDescription></div></CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">Chức năng</th>
                      {STAFF_ROLES.map((r) => <th key={r} className="px-3 py-2 text-center text-xs font-medium uppercase text-muted-foreground">{STAFF_ROLE_LABEL[r]}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {PERMISSIONS.map((p) => (
                      <tr key={p} className="border-t hover:bg-muted/30">
                        <td className="px-3 py-2">{PERMISSION_LABEL[p]}<span className="ml-2 font-mono text-[10px] text-muted-foreground">{p}</span></td>
                        {STAFF_ROLES.map((r) => (
                          <td key={r} className="px-3 py-2 text-center">
                            <Checkbox checked={rolePermissions[r].includes(p)} disabled={r === "admin"} onChange={() => togglePermission(r, p)} aria-label={`${STAFF_ROLE_LABEL[r]} – ${PERMISSION_LABEL[p]}`} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="log"><AuditLogTable /></TabsContent>
      </Tabs>
      {editing && (
        <Dialog open onOpenChange={(o) => !o && setEditing(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing.id ? "Sửa nhân viên" : "Thêm nhân viên"}</DialogTitle></DialogHeader>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Họ tên" className="sm:col-span-2"><Input value={editing.fullName} onChange={(e) => setEditing({ ...editing, fullName: e.target.value })} /></Field>
              <Field label="Email"><Input type="email" value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} /></Field>
              <Field label="Điện thoại"><Input value={editing.phone} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} /></Field>
              <Field label="Vai trò"><Select value={editing.role} onChange={(e) => setEditing({ ...editing, role: e.target.value as StaffRole })}>{STAFF_ROLES.map((r) => <option key={r} value={r}>{STAFF_ROLE_LABEL[r]}</option>)}</Select></Field>
              <label className="flex items-center gap-2 self-end pb-2 text-sm"><Checkbox checked={editing.twoFactor} onChange={(e) => setEditing({ ...editing, twoFactor: e.target.checked })} /> Bắt buộc xác thực 2 lớp</label>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditing(null)}>Hủy</Button>
              <Button onClick={() => { if (!editing.fullName || !editing.email) return toast.error("Nhập họ tên và email"); upsertStaff({ ...editing, id: editing.id || uid("st-") }); toast.success("Đã lưu nhân viên"); setEditing(null); }}>Lưu</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
