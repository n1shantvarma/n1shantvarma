declare const require: any;
declare const process: any;

const { exec } = require("child_process");

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type Action =
  | { type: "hotkey"; keys: string[] }
  | { type: "delay"; ms: number }
  | { type: "type"; text: string }
  | { type: "command"; command: string };

const testAction: Action[] = [
  { type: "hotkey", keys: ["Ctrl", "Shift", "S"] },
  { type: "delay", ms: 500 },
  { type: "type", text: "Hello" },
  { type: "command", command: "echo done" },
];

function runCommand(command: string): Promise<void> {
  return new Promise((resolve, reject) => {
    exec(command, (error: any, stdout: string, stderr: string) => {
      if (error) {
        reject(error);
        return;
      }
      if (stdout.trim()) console.log(stdout.trim());
      if (stderr.trim()) console.error(stderr.trim());
      resolve();
    });
  });
}

async function runAction(action: Action): Promise<void> {
  switch (action.type) {
    case "hotkey":
      console.log(`Hotkey: ${action.keys.join(" + ")}`);
      return;
    case "delay":
      await delay(action.ms);
      return;
    case "type":
      console.log(`Type: ${action.text}`);
      return;
    case "command":
      await runCommand(action.command);
      return;
  }
}

async function main() {
  const runs = 50;

  for (let i = 1; i <= runs; i += 1) {
    console.log(`\nRun ${i}/${runs}`);
    for (const action of testAction) {
      await runAction(action);
    }
  }

  console.log("\nEngine stable ✅");
}

main().catch((error: unknown) => {
  console.error("Engine unstable ❌", error);
  process.exit(1);
});
