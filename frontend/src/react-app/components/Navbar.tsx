import { Link } from "react-router";
import { Grid3x3, Sandwich, Footprints, Sparkles } from "lucide-react";

interface NavbarProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export default function Navbar({ selectedCategory, onCategoryChange }: NavbarProps) {
  const categories = [
    { id: "all", label: "All Products", icon: Grid3x3 },
    { id: "Slides", label: "Slides", icon: Sandwich },
    { id: "Opens", label: "Opens", icon: Sparkles },
    { id: "Sneakers", label: "Sneakers", icon: Footprints },
  ];

  return (
    <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          <Link to="/" className="text-2xl font-bold text-white hover:text-gray-300 transition-colors">
            Qaf fits
          </Link>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex gap-4">
              {categories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    onClick={() => onCategoryChange(cat.id)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                      selectedCategory === cat.id
                        ? "bg-gradient-to-r from-green-600 to-green-500 text-white shadow-lg shadow-green-500/30"
                        : "text-gray-300 hover:bg-gray-800 border border-gray-800"
                    }`}
                  >
                    <Icon size={18} />
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        
        <div className="md:hidden flex gap-2 pb-4 overflow-x-auto">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => onCategoryChange(cat.id)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                  selectedCategory === cat.id
                    ? "bg-gradient-to-r from-green-600 to-green-500 text-white shadow-lg shadow-green-500/30"
                    : "text-gray-300 hover:bg-gray-800 border border-gray-800"
                }`}
              >
                <Icon size={18} />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}