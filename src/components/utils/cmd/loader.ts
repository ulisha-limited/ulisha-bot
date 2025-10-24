import log from "../log";
import { promises as fs } from "fs";
import path from "path";
import { exec } from "child_process";
import LoadingBar from "../loadingBar";
import util from "util";
import { Message } from "../../../types/message";
const execPromise = util.promisify(exec);
const basePath = path.join(__dirname, "..", "..", "..", "commands");
import * as Sentry from "@sentry/node";

export const commandDirs = [basePath, path.join(basePath, "private")];
export interface Command {
  /** The actual command keyword the bot will listen for */
  command: string;

  /** A brief description of what the command does */
  description: string;

  /** How to use the command (syntax) */
  usage: string;

  /** Example usage of the command */
  example: string;

  /** Required role to use the command (e.g., 'admin', 'moderator') */
  role: string;

  /** Cooldown in seconds before the command can be reused */
  cooldown: number;

  /** Optional: set to true if you don't want AI to process this command */
  optOutAI?: boolean;

  /** Optional: add here the dependencies of your command if it's doesn't exists yet */
  dependencies?: string[];
}

interface InternalCommands extends Command {
  /** The function that will be executed when the command is called */
  exec: (msg: Message) => Promise<void>;
}
export const commands: Record<string, InternalCommands> = {};

async function ensureDependencies(
  dependencies: { name: string; version: string }[],
): Promise<void> {
  for (const dep of dependencies) {
    try {
      require.resolve(dep.name);
      log.info("Loader", `Dependency already installed: ${dep.name}`);
    } catch {
      log.info(
        "Loader",
        `Installing missing dependency: ${dep.name}@${dep.version}`,
      );
      try {
        const { stdout, stderr } = await execPromise(
          `npm install ${dep.name}@${dep.version}`,
        );
        if (stdout) log.info("npm", stdout);
        if (stderr) log.error("npm", stderr);
      } catch (err) {
        Sentry.captureException(err);
        log.error(
          "Loader",
          `Failed to install ${dep.name}@${dep.version}`,
          err,
        );
      }
    }
  }
}

export default async function loader(
  file: string,
  customPath: string,
): Promise<void> {
  try {
    if (/\.js$|\.ts$/.test(file)) {
      const filePath = path.join(customPath, file);

      const resolvedPath = path.resolve(filePath);
      if (require.cache[resolvedPath]) {
        delete require.cache[resolvedPath];
      }

      try {
        await fs.access(resolvedPath);
      } catch {
        return;
      }

      const commandModule = await import(filePath);

      if (
        typeof commandModule.default === "function" &&
        commandModule.info &&
        commandModule.info.command
      ) {
        if (Array.isArray(commandModule.info.dependencies)) {
          await ensureDependencies(commandModule.info.dependencies);
        }

        commands[commandModule.info.command] = {
          command: commandModule.info.command,
          description: commandModule.info.description || "No description",
          usage: commandModule.info.usage || "No usage",
          example: commandModule.info.example || "No example",
          role: commandModule.info.role || "user",
          cooldown: commandModule.info.cooldown || 5000,
          exec: commandModule.default,
        };
      }
    }
  } catch (err) {
    Sentry.captureException(err);
    log.error("Loader", `Failed to load: ${file}`, err);
  }
}

export async function mapCommands(): Promise<void> {
  let allFiles: [string, string][] = [];

  try {
    for (const dir of commandDirs) {
      try {
        await fs.access(dir);
        const files = await fs.readdir(dir);

        const validFiles = files.filter(
          (f) => f.endsWith(".js") || f.endsWith(".ts"),
        );

        const tuples: [string, string][] = validFiles.map(
          (f) => [f, dir] as [string, string],
        );

        allFiles = [...allFiles, ...tuples];
      } catch (err: any) {
        if (err.code === "ENOENT") {
          console.log("");
          log.warn("Loader", `Directory not found: ${dir}`);
        } else {
          console.log("");
          log.warn("Loader", `Error reading directory ${dir}:`, err);
        }
      }
    }

    const total = allFiles.length;
    if (total === 0) {
      log.info("Loader", "No commands found.");
      return;
    }

    const bar = LoadingBar(
      "Loading Commands | {bar} | {value}/{total} {command}",
    );
    bar.start(total, 0, { command: "" });

    for (const [file, dir] of allFiles) {
      try {
        await loader(file, dir);
        bar.increment({ command: file });
      } catch (err) {
        log.error("Loader", `Failed to load ${file}`, err);
        bar.increment({ command: file });
      }
    }

    bar.stop();
  } catch (err) {
    Sentry.captureException(err);
    log.error("Loader", "Failed to map commands:", err);
  }
}
