import { Link } from 'react-router-dom';
import { SECTIONS } from '../../utils/constants';
import Navbar from '../../components/common/Navbar';
import Footer from '../../components/common/Footer';

export default function UserHome() {
  return (
    <div className="page">
      <Navbar />
      <main className="main-content">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-heading font-bold text-xl">
              CC
            </span>
          </div>
          <div>
            <h1>Welcome to Campus Connect</h1>
            <p className="lead !mb-0">Choose what you want to explore</p>
          </div>
        </div>
        <div className="section-grid">
          {SECTIONS.map((section) => (
            <Link
              key={section.id}
              to={section.path}
              className="section-card animate-fade-in hover:border-primary transition-all"
            >
              <h3>{section.label}</h3>
              <p>View and participate</p>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
