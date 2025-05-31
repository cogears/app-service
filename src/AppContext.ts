import IAppContext from "types";
import InternalContext from "./core/InternalContext";
import { startup } from "./remote-shell";

export default class AppContext extends InternalContext implements IAppContext {
    startupRemoteShell(routePath: string = '/') {
        startup(this, routePath)
    }
}
