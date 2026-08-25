export const CLIENTE_LOGO: Record<string, string> = {
    "CONCONCRETO": "https://gycqduihf0vkjbnu.public.blob.vercel-storage.com/Logo%20Concocreto.png",
    "GRUPO RECORDAR": "https://gycqduihf0vkjbnu.public.blob.vercel-storage.com/Logo%20Grupo%20Recordar.png",
    "INCOLMOTOS": "https://gycqduihf0vkjbnu.public.blob.vercel-storage.com/Logo%20Incolmotos.png",
    "INDUPALMA": "https://gycqduihf0vkjbnu.public.blob.vercel-storage.com/LOGO_INDUPALMA.png",
    "INGENIO CARMELITA": "https://gycqduihf0vkjbnu.public.blob.vercel-storage.com/carmelita.png",
    "INGENIO RISARALDA": "https://gycqduihf0vkjbnu.public.blob.vercel-storage.com/INGENIORISARALDALOGO.png",
    "LEVAPAN": "https://gycqduihf0vkjbnu.public.blob.vercel-storage.com/LevapanLogo.png",
    "NUTRESA": "https://gycqduihf0vkjbnu.public.blob.vercel-storage.com/NUTRESALOGO.png",
    "PROTELA": "https://gycqduihf0vkjbnu.public.blob.vercel-storage.com/PROTELA.png",
    "SURTIALIMENTOS": "https://gycqduihf0vkjbnu.public.blob.vercel-storage.com/SURTIALIAMENTOSLOGO.png",
};

export function clienteLogo(nombre: string): string | undefined {
    return CLIENTE_LOGO[String(nombre || "").trim().toUpperCase()];
}
