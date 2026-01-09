import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
      <h2 className="text-4xl font-bold text-gray-800 dark:text-gray-100">404 - Səhifə Tapılmadı</h2>
      <p className="text-gray-600 dark:text-gray-400">
        Axtardığınız səhifə mövcud deyil.
      </p>
      <Link
        href="/"
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        Ana Səhifəyə Qayıt
      </Link>
    </div>
  );
}
