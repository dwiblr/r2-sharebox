import { execSync } from "child_process";
import { existsSync, mkdirSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

export function takeScreenshot() {
  const dir = join(tmpdir(), "r2-sharebox");
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const outPath = join(dir, `screenshot-${Date.now()}.png`);
  const platform = process.platform;

  if (platform === "darwin") {
    execSync(`screencapture -x "${outPath}"`);
  } else if (platform === "linux") {
    // try common linux screenshot tools
    const tools = [
      `import -window root "${outPath}"`,
      `scrot "${outPath}"`,
      `gnome-screenshot -f "${outPath}"`,
    ];
    let captured = false;
    for (const cmd of tools) {
      try {
        execSync(cmd, { stdio: "ignore" });
        captured = true;
        break;
      } catch {}
    }
    if (!captured) {
      throw new Error(
        "No screenshot tool found. Install scrot, imagemagick, or gnome-screenshot."
      );
    }
  } else if (platform === "win32") {
    execSync(
      `powershell -command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Screen]::PrimaryScreen | ForEach-Object { $bmp = New-Object System.Drawing.Bitmap($_.Bounds.Width, $_.Bounds.Height); $g = [System.Drawing.Graphics]::FromImage($bmp); $g.CopyFromScreen($_.Bounds.Location, [System.Drawing.Point]::Empty, $_.Bounds.Size); $bmp.Save('${outPath}') }"`
    );
  } else {
    throw new Error(`Unsupported platform: ${platform}`);
  }

  if (!existsSync(outPath)) {
    throw new Error("Screenshot file was not created.");
  }

  return outPath;
}
