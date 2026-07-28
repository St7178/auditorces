import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ExternalLink } from "lucide-react";

/** Render de markdown para mensajes de chat (CES Guardian, Chat Wiki): enlaces clicables que
 * abren en pestaña nueva, imágenes cargadas inline, tablas, listas, código, etc. */
export function ChatMarkdown({ text }: { text: string }) {
    return (
        <div className="text-sm leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    a: ({ href, children }) => (
                        <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-medium text-brand underline underline-offset-2 hover:text-brand/80"
                        >
                            {children}
                            <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                    ),
                    img: ({ src, alt }) => (
                        <a href={typeof src === "string" ? src : undefined} target="_blank" rel="noopener noreferrer" className="my-2 block">
                            <img
                                src={typeof src === "string" ? src : undefined}
                                alt={alt || "Imagen"}
                                loading="lazy"
                                className="max-h-80 w-auto max-w-full rounded-lg border object-contain"
                            />
                        </a>
                    ),
                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                    ul: ({ children }) => <ul className="mb-2 ml-4 list-disc space-y-1 last:mb-0">{children}</ul>,
                    ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal space-y-1 last:mb-0">{children}</ol>,
                    li: ({ children }) => <li>{children}</li>,
                    h1: ({ children }) => <h3 className="mb-1.5 mt-3 text-base font-bold first:mt-0">{children}</h3>,
                    h2: ({ children }) => <h4 className="mb-1.5 mt-3 text-sm font-bold first:mt-0">{children}</h4>,
                    h3: ({ children }) => <h5 className="mb-1 mt-2 text-sm font-semibold first:mt-0">{children}</h5>,
                    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                    code: ({ children, className }) => {
                        if (className?.includes("language-")) {
                            return <pre className="my-2 overflow-x-auto rounded-lg bg-muted p-3 text-xs"><code>{children}</code></pre>;
                        }
                        return <code className="rounded bg-muted px-1 py-0.5 text-xs">{children}</code>;
                    },
                    blockquote: ({ children }) => (
                        <blockquote className="my-2 border-l-2 border-brand/40 pl-3 text-muted-foreground italic">{children}</blockquote>
                    ),
                    table: ({ children }) => (
                        <div className="my-2 overflow-hidden overflow-x-auto rounded-lg border">
                            <table className="w-full text-xs">{children}</table>
                        </div>
                    ),
                    thead: ({ children }) => <thead className="bg-muted/40 text-[10px] uppercase tracking-wide text-muted-foreground">{children}</thead>,
                    th: ({ children }) => <th className="px-2 py-1.5 text-left">{children}</th>,
                    td: ({ children }) => <td className="border-t px-2 py-1.5">{children}</td>,
                    hr: () => <hr className="my-3 border-border" />,
                }}
            >
                {text}
            </ReactMarkdown>
        </div>
    );
}
