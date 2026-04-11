import { useState, useEffect } from "react"
import axios from 'axios';
import ReactMarkdown from "react-markdown"
import 'github-markdown-css';
// import rehypeRaw from 'rehype-raw'
// import rehypeSanitize from 'rehype-sanitize'
// import LeftNav from "../components/LeftNavigation/leftNav";

import RightRail from "../components/RightNavigation/rightRail";
import { DIRECTUS_URL } from '../constants/declarations'
// import { getCookie } from "../utils/utilFunctions";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { dark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw'
import rehypeGithubAlerts from 'rehype-github-alert'
import { CopyToClipboard } from 'react-copy-to-clipboard';
import Chatbot from "../components/RightNavigation/Chatbot";

export default function Benchmarks() {
    const [markdownText, setMarkdownText] = useState('');
    // let jwtToken = getCookie('jwtToken');
    const [copiedIndex, setCopiedIndex] = useState(null);

    const handleCopy = (index) => {
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000); // Reset after 2 seconds
    };

    let codeBlockIndex = -1;

    useEffect(() => {
        async function fetchFileData() {
            try {
                const response = await axios.get(DIRECTUS_URL + "/items/filemappings?filter[filename]=benchmarks");
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
        <div className="benchmarks-container">
            <div className="left-nav">
            </div>
            <div className='main-content'>
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw, rehypeGithubAlerts]}
                    children={markdownText}
                    components={{
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
                <Chatbot presetQuestions={null} />
            </div>
        </div >
    )
}