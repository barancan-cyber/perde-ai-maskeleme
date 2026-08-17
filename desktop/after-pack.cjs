const { execFileSync } = require("node:child_process");
const path = require("node:path");

module.exports = async function afterPack(context) {
  if (context.electronPlatformName !== "darwin") return;

  const appName = `${context.packager.appInfo.productFilename}.app`;
  const appPath = path.join(context.appOutDir, appName);

  // Apple Developer sertifikası olmayan açık kaynak dağıtımlarda en azından
  // paketin tamamını mühürle. Bu, macOS'un eksik imzayı "hasarlı" sanmasını
  // engeller; Gatekeeper yine sağ tık → Aç onayı isteyebilir.
  execFileSync("codesign", ["--force", "--deep", "--sign", "-", appPath], {
    stdio: "inherit",
  });
};
