import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-muted/30 border-t border-border mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-primary">ApniList</h3>
            <p className="text-sm text-muted-foreground">
              Smart price tracking and expert product reviews. Never miss a deal again.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/articles" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Articles
                </Link>
              </li>
              <li>
                <Link to="/price-tracker" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Price Tracker
                </Link>
              </li>
              <li>
                <Link to="/deals" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Daily Deals
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contact Us</h4>
            <p className="text-sm text-muted-foreground">
              Sector 14, Gurugram<br />
              Haryana, India
            </p>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} ApniList. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
