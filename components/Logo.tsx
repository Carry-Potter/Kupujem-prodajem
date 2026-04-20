import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="text-xl font-bold tracking-tight text-slate-900">
      notify<span className="text-sky-600">KP</span>
    </Link>
  );
}
