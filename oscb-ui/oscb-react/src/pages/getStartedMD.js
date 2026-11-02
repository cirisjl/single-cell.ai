import { useState, useEffect } from "react"
import axios from 'axios';
import ReactMarkdown from "react-markdown"
import 'github-markdown-css';
// import LeftNav from "../components/LeftNavigation/leftNav";
// import rehypeRaw from 'rehype-raw'
// import rehypeSanitize from 'rehype-sanitize'
import RightRail from "../components/RightNavigation/rightRail";
import { DIRECTUS_URL } from '../constants/declarations'
import { getCookie } from "../utils/utilFunctions";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { dark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw'
import rehypeGithubAlerts from 'rehype-github-alert'
import { CopyToClipboard } from 'react-copy-to-clipboard';


// Extract visible text from a rendered Markdown AST node.
const getMarkdownNodeText = (node) => {
    if (!node) return '';
    if (node.type === 'text') return node.value || '';
    return Array.isArray(node.children)
        ? node.children.map(getMarkdownNodeText).join('')
        : '';
};


export default function GetStarted() {
    const [markdownText, setMarkdownText] = useState('');
    const [copiedIndex, setCopiedIndex] = useState(null);

    const handleCopy = (index) => {
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000); // Reset after 2 seconds
    };

    let codeBlockIndex = -1;
    let jwtToken = getCookie('jwtToken');

    useEffect(() => {
        async function fetchFileData() {
            const localFilePath = `/markdown/getstarted.md`;

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

            try {
                const response = await axios.get(DIRECTUS_URL + "/items/filemappings?filter[filename]=getstarted");
                const data = response.data.data;

                if (data.length === 1) {
                    const fileMappingObject = data[0];
                    const fileID = fileMappingObject.fileID;
                    if (fileID !== null) {
                        fetch(DIRECTUS_URL + "/assets/" + fileID)
                            .then(response => response.text())
                            .then(data => setMarkdownText(data))
                            .catch(error => console.error('Error retrieving markdown:', error));
                    }
                }

            } catch (error) {
                console.error('Error retrieving data:', error);
            }
        }

        fetchFileData();
    }, []);

    return (

        <div className="getStarted-container">

            <div className="left-nav">
                {/* <LeftNav /> */}
            </div>

            <div className={(jwtToken === undefined || jwtToken === '') ? 'main-content-no-scroll' : 'main-content'}>
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
            </div>

            <div className="right-rail">
                <RightRail />
            </div>

            <div style={{ display: 'none' }}>
                <script type='text/javascript' id='clustrmaps' src='//cdn.clustrmaps.com/map_v2.js?cl=fcfafa&w=a&t=tt&d=lOyy3dFp22wbqbeXPEE1e2nJSb_u_4KqYJPohHA8M4I&co=d8e1e8&cmo=f4acba&cmn=ff5353&ct=494545'></script>
            </div>

        </div>
    )
}