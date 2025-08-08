import fs from "fs";
import path from "path";
import net from "net";

function checkPort(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.createConnection({ port }, () => {
      socket.end();
      resolve(true);
    });
    socket.on("error", () => resolve(false));
    socket.setTimeout(1000, () => {
      socket.destroy();
      resolve(false);
    });
  });
}

async function main() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) {
    const content = "NEXT_PUBLIC_API_BASE=http://localhost:3001\nNEXT_PUBLIC_GRAPH_MODE=local\n";
    fs.writeFileSync(envPath, content);
    console.log("Created .env.local");
  } else {
    console.log(".env.local already exists");
  }

  const apiUp = await checkPort(3001);
  const pyUp = await checkPort(5001);

  if (!apiUp) {
    console.warn("Warning: API server not reachable on port 3001");
  }
  if (!pyUp) {
    console.warn("Warning: Python server not reachable on port 5001");
  }
}

main();
