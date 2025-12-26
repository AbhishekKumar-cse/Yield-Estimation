import Header from '@/components/Header'
import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { useState } from 'react'

const RootLayout = () => {
  const [activeView, setActiveView] = useState<"dashboard" | "map" | "predict" | "complaint" | "check">("dashboard")

  return (
    <>
      <Header activeView={activeView} onViewChange={setActiveView}/>
      <div className='pt-16'>
        <Outlet />
      </div>
      <TanStackRouterDevtools />
    </>
  )
}

export const Route = createRootRoute({ component: RootLayout })