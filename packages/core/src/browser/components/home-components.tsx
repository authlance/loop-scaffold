import React, { useCallback, useContext, useEffect, useMemo, useRef } from 'react'
import { SessionContext } from '@authlance/core/lib/browser/hooks/useAuth'
import { Hydrate, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { getOrCreateQueryClient } from '@authlance/core/lib/browser/query-client'
import { SidebarInset, SidebarProvider } from '@authlance/ui/lib/browser/components/sidebar'
import { Link, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Toaster } from '@authlance/ui/lib/browser/components/toaster'
import useRoutesProvider from '@authlance/core/lib/browser/hooks/user-routes-provider'
import { Button } from '@authlance/ui/lib/browser/components/button'
import { useAppSelector } from '@authlance/core/lib/browser/store'
import RenderIf from '@authlance/core/lib/browser/components/RenderIf'
import { ArrowRight, ChevronDown, ChevronLeft, LogOut } from 'lucide-react'
import { HashLink as RouterHashLink, HashLinkProps as RouterHashLinkProps } from 'react-router-hash-link'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@authlance/ui/lib/browser/components/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@authlance/ui/lib/browser/components/avatar'
import { useBrandLogo } from '@authlance/core/lib/browser/hooks/useBrand'
import { PathProvider } from '@authlance/core/lib/browser/common/common'
import { match } from 'path-to-regexp'
import useSidebarSecondaryItemProvider from '@loop/loop-layout/lib/browser/hooks/useSidebarSecondaryItemProvider'
import useDashboardContentProvider from '@loop/loop-layout/lib/browser/hooks/useDashboardContent'
import useMainActionProvider from '@loop/loop-layout/lib/browser/hooks/useMainActionProvider'
import { AppSidebar } from '@loop/loop-layout/lib/browser/components/authenticated-sidebar'
import { HiddenSidebarTrigger } from '@loop/loop-layout/lib/browser/components/docs-sidebar'

const DASHBOARD_TITLE = 'Dashboard'

type HashLinkProps = Omit<RouterHashLinkProps, 'children'> & { children?: React.ReactNode }

// Locally retype the hash link so we rely on the app's React version.
const HashLink = RouterHashLink as unknown as React.FC<HashLinkProps>

const HOME_NAV_LINKS = [
    { label: 'Overview', hash: '#overview' },
    { label: 'Platform', hash: '#platform' },
    { label: 'License Operator', hash: '#license-operator' },
    { label: 'Licensing', hash: '#licenses' },
    // { label: 'Deployment', hash: '#deployment' },
]

function useSmartBack() {
    const navigate = useNavigate()
    const location = useLocation()
    const historyRef = useRef<string[]>([])

    // Track visited locations
    useEffect(() => {
        const currentPath = location.pathname + location.search
        const lastPath = historyRef.current[historyRef.current.length - 1]
        if (currentPath !== lastPath) {
            historyRef.current.push(currentPath)
        }
    }, [location])

    const stripParams = (url: string) => {
        try {
            const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost'
            const u = new URL(url, base)
            return u.pathname
        } catch {
            // Fallback if it's a relative path
            return url.split('?')[0].split('#')[0]
        }
    }

    const goBackToDifferent = () => {
        const paths = historyRef.current
        const current = paths.pop()
        let prev = paths.pop()

        const currentBase = current ? stripParams(current) : null

        while (prev && currentBase && stripParams(prev) === currentBase) {
            prev = paths.pop()
        }

        if (prev) {
            navigate(prev)
        } else {
            navigate('/')
        }
    }

    return goBackToDifferent
}

export const HomeHeader: React.FC = ({}) => {
    const location = useLocation()
    const navigate = useNavigate()
    const { user, logoutUrl, clearSession, forceChallenge, targetGroup, isSysAdmin } = useContext(SessionContext)
    const authContext = useContext(SessionContext)
    const isRoot = useMemo(() => location.pathname === '/', [location.pathname])
    const brandLogo = useBrandLogo()
    const sidebarSecondaryItemProvider = useSidebarSecondaryItemProvider()

    const avatarFallback = useMemo(() => {
        if (user && user.firstName && user.lastName && user.firstName.length > 0 && user.lastName.length > 0) {
            return user.firstName.charAt(0) + user.lastName.charAt(0)
        }
        if (user && user.firstName && user.firstName.length >= 2) {
            return user.firstName.substring(0, 2)
        }
        return 'NA'
    }, [user])

    const isDocsPage = useMemo(() => {
        return location.pathname.startsWith('/docs')
    }, [location.pathname])

    const logoutAction = useCallback(async () => {
        try {
            if (logoutUrl && typeof window !== 'undefined') {
                clearSession()
                window.location.href = logoutUrl
            }
        } catch (error) {
            console.error(error)
        }
    }, [clearSession, logoutUrl])

    const loginAction = useCallback(async () => {
        forceChallenge()
    }, [forceChallenge])

    const viewProfile = useCallback(() => {
        navigate('/user/profile')
    }, [navigate])

    const secondaryItems = useMemo(() => {
        if (!authContext || !sidebarSecondaryItemProvider) {
            return []
        }
        return sidebarSecondaryItemProvider.getSecondaryItems(authContext)
    }, [sidebarSecondaryItemProvider, authContext])

    const manageLicensesPath = useMemo(() => {
        if (targetGroup && targetGroup.trim().length > 0) {
            return '/licenses/group'
        }
        return '/pricing'
    }, [targetGroup])

    return (
        <header className="sticky top-0 z-40 border-b backdrop-blur bg-background/75 border-border">
            <div className="flex items-center justify-between h-16 px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                <div className="flex gap-2">
                    <div className="flex items-center gap-2">
                        <RenderIf isTrue={Boolean(user && isSysAdmin && targetGroup)}>
                            <HiddenSidebarTrigger />
                        </RenderIf>
                    </div>
                    <RenderIf isTrue={Boolean(!isDocsPage && !(user && targetGroup && isSysAdmin))}>
                        <Link to="/" className="flex items-center gap-2">
                            <div className="h-8">
                                <img height={24} src={brandLogo} className="h-8" alt="Authlance" />
                            </div>
                            <span className="font-semibold sr-only">Authlance</span>
                        </Link>
                    </RenderIf>
                </div>
                <RenderIf isTrue={isRoot}>
                    <nav className="items-center hidden gap-6 text-sm md:flex">
                        {HOME_NAV_LINKS.map((link) => (
                            <HashLink
                                key={link.hash}
                                smooth
                                to={{ hash: link.hash }}
                                className="font-medium text-muted-foreground transition-colors hover:text-primary"
                            >
                                {link.label}
                            </HashLink>
                        ))}
                        <Link to={'/docs'} className="font-medium text-muted-foreground transition-colors hover:text-primary">
                            Docs
                        </Link>
                        <Link to={'/pricing'} className="font-medium text-muted-foreground transition-colors hover:text-primary">
                            Pricing
                        </Link>
                    </nav>
                </RenderIf>
                <RenderIf isTrue={!isRoot}>
                    <nav className="items-center hidden gap-6 text-sm md:flex">
                        {HOME_NAV_LINKS.map((link) => (
                            <HashLink
                                key={link.hash}
                                smooth
                                to={{ pathname: '/', hash: link.hash }}
                                className="font-medium text-muted-foreground transition-colors hover:text-primary"
                            >
                                {link.label}
                            </HashLink>
                        ))}
                        <Link to={'/docs'} className="font-medium text-muted-foreground transition-colors hover:text-primary">
                            Docs
                        </Link>
                        <Link to={'/pricing'} className="font-medium text-muted-foreground transition-colors hover:text-primary">
                            Pricing
                        </Link>
                    </nav>
                </RenderIf>
                <div className="flex items-center gap-2">
                    <RenderIf isTrue={Boolean(!user)}>
                        <Button
                            variant="link"
                            className="px-3 py-2 text-sm rounded-xl hover:underline"
                            onClick={(e) => {
                                e.preventDefault()
                                loginAction()
                            }}
                        >
                            Sign in
                        </Button>
                    </RenderIf>
                    <RenderIf isTrue={Boolean(user && targetGroup)}>
                        <div className="flex items-center gap-2">
                            <Button onClick={() => navigate(manageLicensesPath)}>
                                My Licenses
                            </Button>
                            <Button variant="ghost" size="icon" onClick={logoutAction}>
                                <LogOut />
                            </Button>
                        </div>
                    </RenderIf>
                    <RenderIf isTrue={Boolean(user && !targetGroup)}>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="flex items-center gap-2 px-2">
                                    <Avatar className="w-8 h-8 rounded-lg">
                                        <AvatarImage src={user?.avatar} alt={user?.firstName} />
                                        <AvatarFallback className="rounded-lg">{avatarFallback}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-col items-start hidden text-sm leading-tight sm:flex">
                                        <span className="font-semibold truncate max-w-[8rem]">{user?.firstName}</span>
                                        <span className="text-xs text-muted-foreground truncate max-w-[8rem]">
                                            {user?.email}
                                        </span>
                                    </div>
                                    <ChevronDown className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                {secondaryItems.map((item, index) => (
                                    <DropdownMenuItem
                                        key={`plain-layout-footer-item-${item.id}-${index}`}
                                        onClick={item.action}
                                    >
                                        <span>{item.label}</span>
                                    </DropdownMenuItem>
                                ))}
                                <DropdownMenuItem onClick={viewProfile}>
                                    <span>Account Profile</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={logoutAction}>
                                    <span>Logout</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </RenderIf>
                </div>
            </div>
        </header>
    )
}

export const HomeFooter: React.FC = ({}) => {
    const { user, forceChallenge, targetGroup } = useContext(SessionContext)
    const brandLogo = useBrandLogo()
    const navigate = useNavigate()

    const manageLicensesPath = useMemo(() => {
        if (targetGroup && targetGroup.trim().length > 0) {
            return '/licenses/group'
        }
        return '/licenses/group'
    }, [targetGroup])

    const loginAction = useCallback(async () => {
        forceChallenge()
    }, [forceChallenge])

    useEffect(() => {
        if (!document) {
            return
        }
        const yearEl = document.getElementById('year')
        if (!yearEl) {
            return
        }
        yearEl.textContent = new Date().getFullYear().toString()
    }, [])

    return (
        <footer className="py-12">
            <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                <div className="grid gap-8 md:grid-cols-3">
                    <div>
                        <div className="flex items-center gap-2">
                            <img src={brandLogo} alt="Authlance logo" className="h-8" />
                            <span className="sr-only">Authlance</span>
                        </div>
                        <p className="mt-3 text-sm text-muted-foreground">
                            Run authentication, billing, and licensing on your own stack.
                        </p>
                        <p className="mt-3 text-sm text-muted-foreground">
                            Deployable authentication and access control, built for extensibility and multi-tenancy.
                        </p>

                    </div>
                    <div>
                        <h3 className="font-semibold">Explore</h3>
                        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                            {HOME_NAV_LINKS.map((link) => (
                                <li key={`home-footer-link-${link.hash}`}>
                                    <HashLink smooth to={{ hash: link.hash }} className="hover:underline">
                                        {link.label}
                                    </HashLink>
                                </li>
                            ))}
                            <li>
                                <Link to={'/docs'} className="hover:underline">Docs</Link>
                            </li>
                            <li>
                                <Link to={'/pricing'} className="hover:underline">Pricing</Link>
                            </li>
                            <RenderIf isTrue={Boolean(!user)}>
                                <li>
                                    <Button
                                        variant="link"
                                        onClick={(e) => {
                                            e.preventDefault()
                                            loginAction()
                                        }}
                                        className="h-auto p-0 m-0 font-normal text-muted-foreground"
                                    >
                                        Sign in
                                    </Button>
                                </li>
                            </RenderIf>
                        </ul>
                    </div>
                    <RenderIf isTrue={Boolean(user)}>
                        <div>
                            <h3 className="font-semibold">Take action</h3>
                            <p className="mt-3 text-sm text-muted-foreground">
                                Issue trials, refresh paid plans, and download signed artifacts for your operators.
                            </p>
                            <Button
                                onClick={() => navigate(manageLicensesPath)}
                                className="mt-3 inline-flex items-center gap-2"
                            >
                                <ArrowRight className="h-4 w-4" /> Manage licenses
                            </Button>
                        </div>
                    </RenderIf>
                </div>
                <div className="flex items-center justify-between pt-6 mt-10 text-xs border-t border-border text-muted-foreground">
                    <p>
                        © <span id="year"></span> Authlance
                    </p>
                </div>
            </div>
        </footer>
    )
}

export const SideBarAppLayout: React.FC = ({}) => {
    const location = useLocation()
    const dashboardContentProvider = useDashboardContentProvider()
    const mainActionsProvider = useMainActionProvider()
    const { pathProvider, user, identityUser, clearSession, logoutUrl, targetGroup, isSysAdmin } = useContext(SessionContext)
    const { userId } = useParams<{ userId?: string }>()
    const navigate = useNavigate()
    const authContext = useContext(SessionContext)
    const routeProvider = useRoutesProvider()
    const isRoot = useMemo(() => location.pathname === '/', [location.pathname])
    const refreshTick = useAppSelector((state) => state.groupContext.refreshTick)
    const goBack = useSmartBack()

    const getTitle = useCallback(() => {
        if (isRoot) {
            return ''
        }
        if (!pathProvider) {
            return DASHBOARD_TITLE
        }
        const currentPath = pathProvider.getCurrentPath()
        const currentRoute = routeProvider.getRoute(currentPath)
        if (!currentRoute) {
            return DASHBOARD_TITLE
        }
        if (currentRoute.nameProvider) {
            return currentRoute.nameProvider(authContext)
        }
        return currentRoute.name
    }, [pathProvider, routeProvider, refreshTick, identityUser, user, authContext, isRoot])

    const canGoBack = useCallback(() => {
        if (!pathProvider) {
            return false
        }
        const currentPath = pathProvider.getCurrentPath()
        const currentRoute = routeProvider.getRoute(currentPath)
        if (!currentRoute) {
            return false
        }
        return currentRoute.canGoBack || false
    }, [pathProvider, routeProvider, user, userId])

    const getCurrentPath = useCallback(() => {
        if (!pathProvider) {
            return ''
        }
        return pathProvider.getCurrentPath()
    }, [pathProvider, routeProvider])

    const currentRoute = useMemo(() => {
        if (!pathProvider) {
            return undefined
        }
        const currentPath = pathProvider.getCurrentPath()
        if (!currentPath) {
            return undefined
        }
        const currentRoute = routeProvider.getRoute(currentPath)
        if (!currentRoute) {
            return undefined
        }
        return currentRoute
    }, [pathProvider, routeProvider])

    const manageLicensesPath = useMemo(() => {
        if (targetGroup && targetGroup.trim().length > 0) {
            return '/licenses/group'
        }
        return '/licenses/group'
    }, [targetGroup])

    const logoutAction = useCallback(async () => {
        try {
            if (logoutUrl && typeof window !== 'undefined') {
                clearSession()
                window.location.href = logoutUrl
            }
        } catch (error) {
            console.error(error)
        }
    }, [clearSession, logoutUrl])

    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <RenderIf isTrue={Boolean(isRoot || !isSysAdmin) }>
                    <HomeHeader />
                </RenderIf>
                <RenderIf isTrue={Boolean(!isRoot)}>
                    <header className="bg-background/40 flex shrink-0 items-center justify-between px-4 transition-[width,height] h-[--header-height] md:peer-data-[state=collapsed]:h-[calc(var(--header-height)-4px)] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b border-border backdrop-blur-md sticky z-50 top-0 md:rounded-tl-xl md:rounded-tr-xl">
                        {/* Left side: Sidebar trigger + title */}
                        <div className="flex items-center gap-2">
                            <HiddenSidebarTrigger />
                        </div>
                        {/* Right side: header actions */}
                        <div className="flex items-center gap-2">
                            <Button onClick={() => navigate(manageLicensesPath)}>
                                My Licenses
                            </Button>
                            <Button variant="ghost" size="icon" onClick={logoutAction}>
                                <LogOut />
                            </Button>
                        </div>
                    </header>
                </RenderIf>
                <div className="p-4">
                    <div className="h-full space-y-4">
                        <div className="flex shrink-0 items-center justify-between w-full transition-[width,height] ease-linear">
                            <div className="flex items-center gap-4">
                                <RenderIf isTrue={canGoBack()}>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={(event) => {
                                            event.preventDefault()
                                            if (currentRoute && currentRoute.backPath) {
                                                const backPath = currentRoute.backPath(authContext)
                                                navigate(backPath)
                                                return
                                            }
                                            goBack()
                                        }}
                                    >
                                        <ChevronLeft />
                                    </Button>
                                </RenderIf>
                                <h1 className="text-xl font-medium tracking-tight lg:text-2xl">{getTitle()}</h1>
                            </div>
                            <div className="flex items-center gap-2">
                                {mainActionsProvider.getMainActions(authContext, getCurrentPath()).map((next) => {
                                    const variant = next.variant ? next.variant : 'default'
                                    return (
                                        <Button
                                            key={next.label}
                                            onClick={(event: React.MouseEvent<HTMLElement>) => {
                                                event.preventDefault()
                                                next.action(authContext)
                                            }}
                                            variant={variant}
                                        >
                                            {next.icon} {next.label}
                                        </Button>
                                    )
                                })}
                            </div>
                        </div>
                        <div className="w-full">
                            {isRoot ? dashboardContentProvider.getHomeDashboard().getContent(authContext) : <Outlet />}
                        </div>
                    </div>
                </div>
                <RenderIf isTrue={Boolean(isRoot)}>
                    <HomeFooter />
                </RenderIf>
            </SidebarInset>
        </SidebarProvider>
    )
}

export const PlainLayout: React.FC = ({}) => {
    const location = useLocation()
    const dashboardContentProvider = useDashboardContentProvider()
    const { user, targetGroup, isSysAdmin } = useContext(SessionContext)
    const navigate = useNavigate()
    const authContext = useContext(SessionContext)
    const routeProvider = useRoutesProvider()
    const isRoot = useMemo(() => location.pathname === '/', [location.pathname])
    const refreshTick = useAppSelector((state) => state.groupContext.refreshTick)
    const mainActionsProvider = useMainActionProvider()
    const goBack = useSmartBack()
    const { userId } = useParams<{ userId?: string }>()
    const [isClient, setClient] = React.useState(false)

    const pathProvider = useMemo<PathProvider>(
        () => ({
            getCurrentPath: () => {
                const flatRoutes = routeProvider.getFlatRoutes()
                const exactMatch = flatRoutes.find((route) => route.path === location.pathname)
                if (exactMatch) {
                    return exactMatch.path
                }
                const matchingRoute = flatRoutes
                    .map((route) => route.path)
                    .find((routePath) => match(routePath)(location.pathname))
                return matchingRoute ?? location.pathname
            },
        }),
        [location.pathname, routeProvider]
    )

    const canGoBack = useCallback(() => {
        if (!pathProvider) {
            return false
        }
        const currentPath = pathProvider.getCurrentPath()
        const currentRoute = routeProvider.getRoute(currentPath)
        if (!currentRoute) {
            return false
        }
        return currentRoute.canGoBack || false
    }, [pathProvider, routeProvider, user, userId])

    const getCurrentPath = useCallback(() => {
        if (!pathProvider) {
            return ''
        }
        return pathProvider.getCurrentPath()
    }, [pathProvider, routeProvider])

    const getTitle = useCallback(() => {
        if (isRoot || !isClient) {
            return ''
        }
        if (!pathProvider) {
            return DASHBOARD_TITLE
        }
        const currentPath = pathProvider.getCurrentPath()
        const currentRoute = routeProvider.getRoute(currentPath)
        if (!currentRoute) {
            return DASHBOARD_TITLE
        }
        if (currentRoute.nameProvider) {
            return currentRoute.nameProvider(authContext)
        }
        return currentRoute.name
    }, [pathProvider, routeProvider, refreshTick, user, authContext, isRoot, isClient])

    const currentRoute = useMemo(() => {
        if (!pathProvider) {
            return undefined
        }
        const currentPath = pathProvider.getCurrentPath()
        if (!currentPath) {
            return undefined
        }
        const currentRoute = routeProvider.getRoute(currentPath)
        if (!currentRoute) {
            return undefined
        }
        return currentRoute
    }, [pathProvider, routeProvider])

    useEffect(() => {
        if (isSysAdmin && user && user.groups && user.groups.length > 0 && !targetGroup) {
            navigate('/group/selection')
        }
    }, [refreshTick, user, navigate, targetGroup, isSysAdmin])

    useEffect(() => {
        if (!document) {
            return
        }
        const yearEl = document.getElementById('year')
        if (!yearEl) {
            return
        }
        yearEl.textContent = new Date().getFullYear().toString()
    }, [])

    useEffect(() => {
        setClient(true)
    }, [])

    return (
        <div>
            <HomeHeader />
            <RenderIf isTrue={Boolean(!isRoot)}>
                <div className="p-4">
                    <div className="h-full space-y-4">
                        <div className="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
                            <div className="flex shrink-0 items-center justify-between w-full transition-[width,height] ease-linear">
                                <div className="flex items-center gap-4">
                                    <RenderIf isTrue={canGoBack()}>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={(event) => {
                                                event.preventDefault()
                                                if (currentRoute && currentRoute.backPath) {
                                                    const backPath = currentRoute.backPath(authContext)
                                                    navigate(backPath)
                                                    return
                                                }
                                                goBack()
                                            }}
                                        >
                                            <ChevronLeft />
                                        </Button>
                                    </RenderIf>
                                    <h1 className="text-xl font-medium tracking-tight lg:text-2xl">{getTitle()}</h1>
                                </div>
                                <RenderIf isTrue={Boolean(isClient)}>
                                    <div className="flex items-center gap-2">
                                        {mainActionsProvider
                                            .getMainActions(authContext, getCurrentPath())
                                            .map((next) => {
                                                const variant = next.variant ? next.variant : 'default'
                                                return (
                                                    <Button
                                                        key={next.label}
                                                        onClick={(event: React.MouseEvent<HTMLElement>) => {
                                                            event.preventDefault()
                                                            next.action(authContext)
                                                        }}
                                                        variant={variant}
                                                    >
                                                        {next.icon} {next.label}
                                                    </Button>
                                                )
                                            })}
                                    </div>
                                </RenderIf>
                            </div>
                        </div>
                    </div>
                </div>
            </RenderIf>
            <div>
                <RenderIf isTrue={Boolean(isRoot)}>
                    {dashboardContentProvider.getHomeDashboard().getContent(authContext)}
                </RenderIf>
                <RenderIf isTrue={Boolean(!isRoot)}>
                    <div className="px-4 pb-16 mx-auto max-w-7xl sm:px-6 lg:px-8">
                        <Outlet />
                    </div>
                </RenderIf>
            </div>
            {/* Footer */}
            <HomeFooter />
        </div>
    )
}

interface HomeComponentProps {
    queryClient?: QueryClient
}

export const HomeComponent: React.FC<HomeComponentProps> = ({ queryClient }) => {
    const { user, isSysAdmin } = useContext(SessionContext)
    const navigate = useNavigate()
    const resolvedQueryClient = queryClient ?? getOrCreateQueryClient()
    const dehydrated = typeof window !== 'undefined' ? (window as any).__PRERENDER_QUERY__ : undefined

    const shouldUsePlain = useMemo(() => {
        if (!user) {
            return true
        }
        return !isSysAdmin
    }, [user, isSysAdmin])

    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const next = params.get('next')
        if (next && next.length > 0) {
            navigate(next)
        }
    }, [navigate])

    if (shouldUsePlain) {
        return (
            <QueryClientProvider client={resolvedQueryClient}>
                <Hydrate state={dehydrated}>
                    <PlainLayout />
                    <Toaster />
                    <ReactQueryDevtools initialIsOpen={false} />
                </Hydrate>
            </QueryClientProvider>
        )
    }

    return (
        <QueryClientProvider client={resolvedQueryClient}>
            <SideBarAppLayout />
            <Toaster />
            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    )
}
