# ParvumRoute - Lightweight SPA Router

A minimal yet powerful client-side router for Single Page Applications.

## 🚀 Features

- ✅ **Route Parameters** - Dynamic routes with `:param` syntax
- ✅ **Query String Parsing** - Automatic URL search parameter extraction
- ✅ **Active Link Detection** - Auto-highlight current route in navigation
- ✅ **Global & Per-Route Guards** - Middleware for route protection
- ✅ **Lifecycle Hooks** - `beforeRoute`, `beforeLeave`, `afterRoute`, `onLeave`
- ✅ **Nested/Child Routes** - Hierarchical route organization
- ✅ **Wildcard Routes** - Match routes with `/admin/*` patterns
- ✅ **Route Metadata** - Attach custom data to routes
- ✅ **History API Support** - Choose between hash-based or history API routing
- ✅ **Error Boundaries** - Custom error handling
- ✅ **Route Aliases & Redirects** - Path aliasing and 301-style redirects
- ✅ **No Dependencies** - Pure vanilla JavaScript

## 📦 Installation

```html
<script type="module">
  import { Router } from './src/lib.js';
  const router = new Router();
</script>
```

## 🎯 Basic Usage


### Initialize the Router

```javascript
import { Router } from './src/lib.js';

const router = new Router(null, {
  useHistory: false,    // Use hash-based routing (default)
  scrollToTop: true     // Auto-scroll to top on navigation
});
```

### Define Routes

```javascript
// Simple route
router.route("/", () => "<h1>Home</h1>");

// Route with dynamic parameters
router.route("/user/:id", (params) => {
  return `<h1>User: ${params.id}</h1>`;
});

// Route with multiple parameters
router.route("/post/:id/comment/:commentId", (params) => {
  return `Post ${params.id}, Comment ${params.commentId}`;
});

// Multiple routes at once
router.routes([
  { path: "/about", view: () => "<h1>About</h1>" },
  { path: "/contact", view: () => "<h1>Contact</h1>" }
]);
```

### Start the Router

```javascript
router.start();
```

### Navigation in HTML

```html
<nav>
  <a href="#/" router-link="/">Home</a>
  <a href="#/about" router-link="/about">About</a>
  <a href="#/user/123" router-link="/user/123">User 123</a>
</nav>
```

The `router-link` attribute automatically:
- Prevents default navigation
- Updates the URL
- Renders the matching route
- Adds `router-active` class to active link

---

## 🔧 Advanced Features

### 1. **Nested/Child Routes** (Now Fully Functional)

Create hierarchical route structures with parent and child routes.

```javascript
// Parent route
router.route("/dashboard", () => `
  <h1>Dashboard</h1>
  <p>Main dashboard content</p>
`);

// Child routes
router.child("/dashboard", "/overview", () => `
  <h2>Dashboard Overview</h2>
  <p>Analytics and stats</p>
`);

router.child("/dashboard", "/settings", () => `
  <h2>Dashboard Settings</h2>
  <p>User preferences</p>
`);
```

Navigate to child routes:
```html
<a router-link="/dashboard/overview">Overview</a>
<a router-link="/dashboard/settings">Settings</a>
```

### 2. **Wildcard Routes**

Match multiple routes with a single pattern using `/*` syntax.

```javascript
// Matches /admin, /admin/users, /admin/settings, etc.
router.route("/admin/*", (params) => `
  <h1>Admin Panel</h1>
  <p>Secure content</p>
`);

// With metadata
router.route("/api/*", () => `
  <h1>API Documentation</h1>
`, { 
  meta: { 
    title: 'API Docs',
    public: true 
  } 
});
```

### 3. **Route Metadata**

Attach custom data to routes for SEO, access control, or other purposes.

```javascript
router.route("/about", () => `<h1>About</h1>`, {
  meta: {
    title: "About Us",
    description: "Learn about our company",
    requiresAuth: false,
    role: "public"
  }
});

router.route("/admin/users", () => `<h1>User Management</h1>`, {
  meta: {
    title: "User Management",
    requiresAuth: true,
    role: "admin"
  }
});
```

Access route metadata in hooks:

```javascript
router.beforeRoute((path, params, query, meta) => {
  console.log("Route metadata:", meta);
  document.title = meta.title || "App";
});
```

Get current route info:

```javascript
const route = router.getRoute();
console.log(route.meta); // { title: "About Us", ... }
```

### 4. **Per-Route Guards** (Route-Specific Middleware)

Protect individual routes with custom validation logic.

```javascript
// Global guard - checks all routes
router.guard(async (path) => {
  // Return false to prevent navigation
  return true;
});

// Per-route guard - only checks specific route
router.routeGuard("/dashboard", async (path) => {
  const isAuthenticated = await checkAuth();
  if (!isAuthenticated) {
    console.warn("Access denied: authentication required");
    return false;
  }
  return true;
});

// Example: Protect multiple routes
const protectedRoutes = ["/dashboard", "/profile", "/settings"];
protectedRoutes.forEach(route => {
  router.routeGuard(route, async (path) => {
    return await isUserLoggedIn();
  });
});
```

### 5. **BeforeLeave Hooks** (Prevent Navigation)

Run validation before leaving a route and optionally prevent navigation.

```javascript
// Warn user about unsaved changes
router.beforeLeave(async (previousPath) => {
  const hasUnsavedChanges = checkUnsavedChanges();
  if (hasUnsavedChanges) {
    const confirmed = window.confirm(
      "You have unsaved changes. Leave anyway?"
    );
    return confirmed; // false prevents navigation
  }
  return true;
});
```

---

## 🔄 Lifecycle Hooks

Lifecycle hooks execute in this order during navigation:

1. **beforeLeave** - Can prevent navigation (return false)
2. **beforeRoute** - Runs before rendering
3. **render** - Route component renders
4. **afterRoute** - Runs after rendering
5. **onLeave** - Runs when leaving the route

```javascript
router.beforeLeave((previousPath) => {
  console.log(`About to leave: ${previousPath}`);
  return true; // Return false to prevent navigation
});

router.beforeRoute((path, params, query, meta) => {
  console.log(`Navigating to: ${path}`);
});

router.afterRoute((path, params, query, meta) => {
  console.log(`Rendered: ${path}`);
  document.title = meta.title || "App";
});

router.onLeave((previousPath) => {
  console.log(`Left: ${previousPath}`);
});
```

---

## 🛡️ Route Guards & Middleware

### Global Guards

```javascript
router.guard(async (path) => {
  // Block admin routes for non-admins
  if (path.includes("/admin")) {
    const isAdmin = await checkAdminStatus();
    if (!isAdmin) return false;
  }
  return true;
});
```

### Per-Route Guards

```javascript
router.routeGuard("/admin/*", async (path) => {
  return await hasAdminRole();
});

router.routeGuard("/user/profile", async (path) => {
  return await isAuthenticated();
});
```

### Multiple Guards

Guards execute in order and all must pass:

```javascript
// Global guard 1
router.guard(async (path) => true);

// Global guard 2
router.guard(async (path) => true);

// Per-route guard
router.routeGuard("/protected", async (path) => true);
```

---

## 🔗 Query Strings & Parameters

### Route Parameters

```javascript
router.route("/user/:id/post/:postId", (params) => {
  return `User ${params.id}, Post ${params.postId}`;
});
```

Navigate to: `#/user/123/post/456`

### Query Strings

```javascript
// URL: #/search?q=routers&sort=date
router.route("/search", (params, query) => {
  return `
    <h1>Search</h1>
    <p>Searching for: ${query.q}</p>
    <p>Sort by: ${query.sort}</p>
  `;
});
```

Navigate to: `#/search?q=routers&sort=date`

### Access Query in Hooks

```javascript
router.beforeRoute((path, params, query) => {
  console.log("Params:", params);
  console.log("Query:", query);
});
```

---

## 🔄 Aliases & Redirects

### Route Aliases

Create alternative paths to the same route:

```javascript
// Both paths render the same content
router.alias("/home", "/");
router.alias("/info", "/about");

// Navigate with either path
router.navigate("/home");      // Same as "/"
router.navigate("/info");      // Same as "/about"
```

### Route Redirects

Redirect old URLs to new ones:

```javascript
router.redirect("/old-page", "/new-page");
router.redirect("/v1/api", "/v2/api");

// Navigate to old URL → redirects to new URL
router.navigate("/old-page"); // → /new-page
```

---

## 🎨 Active Link Detection

Links with `router-link` attribute automatically get the `router-active` class:

```html
<nav>
  <a href="#/" router-link="/">Home</a>
  <a href="#/about" router-link="/about">About</a>
</nav>
```

```css
a.router-active {
  background: #007bff;
  color: white;
  font-weight: bold;
}
```

---

## 🚦 Navigation Methods

### HTML Links

```html
<a href="#/page" router-link="/page">Navigate</a>
```

### Programmatic Navigation

```javascript
// Simple navigation
router.navigate("/about");

// Navigation with options
router.navigate("/page", { replace: true });

// Replace current history entry (no back button)
router.navigate("/page", { replace: true });
```

### API Methods

```javascript
// Get current route
const route = router.getRoute();
// { path: '/user/123', params: {id: '123'}, query: {}, meta: {} }

// Programmatic navigation (exposed on window)
window.navigateTo("/about");
window.navigateTo("/user/123?tab=posts");

// Get current route info
window.getCurrentRoute();
```

---

## ⚙️ History API vs Hash Routing

### Hash-Based (Default)

```javascript
const router = new Router(null, { useHistory: false });
// URLs: http://example.com/#/about
```

**Pros:** Works without server config, works in older browsers  
**Cons:** Hash in URL, not SEO-friendly

### History API

```javascript
const router = new Router(null, { useHistory: true });
// URLs: http://example.com/about (clean URLs)
```

**Pros:** Clean URLs, SEO-friendly  
**Cons:** Requires server to serve index.html for all routes

### Server Configuration

For history API routing, configure your server to serve `index.html` for all routes:

**Express.js**
```javascript
app.use(express.static('public'));
app.get('*', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});
```

**Python (Flask)**
```python
@app.route('/') 
def index():
    return send_file('index.html')

@app.route('/<path:path>')
def catch_all(path):
    return send_file('index.html')
```

---

## 📋 Template Loading

Load HTML templates from files:

```javascript
router.route("/about", router.template("/templates/about.html"));

router.route("/user/:id", async (params) => {
  const template = await router.template("/templates/user.html")();
  return template; // Template strings can use params if modified
});
```

---

## ⚠️ Error Handling

### Default Error Handler

```javascript
try {
  await router.navigate("/page");
} catch (error) {
  // Error: Failed to fetch template, invalid route, etc.
}
```

### Custom Error Handler

```javascript
router.onError((error) => {
  console.error("Navigation error:", error);
  router.root.innerHTML = `
    <h1>Error</h1>
    <p>${error.message}</p>
    <a href="#/">Return to Home</a>
  `;
});
```

### 404 Fallback

```javascript
router.route("/404", () => `
  <h1>Page Not Found</h1>
  <p>The page you're looking for doesn't exist.</p>
`);

// Automatically shown if no route matches
```

---

## 🎯 Complete Example

```javascript
import { Router } from './src/lib.js';

// Initialize
const router = new Router(null, {
  useHistory: false,
  scrollToTop: true
});

// Routes
router.route("/", () => `<h1>Home</h1>`, {
  meta: { title: "Home", public: true }
});

router.route("/user/:id", (params) => `
  <h1>User ${params.id}</h1>
`, {
  meta: { title: "User Profile", requiresAuth: true }
});

router.child("/dashboard", "/settings", () => `
  <h2>Settings</h2>
`);

router.route("/admin/*", () => `
  <h1>Admin</h1>
`, {
  meta: { title: "Admin", role: "admin" }
});

// Guards
router.guard(async (path) => {
  if (path.includes("/admin")) {
    const isAdmin = await checkAdmin();
    return isAdmin;
  }
  return true;
});

// Hooks
router.beforeLeave((prev) => {
  if (unsavedChanges) {
    return confirm("Unsaved changes. Continue?");
  }
  return true;
});

router.beforeRoute((path, params, query, meta) => {
  console.log(`Going to ${meta.title}`);
});

// Start
router.start();
```

---

## 📝 API Reference

### Router Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `route(path, view, options)` | Register a route | `router` |
| `routes(list)` | Register multiple routes | `router` |
| `child(parent, path, view, options)` | Add nested route | `router` |
| `alias(from, to)` | Create route alias | `router` |
| `redirect(from, to)` | Redirect route | `router` |
| `guard(fn)` | Add global guard | `router` |
| `routeGuard(path, fn)` | Add per-route guard | `router` |
| `beforeRoute(fn)` | Before render hook | `router` |
| `beforeLeave(fn)` | Before navigation hook | `router` |
| `afterRoute(fn)` | After render hook | `router` |
| `onLeave(fn)` | Leave route hook | `router` |
| `onError(fn)` | Error handler | `router` |
| `navigate(path, options)` | Programmatic navigation | `Promise` |
| `start()` | Start listening for routes | `void` |
| `getRoute()` | Get current route info | `object` |

### Route Options

```javascript
{
  meta: {                    // Custom metadata
    title: string,
    description: string,
    requiresAuth: boolean,
    role: string,
    // ... any custom data
  }
}
```

### Hook Signatures

```javascript
// beforeLeave(fn)
fn(previousPath) => boolean  // false prevents navigation

// beforeRoute(fn)
fn(path, params, query, meta) => void | Promise

// afterRoute(fn)
fn(path, params, query, meta) => void | Promise

// onLeave(fn)
fn(previousPath) => void | Promise

// guard(fn), routeGuard(path, fn)
fn(path) => boolean | Promise<boolean>  // false blocks navigation
```

---

## 🐛 Browser Support

- Chrome 49+
- Firefox 45+
- Safari 10+
- Edge 14+
- IE 11 (with polyfills)

---

## 📄 License

MIT

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📚 Advanced Recipes

### Authentication Guard

```javascript
router.guard(async (path) => {
  const publicRoutes = ["/", "/about", "/login"];
  
  if (!publicRoutes.includes(path)) {
    const isLoggedIn = await checkAuth();
    if (!isLoggedIn) {
      router.navigate("/login");
      return false;
    }
  }
  return true;
});
```

### Role-Based Access Control

```javascript
router.beforeRoute((path, params, query, meta) => {
  if (meta.role) {
    const userRole = getCurrentUserRole();
    if (userRole !== meta.role) {
      router.navigate("/403");
    }
  }
});
```

### Analytics Tracking

```javascript
router.afterRoute((path, params, query, meta) => {
  analytics.track("page_view", {
    path: path,
    title: meta.title
  });
});
```

### Unsaved Changes Warning

```javascript
let unsavedChanges = false;

document.addEventListener("input", () => {
  unsavedChanges = true;
});

router.beforeLeave((prev) => {
  if (unsavedChanges) {
    const confirmed = confirm("You have unsaved changes. Leave?");
    if (confirmed) unsavedChanges = false;
    return confirmed;
  }
  return true;
});
```
