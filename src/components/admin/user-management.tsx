"use client";

import { useState, useEffect } from "react";
import { User, UserPermissions, DEFAULT_PERMISSIONS } from "@/lib/types";
import { Loader2, Shield, ShieldCheck, ShieldOff, ShieldPlus, User as UserIcon, Users } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

interface UserWithId extends Omit<User, '_id'> {
  _id: string;
}

export function UserManagement() {
  const [users, setUsers] = useState<UserWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/users");
      const data = await res.json();

      if (data.success) {
        setUsers(data.data);
      } else {
        setError(data.error || "사용자 목록을 불러오는데 실패했습니다.");
      }
    } catch {
      setError("사용자 목록을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const toggleAdminStatus = async (userId: string, makeAdmin: boolean) => {
    if (!confirm(makeAdmin
      ? "이 사용자를 관리자로 승격하시겠습니까?"
      : "이 사용자의 관리자 권한을 해제하시겠습니까?\n해제 후 모든 권한이 초기화됩니다."
    )) {
      return;
    }

    setSaving(userId);
    setError(null);

    try {
      const res = await fetch(`/api/admin/users/${userId}/permissions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_admin: makeAdmin }),
      });

      const data = await res.json();

      if (data.success || res.ok) {
        // 사용자 목록 다시 불러오기
        await fetchUsers();
      } else {
        setError(data.error || "권한 변경에 실패했습니다.");
      }
    } catch {
      setError("권한 변경에 실패했습니다.");
    } finally {
      setSaving(null);
    }
  };

  const updatePermission = async (
    userId: string,
    resource: "articles" | "seminars",
    action: "create" | "update" | "delete",
    value: boolean
  ) => {
    setSaving(userId);
    setError(null);

    try {
      // 현재 사용자의 권한을 찾아서 업데이트
      const user = users.find((u) => u._id === userId);
      if (!user) return;

      const currentPermissions = user.permissions ?? DEFAULT_PERMISSIONS;
      const newPermissions: UserPermissions = {
        ...currentPermissions,
        [resource]: {
          ...currentPermissions[resource],
          [action]: value,
        },
      };

      const res = await fetch(`/api/admin/users/${userId}/permissions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions: newPermissions }),
      });

      const data = await res.json();

      if (data.success || res.ok) {
        // 로컬 상태 업데이트
        setUsers((prev) =>
          prev.map((u) =>
            u._id === userId ? { ...u, permissions: newPermissions } : u
          )
        );
      } else {
        setError(data.error || "권한 수정에 실패했습니다.");
      }
    } catch {
      setError("권한 수정에 실패했습니다.");
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-2">사용자 목록 불러오는 중...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-600 rounded-lg">
        {error}
        <button
          onClick={fetchUsers}
          className="ml-4 text-sm underline hover:no-underline"
        >
          다시 시도
        </button>
      </div>
    );
  }

  // 일반 사용자만 필터링 (관리자 제외)
  const regularUsers = users.filter((u) => !u.is_admin);
  const adminUsers = users.filter((u) => u.is_admin);

  return (
    <div className="space-y-6">
      {/* 관리자 목록 */}
      {adminUsers.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            관리자 ({adminUsers.length}명)
          </h3>
          <div className="space-y-2">
            {adminUsers.map((user) => {
              const isSaving = saving === user._id;
              return (
                <div
                  key={user._id}
                  className="p-4 bg-blue-50 border border-blue-200 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="ml-auto flex flex-col items-end gap-1">
                      <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded">
                        모든 권한
                      </span>
                      {user.email !== "admin@hnw.co.kr" && (
                        <button
                          onClick={() => toggleAdminStatus(user._id, false)}
                          disabled={isSaving}
                          className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50"
                          title="관리자 권한 해제"
                        >
                          {isSaving ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <ShieldOff className="w-3 h-3" />
                          )}
                          해제
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 일반 사용자 목록 */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
          <UserIcon className="w-4 h-4" />
          일반 사용자 ({regularUsers.length}명)
        </h3>

        {regularUsers.length === 0 ? (
          <EmptyState icon={Users} title="등록된 일반 사용자가 없습니다." />
        ) : (
          <div className="space-y-4">
            {regularUsers.map((user) => {
              const permissions = user.permissions ?? DEFAULT_PERMISSIONS;
              const isSaving = saving === user._id;

              return (
                <div
                  key={user._id}
                  className="p-4 bg-card border rounded-lg space-y-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                      {isSaving && (
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      )}
                      <button
                        onClick={() => toggleAdminStatus(user._id, true)}
                        disabled={isSaving}
                        className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-blue-300 text-blue-600 hover:bg-blue-50 disabled:opacity-50"
                        title="관리자로 승격"
                      >
                        <ShieldPlus className="w-3 h-3" />
                        관리자
                      </button>
                    </div>
                  </div>

                  {/* 기사 권한 */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">기사 권한</p>
                    <div className="flex flex-wrap gap-2">
                      <PermissionCheckbox
                        label="등록"
                        checked={permissions.articles.create}
                        onChange={(v) => updatePermission(user._id, "articles", "create", v)}
                        disabled={isSaving}
                      />
                      <PermissionCheckbox
                        label="수정"
                        checked={permissions.articles.update}
                        onChange={(v) => updatePermission(user._id, "articles", "update", v)}
                        disabled={isSaving}
                      />
                      <PermissionCheckbox
                        label="삭제"
                        checked={permissions.articles.delete}
                        onChange={(v) => updatePermission(user._id, "articles", "delete", v)}
                        disabled={isSaving}
                      />
                    </div>
                  </div>

                  {/* 세미나 권한 */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">세미나 권한</p>
                    <div className="flex flex-wrap gap-2">
                      <PermissionCheckbox
                        label="등록"
                        checked={permissions.seminars.create}
                        onChange={(v) => updatePermission(user._id, "seminars", "create", v)}
                        disabled={isSaving}
                      />
                      <PermissionCheckbox
                        label="수정"
                        checked={permissions.seminars.update}
                        onChange={(v) => updatePermission(user._id, "seminars", "update", v)}
                        disabled={isSaving}
                      />
                      <PermissionCheckbox
                        label="삭제"
                        checked={permissions.seminars.delete}
                        onChange={(v) => updatePermission(user._id, "seminars", "delete", v)}
                        disabled={isSaving}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function PermissionCheckbox({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition-colors ${
        checked
          ? "bg-primary/10 border-primary text-primary"
          : "bg-gray-50 border-gray-200 text-gray-600"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100"}`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="sr-only"
      />
      <span
        className={`w-4 h-4 rounded border flex items-center justify-center ${
          checked ? "bg-primary border-primary" : "border-gray-300"
        }`}
      >
        {checked && (
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </span>
      <span className="text-sm">{label}</span>
    </label>
  );
}
