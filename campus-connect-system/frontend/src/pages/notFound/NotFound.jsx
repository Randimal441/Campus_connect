import { Link } from 'react-router-dom';
import Button from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="page not-found-page">
      <div className="h-16 w-16 rounded-xl bg-primary flex items-center justify-center mb-4">
        <span className="text-primary-foreground font-heading font-bold text-2xl">
          CC
        </span>
      </div>
      <h1>404</h1>
      <p>Page not found.</p>
      <Link to="/">
        <Button className="px-6 h-11">Go Home</Button>
      </Link>
    </div>
  );
}
