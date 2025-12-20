"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Tag, Phone, Mail } from "lucide-react";

import { api } from "~/trpc/react";
import { useLanguage } from "~/lib/language-context";
import allTranslations from "~/lib/translations/all";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerCloseButton,
} from "~/components/ui/drawer";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
// Input removed as we use a native select for enum editing

type TagDraftState = Record<number, string | null>;
type EditingState = Record<number, boolean>;

export function AdminUsersPanel() {
  const { language } = useLanguage();
  const strings = useMemo(() => allTranslations.admin[language], [language]);
  const { data, isLoading, error } = api.admin.customersList.useQuery();
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(
    null,
  );
  const { data: customerDetails, isLoading: detailsLoading } =
    api.admin.customerDetails.useQuery(
      { customerId: selectedCustomerId ?? 0 },
      { enabled: selectedCustomerId !== null },
    );

  const ctx = api.useContext();
  const updateTagMutation = api.admin.updateCustomerTag.useMutation({
    onSuccess: async () => {
      await ctx.admin.customersList.invalidate();
    },
  });

  const [drafts, setDrafts] = useState<TagDraftState>({});
  const [editing, setEditing] = useState<EditingState>({});

  useEffect(() => {
    if (!data) return;
    setDrafts((current) => {
      const next = { ...current } satisfies TagDraftState;
      for (const member of data) {
        next[member.id] ??= member.tag ?? null;
      }
      return next;
    });
  }, [data]);

  const enrichedMembers = useMemo(() => {
    if (!data) return [];
    return data.map((member) => ({
      ...member,
      tag: member.tag ?? null,
    }));
  }, [data]);

  const handleStartEditing = (id: number) => {
    setEditing((cur) => ({ ...cur, [id]: true }));
    // initialize draft from existing data
    setDrafts((cur) => ({
      ...cur,
      [id]: cur[id] ?? enrichedMembers.find((m) => m.id === id)?.tag ?? null,
    }));
  };

  const handleSaveTag = async (id: number, valueOverride?: string | null) => {
    const value = valueOverride ?? drafts[id] ?? null;
    const tag =
      value === "" || value === null
        ? undefined
        : (value as unknown as "star" | "regular" | "vip" | "new");
    await updateTagMutation.mutateAsync({ customerId: id, tag });
    setDrafts((cur) => ({ ...cur, [id]: value }));
    setEditing((cur) => ({ ...cur, [id]: false }));
  };

  const handleDownloadCsv = () => {
    if (!enrichedMembers.length) return;
    const header = ["Name", "Phone", "Email", "Tag"];
    const rows = enrichedMembers.map((member) => [
      member.name,
      member.number,
      member.email,
      member.tag ?? "",
    ]);
    const csv = [header, ...rows]
      .map((columns) =>
        columns
          .map((value) => {
            const safeValue = value?.toString() ?? "";
            return safeValue.includes(",") ? `"${safeValue}"` : safeValue;
          })
          .join(","),
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pitch-perfect-customers-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-20">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-xs tracking-wide uppercase">
            {strings.usersTitle}
          </p>
          <h1 className="text-2xl font-semibold">{strings.usersTitle}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            disabled={!enrichedMembers.length}
            onClick={handleDownloadCsv}
          >
            <Download className="mr-1 h-4 w-4" />
            CSV
          </Button>
          <Button size="sm" className="rounded-full">
            Add customer
          </Button>
        </div>
      </header>

      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card
              key={index}
              className="border-border/60 bg-card/60 animate-pulse rounded-3xl px-4 py-6"
            />
          ))}
        </div>
      )}

      {error && (
        <p className="border-destructive/30 bg-destructive/10 text-destructive rounded-2xl border px-3 py-2 text-sm">
          Unable to load customers. Please refresh.
        </p>
      )}

      {!isLoading && !error && (
        <Card className="border-border/60 bg-card/60 rounded-3xl">
          <Table className="border-collapse text-sm">
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Tag</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrichedMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-32 text-center">
                    <p className="text-muted-foreground">No customers found.</p>
                  </TableCell>
                </TableRow>
              ) : (
                enrichedMembers.map((member) => {
                  return (
                    <TableRow
                      key={member.id}
                      className="hover:bg-accent/50 cursor-pointer transition-colors"
                      onClick={() => setSelectedCustomerId(member.id)}
                    >
                      <TableCell>
                        <p className="text-base leading-tight font-semibold">
                          {member.name}
                        </p>
                        <p className="text-muted-foreground text-sm">
                          {member.email}
                        </p>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {member.number}
                      </TableCell>
                      <TableCell>
                        {!editing[member.id] && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartEditing(member.id);
                            }}
                            onTouchStart={(e) => {
                              e.stopPropagation();
                              handleStartEditing(member.id);
                            }}
                            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                              member.tag === "vip"
                                ? "bg-violet-600/10 text-violet-600"
                                : member.tag === "star"
                                  ? "bg-amber-400/10 text-amber-500"
                                  : member.tag === "new"
                                    ? "bg-green-600/10 text-green-600"
                                    : "bg-muted/10 text-muted-foreground"
                            }`}
                          >
                            <Tag className="h-3 w-3" />
                            {member.tag ?? "n/a"}
                          </button>
                        )}
                        {editing[member.id] && (
                          <div className="flex items-center gap-2">
                            <select
                              aria-label={`Customer tag for ${member.name}`}
                              value={drafts[member.id] ?? ""}
                              onChange={(e) =>
                                handleSaveTag(member.id, e.target.value)
                              }
                              onBlur={() =>
                                setEditing((cur) => ({
                                  ...cur,
                                  [member.id]: false,
                                }))
                              }
                              className="border-input rounded-md border px-2 py-1 text-sm"
                            >
                              <option value="">(none)</option>
                              <option value="star">Star</option>
                              <option value="regular">Regular</option>
                              <option value="vip">VIP</option>
                              <option value="new">New</option>
                            </select>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Customer Details Drawer */}
      <Drawer
        open={selectedCustomerId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedCustomerId(null);
        }}
      >
        <DrawerContent className="max-h-[85vh] overflow-auto">
          <DrawerCloseButton />
          {detailsLoading ? (
            <div className="space-y-4 p-6">
              <div className="bg-muted h-6 animate-pulse rounded" />
              <div className="bg-muted h-4 w-2/3 animate-pulse rounded" />
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-muted h-4 animate-pulse rounded" />
                ))}
              </div>
            </div>
          ) : customerDetails ? (
            <div className="p-6 pb-8">
              <DrawerHeader className="px-0 pt-0 pb-4">
                <DrawerTitle className="text-2xl">
                  {customerDetails.name}
                </DrawerTitle>
              </DrawerHeader>

              {/* Customer Info */}
              <div className="mb-6 space-y-4">
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="text-muted-foreground h-4 w-4" />
                  <span>{customerDetails.number}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="text-muted-foreground h-4 w-4" />
                  <span>{customerDetails.email ?? "N/A"}</span>
                </div>
                {customerDetails.alternateContactName && (
                  <div className="text-sm">
                    <p className="text-muted-foreground">Alternate Contact</p>
                    <p className="font-medium">
                      {customerDetails.alternateContactName}
                    </p>
                    <p className="text-muted-foreground">
                      {customerDetails.alternateContactNumber}
                    </p>
                  </div>
                )}
              </div>

              {/* Tag Section */}
              <div className="mb-6 border-b pb-6">
                <p className="text-muted-foreground mb-2 text-xs tracking-wide uppercase">
                  Tag
                </p>
                <div
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                    customerDetails.tag === "vip"
                      ? "bg-violet-600/10 text-violet-600"
                      : customerDetails.tag === "star"
                        ? "bg-amber-400/10 text-amber-500"
                        : customerDetails.tag === "new"
                          ? "bg-green-600/10 text-green-600"
                          : "bg-muted/10 text-muted-foreground"
                  }`}
                >
                  <Tag className="h-3 w-3" />
                  {customerDetails.tag ?? "n/a"}
                </div>
              </div>

              {/* Booking History */}
              <div>
                <p className="text-muted-foreground mb-3 text-xs tracking-wide uppercase">
                  Recent Bookings
                </p>
                {customerDetails.bookings &&
                customerDetails.bookings.length > 0 ? (
                  <div className="space-y-2">
                    {customerDetails.bookings.map((booking) => (
                      <Card
                        key={booking.id}
                        className="bg-muted/30 border-border/50 p-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex min-w-0 flex-1 items-center gap-2">
                            <span className="truncate text-xs font-semibold capitalize">
                              {booking.bookingType}
                            </span>
                            <span
                              className={`rounded px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap ${
                                booking.status === "fullPaid"
                                  ? "bg-green-100 text-green-800"
                                  : booking.status === "advancePaid"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {booking.status}
                            </span>
                          </div>
                          <div className="text-xs font-medium whitespace-nowrap">
                            ₹{(booking.amountPaid / 100).toFixed(0)}/₹
                            {(booking.totalAmount / 100).toFixed(0)}
                          </div>
                        </div>
                        {booking.slot && (
                          <div className="text-muted-foreground mt-1 truncate text-[11px]">
                            {booking.slot.date} • {booking.slot.from} -{" "}
                            {booking.slot.to}
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-xs">
                    No bookings yet
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="p-6 text-center">
              <p className="text-muted-foreground">Unable to load details</p>
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}
