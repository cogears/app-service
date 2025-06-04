import InternalContext from "./core/InternalContext.js";
import { startup } from "./remote-shell/index.js";

export default class AppContext extends InternalContext {
    startupRemoteShell(routePath: string = '/') {
        startup(this, routePath)
    }
}
