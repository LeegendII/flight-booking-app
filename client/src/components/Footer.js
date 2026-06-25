import Link from 'next/link';
import { Plane, Shield, CreditCard, HelpCircle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full border-t border-card-border bg-slate-900 text-slate-400 py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Brand column */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-white">
            <div className="bg-indigo-600 p-2 rounded-xl">
              <Plane className="w-5 h-5 rotate-45" />
            </div>
            <span className="font-extrabold text-xl tracking-tight">SkyFlow</span>
          </div>
          <p className="text-sm text-slate-400">
            Book flights globally with integrated real-time weather analytics, AI suitcase advisories, and multi-channel secure payments.
          </p>
          <div className="flex items-center gap-3 mt-2">
            <Shield className="w-5 h-5 text-indigo-400" title="Secure Transactions" />
            <CreditCard className="w-5 h-5 text-indigo-400" title="All Major Cards Accepted" />
            <HelpCircle className="w-5 h-5 text-indigo-400" title="24/7 Support Desk" />
          </div>
        </div>

        {/* Column 2: Booking services */}
        <div>
          <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Bookings</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/" className="hover:text-white transition-colors">Flights Search</Link></li>
            <li><Link href="/history" className="hover:text-white transition-colors">My Bookings</Link></li>
            <li><Link href="/destinations" className="hover:text-white transition-colors">Popular Destinations</Link></li>
            <li><Link href="/promos" className="hover:text-white transition-colors">Special Promo Offers</Link></li>
          </ul>
        </div>

        {/* Column 3: Corporate Info */}
        <div>
          <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Company</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
            <li><Link href="/careers" className="hover:text-white transition-colors">Careers</Link></li>
            <li><Link href="/press" className="hover:text-white transition-colors">Press Releases</Link></li>
            <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
          </ul>
        </div>

        {/* Column 4: Customer Help */}
        <div>
          <h4 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Help & Support</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/support" className="hover:text-white transition-colors">Help Center</Link></li>
            <li><Link href="/refunds" className="hover:text-white transition-colors">Cancellation & Refunds</Link></li>
            <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Carriage</Link></li>
            <li><Link href="/contact" className="hover:text-white transition-colors">Contact Support</Link></li>
          </ul>
        </div>

      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500">
        <p>&copy; {new Date().getFullYear()} SkyFlow Airlines Group. All rights reserved.</p>
        <p className="flex gap-4 mt-2 sm:mt-0">
          <span>Stripe Protected</span>
          <span>PayPal Approved</span>
          <span>Flutterwave Enabled</span>
        </p>
      </div>
    </footer>
  );
}
