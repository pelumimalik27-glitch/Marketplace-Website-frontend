import React from "react";
import { LoaderCircle } from "lucide-react";

function joinClasses(...values) {
  return values.filter(Boolean).join(" ");
}

export function SkeletonBox({ className = "" }) {
  return <div className={joinClasses("store-shimmer rounded-2xl bg-slate-200", className)} aria-hidden="true" />;
}

export function LoadingSpinner({
  label = "Loading products",
  caption = "Please wait while we prepare the page.",
  compact = false,
  className = "",
}) {
  return (
    <div
      className={joinClasses(
        "flex items-center justify-center",
        compact ? "gap-2 text-sm" : "min-h-[220px] flex-col gap-4 rounded-[2rem] border border-slate-200 bg-white/95 px-6 py-10 text-center shadow-sm",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <span
        className={joinClasses(
          "inline-flex items-center justify-center rounded-full",
          compact ? "h-8 w-8 bg-slate-950 text-white" : "h-16 w-16 bg-slate-950 text-white shadow-[0_0_0_10px_rgba(15,23,42,0.08)]"
        )}
      >
        <LoaderCircle className={joinClasses("animate-spin", compact ? "h-4 w-4" : "h-8 w-8")} />
      </span>
      <div className={compact ? "text-left" : ""}>
        <p className={joinClasses("font-semibold text-slate-900", compact ? "text-sm" : "text-base")}>
          {label}
        </p>
        {!compact && <p className="mt-1 text-sm text-slate-500">{caption}</p>}
      </div>
    </div>
  );
}

export function LoadingPill({ label = "Refreshing products..." }) {
  return (
    <div
      className="inline-flex items-center gap-2 rounded-full border border-slate-950 bg-slate-950 px-3 py-1 text-xs font-medium text-white"
      role="status"
      aria-live="polite"
    >
      <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
      <span>{label}</span>
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <SkeletonBox className="h-56 w-full rounded-none" />
      <div className="space-y-3 p-4">
        <SkeletonBox className="h-4 w-4/5 rounded-lg" />
        <SkeletonBox className="h-4 w-3/5 rounded-lg" />
        <div className="flex items-center gap-2">
          <SkeletonBox className="h-3 w-24 rounded-full" />
          <SkeletonBox className="h-3 w-14 rounded-full" />
        </div>
        <div className="flex items-center gap-3">
          <SkeletonBox className="h-5 w-24 rounded-lg" />
          <SkeletonBox className="h-5 w-20 rounded-full" />
        </div>
        <SkeletonBox className="h-3 w-28 rounded-full" />
        <SkeletonBox className="h-10 w-full rounded-full" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function ShopPageSkeleton() {
  return (
    <div className="mt-6 flex flex-col gap-6 lg:flex-row" aria-hidden="true">
      <div className="hidden w-full max-w-[18rem] rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm lg:block">
        <div className="space-y-4">
          <SkeletonBox className="h-6 w-28 rounded-lg" />
          <SkeletonBox className="h-12 w-full rounded-xl" />
          <SkeletonBox className="h-12 w-full rounded-xl" />
          <SkeletonBox className="h-20 w-full rounded-2xl" />
          <SkeletonBox className="h-12 w-full rounded-xl" />
          <SkeletonBox className="h-10 w-full rounded-full" />
        </div>
      </div>
      <div className="flex-1 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SkeletonBox className="h-11 w-44 rounded-xl" />
          <SkeletonBox className="h-11 w-40 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function FlashDealSkeleton({ count = 6 }) {
  return (
    <div className="mt-10 w-full rounded-md bg-orange-600 py-10 pl-2 pr-2" aria-hidden="true">
      <div className="flex items-center justify-between px-4">
        <div className="space-y-2">
          <SkeletonBox className="h-5 w-32 rounded-full bg-orange-200/50" />
          <SkeletonBox className="h-4 w-40 rounded-full bg-orange-200/40" />
        </div>
        <SkeletonBox className="h-8 w-28 rounded-md bg-white/50" />
      </div>
      <div className="mt-6 grid grid-cols-2 gap-4 px-4 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="overflow-hidden rounded-xl bg-white/95 p-3 shadow-sm">
            <SkeletonBox className="h-32 w-full rounded-xl" />
            <div className="mt-3 space-y-2">
              <SkeletonBox className="h-3 w-4/5 rounded-full" />
              <SkeletonBox className="h-3 w-2/3 rounded-full" />
              <SkeletonBox className="h-5 w-20 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="container mx-auto px-3 py-6 sm:px-4 sm:py-8" aria-hidden="true">
      <SkeletonBox className="mb-6 h-5 w-32 rounded-full" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
        <div className="space-y-4">
          <div className="rounded-xl bg-white p-3 shadow-lg sm:p-4">
            <SkeletonBox className="h-64 w-full rounded-lg sm:h-96" />
          </div>
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonBox key={index} className="h-20 w-20 rounded-lg" />
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <div className="space-y-4">
            <SkeletonBox className="h-4 w-20 rounded-full" />
            <SkeletonBox className="h-10 w-4/5 rounded-xl" />
            <SkeletonBox className="h-5 w-48 rounded-full" />
            <SkeletonBox className="h-10 w-40 rounded-xl" />
            <SkeletonBox className="h-5 w-56 rounded-full" />
          </div>
          <div className="rounded-lg bg-gray-50 p-4">
            <div className="space-y-3">
              <SkeletonBox className="h-5 w-40 rounded-lg" />
              <SkeletonBox className="h-4 w-28 rounded-full" />
            </div>
          </div>
          <div className="space-y-4">
            <SkeletonBox className="h-12 w-40 rounded-xl" />
            <SkeletonBox className="h-12 w-full rounded-xl" />
            <SkeletonBox className="h-12 w-full rounded-xl" />
          </div>
          <div className="space-y-3">
            <SkeletonBox className="h-6 w-28 rounded-lg" />
            <SkeletonBox className="h-4 w-full rounded-full" />
            <SkeletonBox className="h-4 w-5/6 rounded-full" />
            <SkeletonBox className="h-4 w-2/3 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function OrderCardSkeleton({ compact = false }) {
  return (
    <div className="overflow-hidden rounded-xl bg-white shadow" aria-hidden="true">
      <div className="border-b bg-gray-50 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <SkeletonBox className="h-5 w-40 rounded-full" />
            <SkeletonBox className="h-4 w-52 rounded-full" />
          </div>
          <SkeletonBox className="h-9 w-24 rounded-full" />
        </div>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <SkeletonBox className="mb-4 h-5 w-28 rounded-full" />
            <div className="space-y-4">
              {Array.from({ length: compact ? 1 : 2 }).map((_, index) => (
                <div key={index} className="flex items-center gap-4 rounded-lg border p-3">
                  <SkeletonBox className="h-16 w-16 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <SkeletonBox className="h-4 w-3/4 rounded-full" />
                    <SkeletonBox className="h-3 w-1/2 rounded-full" />
                  </div>
                  <SkeletonBox className="h-5 w-20 rounded-full" />
                </div>
              ))}
            </div>
          </div>
          <div>
            <SkeletonBox className="mb-4 h-5 w-32 rounded-full" />
            <div className="space-y-3 rounded-lg border p-4">
              <SkeletonBox className="h-4 w-full rounded-full" />
              <SkeletonBox className="h-4 w-full rounded-full" />
              <SkeletonBox className="h-4 w-full rounded-full" />
              <SkeletonBox className="h-6 w-32 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
