import { useState, useEffect } from "react"
import axios from 'axios';
import ReactMarkdown from "react-markdown"
import 'github-markdown-css';
// import rehypeRaw from 'rehype-raw'
// import rehypeSanitize from 'rehype-sanitize'
// import LeftNav from "../components/LeftNavigation/leftNav";
// import gfm from "remark-gfm";
// import remarkImgToJsx from "remark-unwrap-images";
import LeftNav from "../components/LeftNavigation/leftnavDoc";
// import RightRail from "../components/RightNavigation/rightRail";
import { DIRECTUS_URL } from '../constants/declarations'

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { dark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw'
import rehypeGithubAlerts from 'rehype-github-alert'
import { CopyToClipboard } from 'react-copy-to-clipboard';
import MarkdownNavbar from 'markdown-navbar';
// The default style of markdown-navbar should be imported additionally
import './navbar.css';
import Chatbot from "../components/RightNavigation/Chatbot";


// Extract visible text from a rendered Markdown AST node.
const getMarkdownNodeText = (node) => {
    if (!node) return '';
    if (node.type === 'text') return node.value || '';
    return Array.isArray(node.children)
        ? node.children.map(getMarkdownNodeText).join('')
        : '';
};


export default function Doc() {
    const [markdownText, setMarkdownText] = useState('');
    const [copiedIndex, setCopiedIndex] = useState(null);
    const [uniqueFilter, setUniqueFilter] = useState(() => {
        const params = new URLSearchParams(window.location.search);
        return params.get('doc')?.trim() || '';
    });

    const handleFilterSelection = (filter) => {
        setUniqueFilter(filter);
        console.log(filter);
    };

    const handleCopy = (index) => {
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000); // Reset after 2 seconds
    };

    let codeBlockIndex = -1;

    useEffect(() => {
        async function fetchFileData() {
            if (!uniqueFilter || uniqueFilter === '') {
                try {
                    const localResponse = await fetch('/markdown/doc/docs_overview.md');

                    if (localResponse.ok) {
                        const contentType =
                            localResponse.headers.get('content-type') || '';

                        const markdownData = await localResponse.text();

                        // Detect HTML returned by React's SPA fallback
                        const isHtml =
                            contentType.includes('text/html') ||
                            /^\s*(<!doctype\s+html|<html\b)/i.test(markdownData);

                        if (!isHtml) {
                            setMarkdownText(markdownData);

                            console.log(
                                'Markdown loaded from local file:',
                                '/markdown/doc/docs_overview.md'
                            );

                            return;
                        }
                    }

                    console.log('Local Markdown not found. Falling back to Directus API.');
                    return;

                } catch (error) {
                    console.warn('Unable to load local Markdown:', error);
                    return;
                }
            }

            // 1. Check whether the local Markdown file exists
            const filename = uniqueFilter.replace(/ /g, "_");
            const localFilePath = `/markdown/doc/${encodeURIComponent(filename)}.md`;

            try {
                const localResponse = await fetch(localFilePath);

                if (localResponse.ok) {
                    const contentType =
                        localResponse.headers.get('content-type') || '';

                    const markdownData = await localResponse.text();

                    // Detect HTML returned by React's SPA fallback
                    const isHtml =
                        contentType.includes('text/html') ||
                        /^\s*(<!doctype\s+html|<html\b)/i.test(markdownData);

                    if (!isHtml) {
                        setMarkdownText(markdownData);
                        
                        console.log(
                            'Markdown loaded from local file:',
                            localFilePath
                        );

                        return;
                    }
                }

                console.log('Local Markdown not found. Falling back to Directus API.');

            } catch (error) {
                console.warn('Unable to load local Markdown:', error);
            }

            // 2. Fall back to the Directus API
            try {
                const response = await axios.get(
                    `${DIRECTUS_URL}/items/filemappings?filter[filename]=${encodeURIComponent(filename)}`
                );

                const data = response.data.data;

                if (data.length === 1) {
                    const fileID = data[0].fileID;

                    if (fileID != null) {
                        const fileResponse = await fetch(
                            `${DIRECTUS_URL}/assets/${fileID}`
                        );

                        if (!fileResponse.ok) {
                            throw new Error(
                                `Failed to fetch Markdown: ${fileResponse.status}`
                            );
                        }

                        const markdownData = await fileResponse.text();
                        setMarkdownText(markdownData);

                        console.log('Markdown loaded from Directus:', fileID);
                        return;
                    }
                }

                console.warn('Markdown document not found:', uniqueFilter);

            } catch (error) {
                console.error('Error retrieving Markdown from Directus:', error);
            }
        }
            
        fetchFileData();
    }, [uniqueFilter]);

    return (
        <div className="doc-container">
            <div className="left-nav">
                <LeftNav uniqueFilter={uniqueFilter} setUniqueFilter={setUniqueFilter} handleFilterSelection={handleFilterSelection} />
            </div>
            <div className='main-content'>
                {/* Render the selected filter details in the middle of the page */}
                {markdownText !== "" && (
                    <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw, rehypeGithubAlerts]}
                        children={markdownText}
                        components={{
                            p({ node, children, style, ...props }) {
                                // Center figure captions without changing the Markdown source.
                                // Example: *Figure 10. Download an integration-and-annotation result.*
                                const isFigureCaption = /^Figure\s+\d+[a-z]?\s*[.:]/i.test(
                                    getMarkdownNodeText(node).trim()
                                );

                                return (
                                    <p
                                        {...props}
                                        style={{
                                            ...style,
                                            ...(isFigureCaption ? { textAlign: 'center' } : {}),
                                        }}
                                    >
                                        {children}
                                    </p>
                                );
                            },
                            img({ node, alt, style, ...props }) {
                                return (
                                    <img
                                        {...props}
                                        alt={alt ?? ''}
                                        style={{
                                            ...style,
                                            display: 'block',
                                            marginLeft: 'auto',
                                            marginRight: 'auto',
                                            maxWidth: '100%',
                                            height: 'auto',
                                        }}
                                    />
                                );
                            },
                            code(props) {
                                const { children, inline, className, node, ...rest } = props;
                                const match = /language-(\w+)/.exec(className || '');
                                if (!inline && match) {
                                    codeBlockIndex++;

                                    const currentIndex = codeBlockIndex;
                                    const codeText = String(children).replace(/\n$/, '');

                                    return (
                                        <div style={{ position: 'relative' }}>
                                            <SyntaxHighlighter
                                                {...rest}
                                                PreTag="div"
                                                children={codeText}
                                                language={match[1]}
                                                style={dark}
                                            />
                                            <CopyToClipboard text={codeText} onCopy={() => handleCopy(currentIndex)}>
                                                <button style={{
                                                    position: 'absolute',
                                                    top: '5px',
                                                    right: '5px',
                                                    background: '#333',
                                                    color: '#fff',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    padding: '5px 10px',
                                                }}>{copiedIndex === currentIndex ? 'Copied!' : 'Copy'}</button>
                                            </CopyToClipboard>
                                        </div>
                                    );
                                }

                                // Fallback for inline code or unknown language
                                return (
                                    <code {...rest} className={className}>
                                        {children}
                                    </code>
                                );
                            }
                        }}
                    />
                )}
                {markdownText === "" && (
                    <div className="tool-message">
                        <p>Please select a <strong>Topic</strong> from the left navigation.</p>
                    </div>
                )}

            </div>
            <div className="right-rail navigation">
                <aside className="markdown-sidebar">
                    <MarkdownNavbar
                        source={markdownText}
                        ordered={false}
                        headingTopOffset={80}
                    />
                </aside>
                <Chatbot presetQuestions={null} />
            </div>
        </div>
    )
}