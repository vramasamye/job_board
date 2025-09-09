'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/components/theme-provider'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark')
    } else if (theme === 'dark') {
      setTheme('system')
    } else {
      setTheme('light')
    }
  }

  const getThemeIcon = () => {
    if (theme === 'light') {
      return '☀️'
    } else if (theme === 'dark') {
      return '🌙'
    } else {
      return '💻'
    }
  }

  const getThemeLabel = () => {
    if (theme === 'light') {
      return 'Light'
    } else if (theme === 'dark') {
      return 'Dark'
    } else {
      return 'System'
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      className="flex items-center gap-2"
    >
      {mounted ? (
        <>
          <span className="text-lg">{getThemeIcon()}</span>
          <span className="hidden sm:inline">{getThemeLabel()}</span>
        </>
      ) : (
        <>
          <span className="text-lg">💻</span>
          <span className="hidden sm:inline">System</span>
        </>
      )}
    </Button>
  )
}