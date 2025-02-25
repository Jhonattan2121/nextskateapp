import { MarkdownRenderers } from "@/app/upload/utils/MarkdownRenderers";
import { autoEmbedZoraLink, transform3SpeakContent, transformEcencyImages, transformNormalYoutubeLinksinIframes, transformShortYoutubeLinksinIframes } from "@/lib/utils";
import React from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";

interface MarkdownRendererProps {
    key?: number | string;
    content: string;
    className?: string;
    renderers?: any;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ key, content, className, renderers = MarkdownRenderers }) => {
    const transformedContent = React.useMemo(() => {
        return autoEmbedZoraLink(
            transform3SpeakContent(
                transformEcencyImages(
                    transformNormalYoutubeLinksinIframes(
                        transformShortYoutubeLinksinIframes(content)
                    )
                )
            )
        );
    }, [content]);

    return (
        <div className={className}>
            <ReactMarkdown
                key={key ? key : "markdown-renderer"}
                components={renderers}
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
            >
                {transformedContent}
            </ReactMarkdown>
        </div>
    );
};

export default MarkdownRenderer;
