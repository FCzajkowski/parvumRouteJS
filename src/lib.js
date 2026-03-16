export class Router {

    constructor(root) {
        this.root = document.body.appendChild(document.createElement("div"));
        this.root.id = "parvumApp"
        this.routesMap = new Map()
    }

    route(path, view) {
        this.routesMap.set(path, view)
        return this
    }

    routes(list) {
        for (const r of list) {
            this.route(r.path, r.view)
        }
        return this
    }

    async render(path = location.hash.slice(1) || "/") {
        const view = this.routesMap.get(path) || this.routesMap.get("/404")

        if (!view) {
            this.root.innerHTML = "<h1>404</h1>"
            return
        }

        if (typeof view === "function") {
            const result = view()
            this.root.innerHTML = result instanceof Promise ? await result : result
        } else {
            this.root.innerHTML = view
        }
    }

    navigate(path) {
        location.hash = path
    }

    start() {

        document.addEventListener("click", e => {
            const link = e.target.closest("[router-link]")
            if (!link) return

            e.preventDefault()
            this.navigate(link.getAttribute("router-link"))
        })

        window.addEventListener("hashchange", () => {
            this.render()
        })

        this.render()
    }

    template(path) {
        return async () => {
            const res = await fetch(path)
            return await res.text()
        }
    }
}
