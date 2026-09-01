import { put } from "@vercel/blob";

// Mismo hosting donde ya viven las demás imágenes del dashboard (gycqduihf0vkjbnu.public.blob.vercel-storage.com)
// — put() lee BLOB_READ_WRITE_TOKEN de las variables de entorno automáticamente, no hace falta pasarlo.
// "public" porque el Dashboard necesita mostrar estas imágenes sin pedir sesión de la wiki de origen.
export async function subirImagenABlob(nombre: string, buffer: Buffer, contentType: string): Promise<string> {
    const blob = await put(`sig-actualizaciones/${nombre}`, buffer, {
        access: "public",
        contentType,
        addRandomSuffix: true,
    });
    return blob.url;
}
