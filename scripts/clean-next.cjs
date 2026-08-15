/* Removes Next build output (.next and cloud-sync escape dir). */
require("./remove-next-link.cjs");
const { cleanNextDirs } = require("./next-dist-dir.cjs");

cleanNextDirs();
