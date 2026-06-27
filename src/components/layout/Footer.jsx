export function Footer() {
  return (
    <footer className="bg-gray-100 border-t border-gray-200 py-3 px-6 text-center">
      <p className="text-xs text-gray-400">
        © {new Date().getFullYear()} Chand Bagh School
        <span className="mx-2 text-gray-300">|</span>
        Powered by{' '}
        <a
          href="https://aisitara.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:text-blue-700 font-medium transition-colors"
        >
          AIS
        </a>
      </p>
    </footer>
  );
}
