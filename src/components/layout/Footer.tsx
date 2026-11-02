import Link from 'next/link';
import { Heart, Shield, Star } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <Heart className="w-5 h-5 mr-2 text-red-500" />
              Straightforward
            </h3>
            <p className="text-gray-300 leading-relaxed">
              An estimate built from published formulas and your own activity,
              shown with a range instead of a single exact number.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-green-500" />
              Private
            </h3>
            <p className="text-gray-300 leading-relaxed">
              No accounts. Your inputs and results are saved only in your
              browser&apos;s local storage on this device.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <Star className="w-5 h-5 mr-2 text-yellow-500" />
              Free
            </h3>
            <p className="text-gray-300 leading-relaxed">
              No sign-up and no subscription.
            </p>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p className="text-sm text-gray-400">
            Estimates only. Not medical advice.
          </p>
          <div className="text-xs text-gray-400 mt-4 space-x-4">
            <Link href="/privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <span aria-hidden="true">|</span>
            <Link href="/terms" className="hover:text-white transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
