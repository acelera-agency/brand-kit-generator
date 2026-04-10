import Link from "next/link";

/**
 * Entry point for the create-kit flow. This used to POST directly to
 * /api/kits/create, but now Phase B Batch 1 routes through /dashboard/new
 * which lets the user pick brand_stage before the kit is materialized.
 */
export function StartKitButton() {
  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end">
      <Link
        href="/dashboard/new"
        className="btn-primary px-5 py-3 text-sm sm:px-6 sm:py-3 text-center"
      >
        Start guided brand kit
      </Link>
    </div>
  );
}
