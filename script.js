import { Router } from "./src/lib.js";

const router = new Router(document.getElementById("app"));

router.routes([
    {
        path: "/",
        view: `
            <h1>Home</h1>
            <p>Welcome</p>
        `
    },
    {
        path: "/about",
        view: router.template("template.html")
    },
    {
        path: "/404",
        view: "<h1>404</h1>"
    }
])

router.start()