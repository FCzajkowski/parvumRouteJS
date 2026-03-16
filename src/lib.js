export class Router {

    constructor(root, options = {}) {
        this.root = document.body.appendChild(document.createElement("div"));
        this.root.id = "parvumApp"
        this.routesMap = new Map()
        this.aliases = new Map()
        this.redirects = new Map()
        this.guards = []
        this.currentPath = ""
        this.currentParams = {}
        this.currentQuery = {}
        this.currentMeta = {}
        this.useHistory = options.useHistory || false
        this.scrollToTop = options.scrollToTop !== false
        
        // Lifecycle hooks
        this.beforeRouteHooks = []
        this.beforeLeaveHooks = []
        this.afterRouteHooks = []
        this.onLeaveHooks = []
        
        // Error handler
        this.errorHandler = options.errorHandler || this.defaultErrorHandler.bind(this)
    }

    // ========== Route Registration ==========
    
    route(path, view, options = {}) {
        this.routesMap.set(path, { 
            view, 
            children: new Map(), 
            guards: [],
            meta: options.meta || {},
            ...options 
        })
        return this
    }

    routes(list) {
        for (const r of list) {
            this.route(r.path, r.view, r.options)
        }
        return this
    }

    // Add per-route guard (only executed for specific route)
    routeGuard(path, fn) {
        const route = this.routesMap.get(path)
        if (!route) {
            console.warn(`Route ${path} not found`)
            return this
        }
        route.guards.push(fn)
        return this
    }

    // Add child/nested routes
    child(parentPath, childPath, view, options = {}) {
        const parent = this.routesMap.get(parentPath)
        if (!parent) {
            console.warn(`Parent route ${parentPath} not found`)
            return this
        }
        parent.children.set(childPath, { 
            view, 
            guards: [],
            meta: options.meta || {},
            ...options 
        })
        return this
    }

    // ========== Route Aliases & Redirects ==========
    
    alias(from, to) {
        this.aliases.set(from, to)
        return this
    }

    redirect(from, to) {
        this.redirects.set(from, to)
        return this
    }

    // ========== Guards & Middleware ==========
    
    guard(fn) {
        this.guards.push(fn)
        return this
    }

    // ========== Lifecycle Hooks ==========
    
    beforeRoute(fn) {
        this.beforeRouteHooks.push(fn)
        return this
    }

    beforeLeave(fn) {
        this.beforeLeaveHooks.push(fn)
        return this
    }

    afterRoute(fn) {
        this.afterRouteHooks.push(fn)
        return this
    }

    onLeave(fn) {
        this.onLeaveHooks.push(fn)
        return this
    }

    // ========== Query String & Params Parsing ==========
    
    parseQuery(queryString) {
        const params = {}
        if (!queryString) return params
        new URLSearchParams(queryString).forEach((value, key) => {
            params[key] = value
        })
        return params
    }

    parseParams(pattern, path) {
        const patternParts = pattern.split('/')
        const pathParts = path.split('/')
        const params = {}

        // Handle wildcard routes (e.g., /admin/*)
        for (let i = 0; i < patternParts.length; i++) {
            if (patternParts[i] === '*') {
                // Wildcard matches everything from this point onwards
                return params
            }
        }

        if (patternParts.length !== pathParts.length) return null

        for (let i = 0; i < patternParts.length; i++) {
            if (patternParts[i].startsWith(':')) {
                params[patternParts[i].slice(1)] = pathParts[i]
            } else if (patternParts[i] !== pathParts[i]) {
                return null
            }
        }
        return params
    }

    matchRoute(path) {
        const [pathname, queryString] = path.split('?')
        
        // Check redirects
        if (this.redirects.has(pathname)) {
            return { redirectTo: this.redirects.get(pathname) }
        }

        // Check aliases
        const resolvedPath = this.aliases.get(pathname) || pathname

        // Exact match
        if (this.routesMap.has(resolvedPath)) {
            const route = this.routesMap.get(resolvedPath)
            return { 
                pattern: resolvedPath, 
                params: {}, 
                query: this.parseQuery(queryString),
                meta: route.meta,
                guards: route.guards,
                children: route.children
            }
        }

        // Pattern match with params (including wildcards)
        for (const [pattern, route] of this.routesMap) {
            const params = this.parseParams(pattern, resolvedPath)
            if (params !== null) {
                return { 
                    pattern, 
                    params, 
                    query: this.parseQuery(queryString),
                    meta: route.meta,
                    guards: route.guards,
                    children: route.children
                }
            }
        }

        // Check nested/child routes
        for (const [parentPattern, parentRoute] of this.routesMap) {
            for (const [childPath, childRoute] of parentRoute.children) {
                const fullPath = parentPattern + childPath
                
                // Exact match
                if (resolvedPath === fullPath) {
                    return {
                        pattern: fullPath,
                        params: {},
                        query: this.parseQuery(queryString),
                        meta: childRoute.meta,
                        guards: childRoute.guards,
                        isChild: true,
                        parent: parentPattern
                    }
                }

                // Pattern match with params
                const childPatternParts = childPath.split('/')
                const parentPatternParts = parentPattern.split('/')
                const fullPathParts = [...parentPatternParts, ...childPatternParts]
                const resolvedPathParts = resolvedPath.split('/')
                
                if (fullPathParts.length === resolvedPathParts.length) {
                    const params = {}
                    let matches = true

                    for (let i = 0; i < fullPathParts.length; i++) {
                        if (fullPathParts[i].startsWith(':')) {
                            params[fullPathParts[i].slice(1)] = resolvedPathParts[i]
                        } else if (fullPathParts[i] !== resolvedPathParts[i]) {
                            matches = false
                            break
                        }
                    }

                    if (matches) {
                        return {
                            pattern: fullPath,
                            params,
                            query: this.parseQuery(queryString),
                            meta: childRoute.meta,
                            guards: childRoute.guards,
                            isChild: true,
                            parent: parentPattern
                        }
                    }
                }
            }
        }

        return null
    }

    // ========== Navigation ==========
    
    async navigate(path, options = {}) {
        const { replace = false } = options

        // Handle redirects
        const match = this.matchRoute(path)
        if (match?.redirectTo) {
            return this.navigate(match.redirectTo, options)
        }

        // Run beforeLeave hooks (can prevent navigation)
        for (const hook of this.beforeLeaveHooks) {
            const result = await hook(this.currentPath)
            if (result === false) {
                console.warn(`Navigation to ${path} prevented by beforeLeave hook`)
                return
            }
        }

        // Run global guards
        for (const guard of this.guards) {
            const result = await guard(path)
            if (result === false) {
                console.warn(`Navigation to ${path} blocked by guard`)
                return
            }
        }

        // Run per-route guards
        if (match && match.guards && match.guards.length > 0) {
            for (const guard of match.guards) {
                const result = await guard(path)
                if (result === false) {
                    console.warn(`Navigation to ${path} blocked by route guard`)
                    return
                }
            }
        }

        // Run onLeave hooks
        for (const hook of this.onLeaveHooks) {
            await hook(this.currentPath)
        }

        // Update history
        if (this.useHistory) {
            if (replace) {
                window.history.replaceState({ path }, "", `${path}`)
            } else {
                window.history.pushState({ path }, "", `${path}`)
            }
        } else {
            location.hash = path
        }

        await this.render(path)
    }

    // ========== Rendering ==========
    
    async render(path) {
        try {
            const match = this.matchRoute(path)

            if (!match) {
                const fallback = this.routesMap.get("/404")
                if (fallback) {
                    await this.renderView(fallback.view)
                } else {
                    this.root.innerHTML = "<h1>404 - Page Not Found</h1>"
                }
                return
            }

            this.currentPath = match.pattern
            this.currentParams = match.params
            this.currentQuery = match.query
            this.currentMeta = match.meta || {}

            // Run beforeRoute hooks
            for (const hook of this.beforeRouteHooks) {
                await hook(path, match.params, match.query, match.meta)
            }

            const routeConfig = this.routesMap.get(match.pattern) || this.getNestedRoute(match.pattern)
            await this.renderView(routeConfig.view, match.params)

            // Update active links
            this.updateActiveLinks(path)

            // Run afterRoute hooks
            for (const hook of this.afterRouteHooks) {
                await hook(path, match.params, match.query, match.meta)
            }

            // Scroll to top
            if (this.scrollToTop) {
                window.scrollTo(0, 0)
            }

        } catch (error) {
            this.errorHandler(error)
        }
    }

    // Helper to get nested route config
    getNestedRoute(fullPath) {
        for (const [parentPattern, parentRoute] of this.routesMap) {
            for (const [childPath, childRoute] of parentRoute.children) {
                if (parentPattern + childPath === fullPath) {
                    return childRoute
                }
            }
        }
        return null
    }

    async renderView(view, params = {}) {
        let content

        if (typeof view === "function") {
            const result = view(params)
            content = result instanceof Promise ? await result : result
        } else {
            content = view
        }

        this.root.innerHTML = content
    }

    // ========== Active Link Detection ==========
    
    updateActiveLinks(currentPath) {
        const [basePath] = currentPath.split('?')
        document.querySelectorAll("[router-link]").forEach(link => {
            const href = link.getAttribute("router-link")
            const [linkPath] = href.split('?')
            link.classList.toggle("router-active", linkPath === basePath)
        })
    }

    // ========== Error Handling ==========
    
    defaultErrorHandler(error) {
        console.error("Navigation error:", error)
        this.root.innerHTML = `<h1>Error</h1><p>${error.message}</p>`
    }

    onError(fn) {
        this.errorHandler = fn
        return this
    }

    // ========== Utilities ==========
    
    start() {
        // Handle clicks on router links
        document.addEventListener("click", e => {
            const link = e.target.closest("[router-link]")
            if (!link) return

            e.preventDefault()
            this.navigate(link.getAttribute("router-link"))
        })

        // Handle history navigation
        if (this.useHistory) {
            window.addEventListener("popstate", (e) => {
                const path = e.state?.path || "/"
                this.render(path)
            })
        } else {
            window.addEventListener("hashchange", () => {
                const path = location.hash.slice(1) || "/"
                this.render(path)
            })
        }

        // Initial render
        const initialPath = this.useHistory 
            ? location.pathname 
            : location.hash.slice(1) || "/"
        this.render(initialPath)
    }

    template(path) {
        return async () => {
            const res = await fetch(path)
            if (!res.ok) throw new Error(`Failed to load template: ${path}`)
            return await res.text()
        }
    }

    // Get current route info
    getRoute() {
        return {
            path: this.currentPath,
            params: this.currentParams,
            query: this.currentQuery,
            meta: this.currentMeta
        }
    }
}
