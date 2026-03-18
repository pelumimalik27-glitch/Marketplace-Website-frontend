import React from "react";
import { LoadingSpinner } from "../Loading/StorefrontLoaders";

function SkeletonBlock({ className = "" }) {
  return <div className={`animate-pulse rounded-2xl bg-slate-200/80 ${className}`} />;
}

function PageSkeleton({ visible = false, overlay = true }) {
  if (!visible) return null;

  return (
    <div
      className={
        overlay
          ? "pointer-events-auto fixed inset-0 z-[120] bg-white/88 backdrop-blur-sm"
          : "min-h-screen bg-white"
      }
      aria-hidden="true"
    >
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <SkeletonBlock className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <SkeletonBlock className="h-4 w-36" />
              <SkeletonBlock className="h-3 w-24" />
            </div>
          </div>
          <div className="hidden items-center gap-3 md:flex">
            <SkeletonBlock className="h-10 w-24" />
            <SkeletonBlock className="h-10 w-24" />
            <SkeletonBlock className="h-10 w-28" />
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white px-4 py-3">
          <LoadingSpinner
            compact
            label="Loading marketplace"
            caption=""
            className="justify-start text-slate-900"
          />
        </div>

        <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
          <div className="hidden rounded-[2rem] border border-slate-200/70 bg-white/70 p-5 shadow-sm lg:block">
            <div className="space-y-4">
              <SkeletonBlock className="h-4 w-24" />
              <SkeletonBlock className="h-12 w-full" />
              <SkeletonBlock className="h-12 w-full" />
              <SkeletonBlock className="h-12 w-full" />
              <SkeletonBlock className="h-12 w-full" />
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200/70 bg-white/75 p-6 shadow-sm">
              <div className="space-y-4">
                <SkeletonBlock className="h-8 w-56" />
                <SkeletonBlock className="h-4 w-full max-w-2xl" />
                <SkeletonBlock className="h-4 w-full max-w-xl" />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <SkeletonBlock className="h-28 w-full" />
              <SkeletonBlock className="h-28 w-full" />
              <SkeletonBlock className="h-28 w-full" />
            </div>

            <div className="rounded-[2rem] border border-slate-200/70 bg-white/75 p-6 shadow-sm">
              <div className="space-y-4">
                <SkeletonBlock className="h-5 w-40" />
                <SkeletonBlock className="h-20 w-full" />
                <SkeletonBlock className="h-20 w-full" />
                <SkeletonBlock className="h-20 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PageSkeleton;
