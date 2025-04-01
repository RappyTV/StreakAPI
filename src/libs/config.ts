import config from "../../config.json";
import { version } from "../../package.json";

export default {
    version,
    port: config.port,
    srv: config.srv,
    contact: config.contact
}