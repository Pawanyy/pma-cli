import path from "path";
import fs from "fs";

export function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function isValidUrl(url: string): boolean {
    try {
        new URL(url);
        return true;
    } catch (error) {
        return false;
    }
}

export function isValidFilePath(filePath: string): boolean {
    try {
        const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);

        fs.accessSync(absolutePath, fs.constants.F_OK | fs.constants.R_OK);

        const stats = fs.statSync(absolutePath);
        return stats.isFile();
    } catch (error) {
        return false;
    }
}

export function getValidFilePath(filePath: string): string | null {
    try {
        const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);

        fs.accessSync(absolutePath, fs.constants.F_OK | fs.constants.R_OK);

        const stats = fs.statSync(absolutePath);
        if (stats.isFile()) {
            return absolutePath;
        }
        return null;
    } catch (error) {
        return null;
    }
}