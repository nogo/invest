import { Link } from '@tanstack/react-router'
import { PieChart } from "lucide-react"

export function MainNav() {
  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <div className="flex items-center space-x-6">
          <Link to="/" className="flex items-center space-x-2">
            <PieChart className="h-6 w-6" />
            <span className="text-xl font-bold">Invest</span>
          </Link>
        </div>
      </div>
    </nav>
  )
}