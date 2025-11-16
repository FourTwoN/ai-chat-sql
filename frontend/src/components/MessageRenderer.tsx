import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import mermaid from 'mermaid';

// Initialize mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
});

interface MessageRendererProps {
  content: string;
  role: 'user' | 'assistant' | 'system';
}

export const MessageRenderer: React.FC<MessageRendererProps> = ({ content, role }) => {
  const mermaidRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mermaidRef.current) {
      const mermaidDivs = mermaidRef.current.querySelectorAll('.mermaid-diagram');
      mermaidDivs.forEach(async (div, index) => {
        const code = div.textContent || '';
        try {
          const { svg } = await mermaid.render(`mermaid-${Date.now()}-${index}`, code);
          div.innerHTML = svg;
        } catch (error) {
          console.error('Mermaid rendering error:', error);
          div.innerHTML = `<pre class="text-red-500">Error rendering diagram: ${error}</pre>`;
        }
      });
    }
  }, [content]);

  return (
    <div
      ref={mermaidRef}
      className={`message-content ${
        role === 'user' ? 'text-gray-900' : 'text-gray-800'
      }`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          code(props) {
            const { node, className, children, ...rest } = props;
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            const inline = !className;

            if (!inline && language === 'mermaid') {
              return (
                <div className="mermaid-diagram my-4 flex justify-center">
                  {String(children).replace(/\n$/, '')}
                </div>
              );
            }

            if (!inline) {
              return (
                <pre className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 overflow-x-auto my-2">
                  <code className={className} {...rest}>
                    {children}
                  </code>
                </pre>
              );
            }

            return (
              <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded" {...rest}>
                {children}
              </code>
            );
          },
          table({ children }) {
            return (
              <div className="overflow-x-auto my-4">
                <table className="min-w-full divide-y divide-gray-300 border border-gray-300">
                  {children}
                </table>
              </div>
            );
          },
          thead({ children }) {
            return <thead className="bg-gray-50 dark:bg-gray-700">{children}</thead>;
          },
          tbody({ children }) {
            return <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200">{children}</tbody>;
          },
          tr({ children }) {
            return <tr>{children}</tr>;
          },
          th({ children }) {
            return (
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                {children}
              </th>
            );
          },
          td({ children }) {
            return (
              <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap">
                {children}
              </td>
            );
          },
          p({ children }) {
            return <p className="my-2">{children}</p>;
          },
          h1({ children }) {
            return <h1 className="text-2xl font-bold my-3">{children}</h1>;
          },
          h2({ children }) {
            return <h2 className="text-xl font-bold my-2">{children}</h2>;
          },
          h3({ children }) {
            return <h3 className="text-lg font-semibold my-2">{children}</h3>;
          },
          ul({ children }) {
            return <ul className="list-disc list-inside my-2 space-y-1">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="list-decimal list-inside my-2 space-y-1">{children}</ol>;
          },
          li({ children }) {
            return <li className="ml-4">{children}</li>;
          },
          blockquote({ children }) {
            return (
              <blockquote className="border-l-4 border-gray-300 pl-4 italic my-2 text-gray-600 dark:text-gray-400">
                {children}
              </blockquote>
            );
          },
          a({ href, children }) {
            return (
              <a
                href={href}
                className="text-blue-600 hover:text-blue-800 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {children}
              </a>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
