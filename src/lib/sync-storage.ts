import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data", "sync");

async function ensureDir() {
    await fs.promises.mkdir(DATA_DIR, { recursive: true });
}

async function writeFile(name: string, data: unknown) {
    await ensureDir();
    const file = path.join(DATA_DIR, name);
    await fs.promises.writeFile(file, JSON.stringify(data, null, 2), "utf8");
}

async function readFile<T>(name: string): Promise<T | null> {
    try {
        const file = path.join(DATA_DIR, name);
        const txt = await fs.promises.readFile(file, "utf8");
        return JSON.parse(txt) as T;
    } catch (err) {
        return null;
    }
}

export async function saveClientes(data: unknown) {
    return writeFile("clientes.json", data);
}

export async function getClientes<T>(): Promise<T | null> {
    return readFile<T>("clientes.json");
}

export async function saveContratos(data: unknown) {
    return writeFile("contratos.json", data);
}

export async function getContratos<T>(): Promise<T | null> {
    return readFile<T>("contratos.json");
}

export default { saveClientes, getClientes, saveContratos, getContratos };
