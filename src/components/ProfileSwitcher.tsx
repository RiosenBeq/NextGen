"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, Check, Building2, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { useProfile, type ProfileSummary } from "@/providers/ProfileProvider";
import { cn } from "@/lib/utils";

const ROLE_LABELS: Record<string, string> = {
  owner: "Sahip",
  admin: "Yönetici",
  member: "Üye",
};

function ProfileSwatch({
  profile,
  size = 28,
}: {
  profile: ProfileSummary;
  size?: number;
}) {
  return (
    <span
      className="relative flex items-center justify-center rounded-xl shrink-0"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${profile.primaryColor} 0%, ${profile.accentColor} 100%)`,
        boxShadow: `0 4px 12px ${profile.primaryColor}66`,
      }}
      aria-hidden
    >
      <span
        className="absolute inset-[2px] rounded-[8px] flex items-center justify-center"
        style={{
          background: "rgba(11, 16, 35, 0.85)",
          backdropFilter: "blur(6px)",
        }}
      >
        <span
          className="font-extrabold text-white leading-none"
          style={{
            fontSize: size <= 24 ? 10 : size <= 28 ? 11 : 13,
            letterSpacing: "-0.04em",
          }}
        >
          {profile.monogram}
        </span>
      </span>
    </span>
  );
}

export function ProfileSwitcher({
  variant = "topbar",
}: {
  variant?: "topbar" | "sidebar" | "drawer";
}) {
  const { activeProfile, availableProfiles, switchProfile, isPending } = useProfile();
  const [isOpen, setIsOpen] = useState(false);
  const [pendingProfileId, setPendingProfileId] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  if (!activeProfile) return null;
  if (availableProfiles.length < 2) return null;

  const handleSwitch = (profileId: string) => {
    if (profileId === activeProfile.id) return;
    setPendingProfileId(profileId);
    setIsOpen(false);
    void switchProfile(profileId);
  };

  const pendingTarget = pendingProfileId
    ? availableProfiles.find((a) => a.profile.id === pendingProfileId)?.profile
    : null;

  const onDark = variant === "sidebar" || variant === "drawer";

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(o => !o)}
        disabled={isPending}
        className={cn(
          "flex items-center gap-2 rounded-full transition-colors duration-200 disabled:opacity-60",
          variant === "topbar" &&
            "py-1 pl-1.5 pr-2.5 border border-white/55 bg-white/35 backdrop-blur-md hover:bg-white/70",
          variant === "sidebar" &&
            "py-1 pl-1.5 pr-2.5 border border-white/15 bg-white/5 hover:bg-white/10",
          variant === "drawer" &&
            "py-1 pl-1.5 pr-2.5 border border-white/15 bg-white/5 hover:bg-white/10"
        )}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <ProfileSwatch profile={activeProfile} size={24} />
        <span
          className={cn(
            "text-[12px] font-semibold tracking-tight leading-none whitespace-nowrap",
            onDark ? "text-white" : "text-[--text]"
          )}
          style={{ letterSpacing: "-0.01em" }}
        >
          {activeProfile.brandName}
        </span>
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 shrink-0 transition-transform duration-200",
            isOpen && "rotate-180",
            onDark ? "text-white/70" : "text-[--text-tertiary]"
          )}
          strokeWidth={2}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            role="menu"
            className={cn(
              "absolute z-[80] mt-2 w-[260px] rounded-2xl border shadow-2xl overflow-hidden",
              variant === "topbar"
                ? "left-0 bg-white/95 backdrop-blur-xl border-white/60"
                : "left-0 bg-[#10162E] border-white/10"
            )}
          >
            <div
              className={cn(
                "px-3 py-2 text-[10px] uppercase tracking-wider font-semibold border-b",
                variant === "topbar"
                  ? "text-[--text-tertiary] border-black/5"
                  : "text-white/50 border-white/10"
              )}
            >
              <Building2 className="w-3 h-3 inline-block mr-1.5 -mt-0.5" strokeWidth={2} />
              İşletme Profilleri
            </div>
            <div className="p-1.5 max-h-[320px] overflow-y-auto">
              {availableProfiles.map(({ profile, role }) => {
                const isActive = profile.id === activeProfile.id;
                return (
                  <button
                    key={profile.id}
                    type="button"
                    onClick={() => handleSwitch(profile.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-2.5 py-2 rounded-xl transition-colors duration-150 text-left",
                      variant === "topbar"
                        ? isActive
                          ? "bg-[--bg-elevated]"
                          : "hover:bg-[--bg-elevated]"
                        : isActive
                          ? "bg-white/10"
                          : "hover:bg-white/8"
                    )}
                  >
                    <ProfileSwatch profile={profile} size={32} />
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "text-[13px] font-semibold leading-tight truncate",
                          variant === "topbar" ? "text-[--text]" : "text-white"
                        )}
                        style={{ letterSpacing: "-0.01em" }}
                      >
                        {profile.brandName}
                      </p>
                      <p
                        className={cn(
                          "text-[10px] uppercase tracking-wider mt-0.5",
                          variant === "topbar"
                            ? "text-[--text-tertiary]"
                            : "text-white/55"
                        )}
                      >
                        {ROLE_LABELS[role] ?? role}
                      </p>
                    </div>
                    {isActive && (
                      <Check
                        className={cn(
                          "w-4 h-4 shrink-0",
                          variant === "topbar" ? "text-[--text]" : "text-white"
                        )}
                        strokeWidth={2.5}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {typeof document !== 'undefined' &&
        pendingTarget &&
        isPending &&
        createPortal(
          <AnimatePresence>
            <motion.div
              key="profile-switch-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[100] flex items-center justify-center"
              style={{
                background:
                  "radial-gradient(120% 60% at 50% 50%, rgba(8,12,28,0.55) 0%, rgba(8,12,28,0.85) 100%)",
                backdropFilter: "blur(8px)",
              }}
              aria-live="polite"
              aria-busy="true"
            >
              <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.92, opacity: 0 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center gap-5 px-10 py-8 rounded-3xl bg-white/95 shadow-2xl"
              >
                <div className="relative">
                  <ProfileSwatch profile={pendingTarget} size={56} />
                  <Loader2
                    className="absolute -bottom-1 -right-1 w-6 h-6 animate-spin text-[--text]"
                    strokeWidth={2.25}
                  />
                </div>
                <div className="text-center">
                  <p className="text-[11px] uppercase tracking-wider text-[--text-tertiary] font-semibold">
                    Profil değiştiriliyor
                  </p>
                  <p className="text-[18px] font-semibold text-[--text] mt-1.5" style={{ letterSpacing: "-0.015em" }}>
                    {pendingTarget.brandName}
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}
