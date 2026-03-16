import { Router } from './src/lib.js'

// Initialize router with options
const router = new Router(null, {
    useHistory: false,      // Set to true for history API instead of hash
    scrollToTop: true,      // Auto scroll to top on navigation
})

// ========== Route Definitions ==========

router.route("/", () => `
    <h1>🏠 Home</h1>
    <p>Welcome to the enhanced ParvumRoute router!</p>
    <div class="info-box">
        <strong>Features included:</strong>
        <ul>
            <li>✅ Route Parameters (/user/:id)</li>
            <li>✅ Query String Parsing (?page=2&sort=name)</li>
            <li>✅ Active Link Detection</li>
            <li>✅ Route Guards/Middleware (Global & Per-Route)</li>
            <li>✅ Lifecycle Hooks (beforeRoute, beforeLeave, afterRoute, onLeave)</li>
            <li>✅ Nested/Child Routes (fully functional)</li>
            <li>✅ History API Support</li>
            <li>✅ Error Boundaries</li>
            <li>✅ Route Aliases & Redirects</li>
            <li>✅ Wildcard Routes (/admin/*)</li>
            <li>✅ Route Metadata</li>
        </ul>
    </div>
`, { meta: { title: 'Home', requiresAuth: false } })

router.route("/about", () => `
    <h1>ℹ️ About</h1>
    <p>ParvumRoute is a minimal, powerful client-side router for SPAs.</p>
    <p><strong>Parvum</strong> = "small" in Latin</p>
`, { meta: { title: 'About', requiresAuth: false } })

// ========== Route with Parameters ==========

router.route("/user/:id", (params) => `
    <h1>👤 User Profile</h1>
    <div class="info-box">
        <strong>Route Parameters:</strong>
        <div class="param"><code>id: ${params.id}</code></div>
    </div>
    <p>This page demonstrates route parameter extraction from the URL.</p>
`, { meta: { title: 'User Profile', requiresAuth: true } })

// Add per-route guard for protected route
router.routeGuard("/user/:id", async (path) => {
    const isAuthenticated = true // Simulated auth check
    if (!isAuthenticated) {
        console.warn("❌ Access denied: User not authenticated")
        return false
    }
    console.log("✅ Access granted to protected route")
    return true
})

// ========== Nested/Child Routes ==========

router.route("/dashboard", () => `
    <h1>📊 Dashboard</h1>
    <div class="info-box">
        <strong>This route now has fully functional child routes!</strong>
        <p>Try: <a href="#/dashboard/overview" router-link="/dashboard/overview">Overview</a> | 
           <a href="#/dashboard/settings" router-link="/dashboard/settings">Settings</a></p>
    </div>
    <p>Main dashboard content goes here.</p>
`, { meta: { title: 'Dashboard', requiresAuth: true } })

router.child("/dashboard", "/overview", () => `
    <h2>📈 Dashboard Overview</h2>
    <p>Overview child route content. This now properly resolves and renders!</p>
`)

router.child("/dashboard", "/settings", () => `
    <h2>⚙️ Dashboard Settings</h2>
    <p>Settings child route content. Navigate freely between nested routes.</p>
`)

// ========== Wildcard Routes ==========

router.route("/admin/*", () => `
    <h1>🔐 Admin Panel</h1>
    <div class="info-box">
        <strong>Wildcard Route Example</strong>
        <p>This matches /admin/* - any path starting with /admin/</p>
        <p>Examples: /admin/users, /admin/settings, /admin/logs, /admin/anything</p>
    </div>
    <p>Secure admin content here.</p>
`, { meta: { title: 'Admin', requiresAuth: true, role: 'admin' } })

// ========== 404 Route ==========

router.route("/404", () => `
    <h1>❌ 404 - Page Not Found</h1>
    <p>The page you're looking for doesn't exist.</p>
`)

// ========== Route Aliases ==========

router.alias("/home", "/")
router.alias("/info", "/about")

// ========== Route Redirects ==========

router.redirect("/old-about", "/about")

// ========== Lifecycle Hooks ==========

router.beforeRoute((path, params, query, meta) => {
    console.log(`🔄 Navigating to: ${path}`, { params, query, meta })
})

// beforeLeave hook - can prevent navigation
router.beforeLeave((previousPath) => {
    console.log(`❓ Are you sure you want to leave ${previousPath}?`)
    // Return false to prevent navigation
    // return false
    return true // Allow navigation
})

router.afterRoute((path, params, query, meta) => {
    console.log(`✅ Rendered: ${path}`)
    document.title = `ParvumRoute - ${path}`
})

router.onLeave((previousPath) => {
    console.log(`👋 Left: ${previousPath}`)
})

// ========== Global Route Guards ==========

// Example: Global guard to check authentication
router.guard(async (path) => {
    // Example: Block navigation to protected routes if not authenticated
    // Uncomment to test:
    /*
    if (path.includes("admin")) {
        console.warn("❌ Access denied: Admin routes require authentication")
        return false
    }
    */
    return true
})

// ========== Error Handling ==========

router.onError((error) => {
    console.error("Router error:", error)
    router.root.innerHTML = `
        <h1>⚠️ Navigation Error</h1>
        <p>${error.message}</p>
        <p><a href="#/">Return to Home</a></p>
    `
})

// ========== Start Router ==========

router.start()

// ========== Example: Programmatic Navigation ==========

window.navigateTo = (path, options = {}) => {
    router.navigate(path, options)
}

window.navigateReplace = (path) => {
    router.navigate(path, { replace: true })
}

// ========== Example: Get Current Route Info ==========

window.getCurrentRoute = () => {
    return router.getRoute()
}

// Add to window for console testing
window.router = router
console.log("Router available at window.router")
console.log("Try: window.navigateTo('/user/jane?tab=messages')")
console.log("Or: window.getCurrentRoute()")

