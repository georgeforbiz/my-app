/**

 * Prints a one-time hint when the repo lives under a cloud-synced folder (OneDrive, etc.).

 */

const { isCloudSyncedProject } = require("./next-dist-dir.cjs");



if (!isCloudSyncedProject()) {

  process.exit(0);

}



// stderr so it does not look like part of Next.js stdout

console.warn(`

▸ Cloud-sync folder detected (OneDrive, etc.).

  White screen / missing JS? Use:  npm run dev:local

  (runs dev from C:\\dev\\vstah-am so .next is not synced/deleted).

  Or move the repo to C:\\dev\\ayoayo and run npm run dev there.

  Do not run "npm run build" while "npm run dev" is running.

`);

