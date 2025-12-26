"use client"
import { BarChart3, MapPin, Search, Leaf, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Link, useRouter } from "@tanstack/react-router"
import { LanguageSwitcher } from "./LanguageSwitcher"
import { useTranslation } from "react-i18next"

interface HeaderProps {
  activeView: "dashboard" | "map" | "predict" | "complaint" | "check"
  onViewChange: (view: "dashboard" | "map" | "predict" | "complaint" | "check") => void
}

export default function Header({ activeView, onViewChange }: HeaderProps) {
  const { t } = useTranslation()

  return (
    <nav className="fixed top-0 left-0 right-0 z-[1500] bg-card border-b border-border">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between h-16 px-2">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="bg-primary rounded-lg p-2">
              <Leaf className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground hidden sm:inline">FarmYield Pro</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            <Link to={'/'} onClick={() => onViewChange("dashboard")}>
              <Button
                variant={activeView === "dashboard" ? "default" : "ghost"}
                size="sm"
                onClick={() => onViewChange("dashboard")}
                className="gap-2"
              >
                <BarChart3 className="w-4 h-4" />
                {t('Dashboard')}
              </Button>
            </Link>

            <Link to={'/map'} onClick={() => onViewChange("map")}>
              <Button
                variant={activeView === "map" ? "default" : "ghost"}
                size="sm"
                onClick={() => onViewChange("map")}
                className="gap-2"
              >
                <MapPin className="w-4 h-4" />
                {t('Map View')}
              </Button>
            </Link>

            <Link to={'/predict'} onClick={() => onViewChange("predict")}>
              <Button
                variant={activeView === "predict" ? "default" : "ghost"}
                size="sm"
                onClick={() => onViewChange("predict")}
                className="gap-2"
              >
                <Search className="w-4 h-4" />
                {t('Predict Yield')}
              </Button>
            </Link>

            <Link to={'/complaint'} onClick={() => onViewChange("complaint")}>
              <Button
                variant={activeView === "complaint" ? "default" : "ghost"}
                size="sm"
                onClick={() => onViewChange("complaint")}
                className="gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                {t('File a Complaint')}
              </Button>
            </Link>

            <Link to={'/check'} onClick={() => onViewChange("check")}>
              <Button
                variant={activeView === "check" ? "default" : "ghost"}
                size="sm"
                onClick={() => onViewChange("check")}
                className="gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                {t('Check the status')}
              </Button>
            </Link>
            <div className="ml-auto">
              <LanguageSwitcher />
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden flex items-center gap-1">
            <Link to={'/'} onClick={() => onViewChange("predict")}>
              <Button
                variant={activeView === "dashboard" ? "default" : "ghost"}
                size="icon"
                onClick={() => onViewChange("dashboard")}
              >
                <BarChart3 className="w-4 h-4" />
              </Button>
            </Link>
            <Link to={'/map'} onClick={() => onViewChange("predict")}>
              <Button
                variant={activeView === "map" ? "default" : "ghost"}
                size="icon"
                onClick={() => onViewChange("map")}
              >
                <MapPin className="w-4 h-4" />
              </Button>
            </Link>
            <Link to={'/predict'} onClick={() => onViewChange("predict")}>
              <Button
                variant={activeView === "predict" ? "default" : "ghost"}
                size="icon"
                onClick={() => onViewChange("predict")}
              >
                <Search className="w-4 h-4" />
              </Button>
            </Link>
            <Link to={'/complaint'} onClick={() => onViewChange("predict")}>
              <Button
                variant={activeView === "complaint" ? "default" : "ghost"}
                size="icon"
                onClick={() => onViewChange("complaint")}
              >
                <MessageSquare className="w-4 h-4" />
              </Button>
            </Link>
            <div className="ml-auto">
              <LanguageSwitcher isCompact={true} />
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
