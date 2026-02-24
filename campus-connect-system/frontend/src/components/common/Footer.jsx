export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="footer">
      <div className="max-w-7xl mx-auto">
        <p className="font-medium">
          &copy; {currentYear} <span className="font-bold">Campus Connect</span>. All rights reserved.
        </p>
        <p className="text-sm text-white/70 mt-1">
          Connecting campus life, one click at a time
        </p>
      </div>
    </footer>
  );
}
