import React, { useState, useEffect } from 'react';
import ReactMarkdown from "react-markdown"
import 'github-markdown-css';
import axios from 'axios';
import { DIRECTUS_URL } from '../../constants/declarations'
import RightRail from '../RightNavigation/rightRail';
import SearchTasks from './components/taskResults';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { dark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw'
import rehypeGithubAlerts from 'rehype-github-alert'
import { CopyToClipboard } from 'react-copy-to-clipboard';
import Chatbot from "../RightNavigation/Chatbot";


export default function TaskResultsComponent(task_type) {
    const [markdownText, setMarkdownText] = useState('');
    const title = task_type.task_type;
    const [copiedIndex, setCopiedIndex] = useState(null);
    const [presetQuestions, setPresetQuestions] = useState(null);

    const handleCopy = (index) => {
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000); // Reset after 2 seconds
    };

    let codeBlockIndex = -1;
    // const navigate = useNavigate();
    // let jwtToken = getCookie('jwtToken');

    // useEffect(() => {
    //     let jwtToken = getCookie('jwtToken');
    //     if(jwtToken===undefined || jwtToken === '') {
    //         navigate('/routing');
    //     }
    // },[]);

    useEffect(() => {
        setPresetQuestions([
            { title: `What is ${title} of single-cell sequencing data analysis ?`, "prompt": `Explain ${title} in single-cell sequencing data analysis.` },
            { title: `What is the purpose of the ${title} task?`, "prompt": `Explain the purpose of the ${title} task in single-cell sequencing data analysis.` },
            { title: `How do I interpret the results of the ${title} task?`, "prompt": `How do I interpret the results of the ${title} task in single-cell sequencing data analysis?` },
            { title: `Are there any best practices for using the ${title} task?`, "prompt": `Are there any best practices for using the ${title} task in single-cell sequencing data analysis?` }
        ]);
        console.log("presetQuestions:", presetQuestions);

        async function fetchFileData() {
            try {
                const response = await axios.get(DIRECTUS_URL + "/items/filemappings?filter[filename]=" + title.replace(/ /g, "_"));
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="task-results-container eighty-twenty-grid">
            <div className="main-content task-builder-task">
                <h1 style={{ textAlign: "left" }}>{title}</h1>
                <hr />
                <h2>Datasets</h2>
                <p><SearchTasks taskType={task_type} /></p>
                <hr />
                <p><ReactMarkdown
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
                /></p>
            </div>
            <div className="right-rail">
                <RightRail />
                <Chatbot presetQuestions={presetQuestions} />
            </div>
        </div>
    );
}

// export default TaskResultsComponent;
